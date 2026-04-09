import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import {
  anthropic,
  buildAgentSystemPrompt, AGENT_TOOLS, executeTool, getToolMeta,
  MANIFEST_TOOL, SECTION_TOOL,
  buildManifestPrompt, buildSectionPrompt, assembleSections,
  getDesignPresetForManifest,
  type SiteManifest,
} from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rate-limit'
import { scrapeUrl, extractUrl } from '@/lib/scrape'
import { getRelevantTemplates, buildTemplateContext } from '@/lib/scraped-templates'
import { parse as babelParse } from '@babel/parser'
import type Anthropic from '@anthropic-ai/sdk'

// ─── TSX syntax validator ──────────────────────────────────────────────────────
// Returns null if valid, a short error string if not.
function validateTSX(code: string): string | null {
  try {
    babelParse(code, {
      sourceType: 'module',
      plugins:    ['typescript', 'jsx'],
      errorRecovery: false,
    })
    return null
  } catch (err: any) {
    const loc = err.loc ? ` (${err.loc.line}:${err.loc.column})` : ''
    return `${err.message?.split('\n')[0] ?? 'Syntax error'}${loc}`
  }
}

export const maxDuration = 300

const MAX_ITERATIONS = 6

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Extract partial code from a streaming (incomplete) JSON input blob
function extractPartialCode(partialJson: string): string | null {
  const idx = partialJson.indexOf('"code"')
  if (idx === -1) return null
  const colonIdx = partialJson.indexOf(':', idx + 6)
  if (colonIdx === -1) return null
  const quoteIdx = partialJson.indexOf('"', colonIdx + 1)
  if (quoteIdx === -1) return null
  const raw = partialJson.slice(quoteIdx + 1)
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

const ImageSchema = z.object({
  base64:   z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  url:      z.string().url(),
})

const GenerateSchema = z.object({
  siteId:  z.string().uuid(),
  message: z.string().max(2000),
  // legacy single-image field (kept for backward compat)
  image:  ImageSchema.optional(),
  // new multi-image field
  images: z.array(ImageSchema).max(4).optional(),
}).refine(d => d.message.trim().length > 0 || d.image !== undefined || (d.images && d.images.length > 0), {
  message: 'Message or image required',
})

// ─── Sequential initial generation ───────────────────────────────────────────
// Phase 1: manifest call (fast, ~300 tokens, forced JSON)
// Phase 2: one section at a time, each gets previous sections as context
// Streams section_start / code_stream / section_done events to client

async function runSequentialGeneration(opts: {
  siteId:      string
  siteName:    string
  siteType:    string
  message:     string
  safeSend:    (data: object) => void
  tag:         string
}): Promise<string | null> {
  const { siteId, siteName, siteType, message, safeSend, tag } = opts
  const appUrl        = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'
  const formEndpoint  = `${appUrl}/api/forms/${siteId}`
  const shopEndpoint  = siteType === 'bakery' ? `${appUrl}/api` : null
  const shopSiteId    = siteType === 'bakery' ? siteId : null

  const designPreset = getDesignPresetForManifest(siteType, message)

  // ── Reference templates (Supabase) — text context only, no vision ──────────
  let templateCtx = ''
  try {
    const refTemplates = await getRelevantTemplates(siteType, message, 3)
    templateCtx = buildTemplateContext(refTemplates)
    if (refTemplates.length > 0) {
      console.log(`${tag} 📚 templates=[${refTemplates.map(t => t.name).join(', ')}]`)
    }
  } catch (err) {
    console.warn(`${tag} ⚠️  template lookup failed (non-blocking):`, err)
  }

  // ── Phase 1: Manifest ──────────────────────────────────────────────────────
  console.log(`${tag} 📋 manifest phase`)
  safeSend({ chunk: `Analyse de ta demande pour **${siteName}**…\n` })

  const userContent = `Business : ${siteName}\nType : ${siteType}\nDemande : ${message}`

  const manifestRes = await anthropic.messages.create({
    model:       'claude-sonnet-4-6',
    max_tokens:  1500,
    system:      buildManifestPrompt(designPreset, templateCtx),
    tools:       [MANIFEST_TOOL],
    tool_choice: { type: 'tool', name: 'create_manifest' },
    messages:    [{ role: 'user', content: userContent }],
  })

  const manifestBlock = manifestRes.content.find(b => b.type === 'tool_use' && b.name === 'create_manifest')
  if (!manifestBlock || manifestBlock.type !== 'tool_use') {
    throw new Error('Manifest generation failed')
  }
  const manifest = manifestBlock.input as SiteManifest
  console.log(`${tag} 📋 manifest OK  sections=[${manifest.sections.map(s => s.id).join(',')}]`)

  // Announce the plan to the user
  const plan = manifest.sections
    .filter(s => s.id !== 'nav' && s.id !== 'footer')
    .map((s, i) => `${'①②③④⑤⑥⑦⑧'[i] ?? `${i + 1}.`} ${s.spec.split('.')[0]}`)
    .join('\n')
  safeSend({ chunk: `\nVoici ce que je construis pour **${manifest.businessName}** :\n\n${plan}\n\nGénération en cours ⚡\n` })

  // ── Phase 2: Sequential sections ──────────────────────────────────────────
  const completed: Array<{ component: string; code: string }> = []
  let previousCode = ''

  const MAX_SECTION_RETRIES = 2

  for (const section of manifest.sections) {
    console.log(`${tag} 🔨 section ${section.id} (${section.component})`)
    safeSend({ section_start: { id: section.id, component: section.component, label: section.spec.split('.')[0] } })

    let syntaxError: string | null = null
    let accepted = false

    for (let attempt = 0; attempt <= MAX_SECTION_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`${tag}   🔁 retry ${attempt} for ${section.id} — error: ${syntaxError}`)
          safeSend({ section_retry: { id: section.id, attempt, error: syntaxError?.slice(0, 120) } })
        }

        const sectionPrompt = buildSectionPrompt(manifest, section, previousCode, formEndpoint, syntaxError, shopEndpoint, shopSiteId)

        const sectionStream = anthropic.messages.stream({
          model:       'claude-sonnet-4-6',
          max_tokens:  3000,
          system:      sectionPrompt,
          tools:       [SECTION_TOOL],
          tool_choice: { type: 'tool', name: 'write_section' },
          messages:    [{ role: 'user', content: `Écris le composant ${section.component} maintenant.` }],
        })

        let sectionPartialJson = ''
        let lastStreamedLen = 0

        sectionStream.on('streamEvent', (event: any) => {
          if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
            sectionPartialJson += event.delta.partial_json ?? ''
            const partial = extractPartialCode(sectionPartialJson)
            if (partial && partial.length - lastStreamedLen > 200) {
              lastStreamedLen = partial.length
              safeSend({ code_stream: partial })
            }
          }
        })

        const sectionResponse = await sectionStream.finalMessage()
        const sectionBlock = sectionResponse.content.find(
          b => b.type === 'tool_use' && b.name === 'write_section'
        )

        if (!sectionBlock || sectionBlock.type !== 'tool_use') {
          console.warn(`${tag}   ⚠️  ${section.id} returned no tool block`)
          break
        }

        const input = sectionBlock.input as { code?: string }
        const code  = (input.code ?? '').trim()
        if (!code) {
          console.warn(`${tag}   ⚠️  ${section.id} returned empty code`)
          break
        }

        // ── Syntax validation ──────────────────────────────────────────
        syntaxError = validateTSX(code)
        if (syntaxError) {
          console.warn(`${tag}   ⚠️  ${section.id} syntax error (attempt ${attempt + 1}): ${syntaxError}`)
          if (attempt < MAX_SECTION_RETRIES) continue   // retry with error in prompt
          // Final attempt still invalid — accept it anyway (Babel in preview may be more lenient)
          console.warn(`${tag}   ⚠️  ${section.id} accepting despite syntax error after ${MAX_SECTION_RETRIES + 1} attempts`)
        } else {
          console.log(`${tag}   ✅ ${section.id}  lines=${code.split('\n').length}${attempt > 0 ? ` (fixed on attempt ${attempt + 1})` : ''}`)
        }

        completed.push({ component: section.component, code })
        previousCode = completed.map(s => s.code).join('\n\n')
        safeSend({ code_update: assembleSections(completed), section_done: section.id })
        accepted = true
        break

      } catch (sectionErr) {
        console.error(`${tag}   ❌ ${section.id} attempt ${attempt + 1} threw:`, sectionErr)
        if (attempt >= MAX_SECTION_RETRIES) break
      }
    }

    if (!accepted) {
      safeSend({ section_done: section.id, section_skipped: true })
    }
  }

  if (completed.length === 0) return null

  const finalCode = assembleSections(completed)
  console.log(`${tag} ✅ all sections done  totalLines=${finalCode.split('\n').length}`)

  // ── Fire-and-forget screenshot (background, non-blocking) ─────────────────
  fetch(`${appUrl}/api/screenshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId }),
  }).catch(err => console.warn(`${tag} ⚠️  screenshot skipped:`, err?.message))

  return finalCode
}

// ─── POST /api/generate — SSE streaming ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const safeClose = () => { if (!closed) { closed = true; try { controller.close() } catch {} } }
      const safeSend  = (data: object) => {
        if (!closed) try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch { closed = true }
      }

      try {
        safeSend({ thinking: true })

        // ── Auth ──────────────────────────────────────────────────────────
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { safeSend({ error: 'Non autorisé' }); safeClose(); return }

        // ── Validate ──────────────────────────────────────────────────────
        const body = await req.json()
        const { siteId, message, image, images: imagesRaw } = GenerateSchema.parse(body)
        // Normalise: merge legacy `image` + new `images` into one array
        const allImages = [...(imagesRaw ?? []), ...(image ? [image] : [])].slice(0, 4)

        // ── Rate limit ────────────────────────────────────────────────────
        const { allowed, limit } = await checkRateLimit(user.id)
        if (!allowed) {
          safeSend({ error: `Limite journalière atteinte (${limit} générations/jour). Passe à Pro pour des générations illimitées.`, upgrade: true })
          safeClose(); return
        }

        // ── Fetch site ────────────────────────────────────────────────────
        const { data: site } = await supabaseAdmin
          .from('sites').select('id, html, user_id, type, name')
          .eq('id', siteId).eq('user_id', user.id).single()
        if (!site) { safeSend({ error: 'Site introuvable' }); safeClose(); return }

        const tag = `[agent:${siteId.slice(0, 8)}]`
        const isInitial = !site.html

        console.log(`${tag} ▶ START  initial=${isInitial}  msg="${message.slice(0, 80)}"`)

        let finalCode: string | null = null
        let finalNote = 'Site mis à jour.'
        let askQuestion: string | null = null
        let fullText = ''   // accumulates all streamed text for message save

        // Wrap safeSend to also capture text chunks
        const safeSendTracked = (data: object) => {
          if ('chunk' in data && typeof (data as any).chunk === 'string') {
            fullText += (data as any).chunk
          }
          safeSend(data)
        }

        // ── INITIAL GENERATION: sequential section approach ────────────────
        if (isInitial) {
          finalCode = await runSequentialGeneration({
            siteId, siteName: site.name, siteType: site.type ?? 'landing',
            message, safeSend: safeSendTracked, tag,
          })

          if (finalCode) {
            finalNote = `Site ${site.name} généré`
            safeSendTracked({ chunk: `\n\n✓ Site prêt ! Voici quelques améliorations possibles :\n• Ajouter une galerie photo\n• Intégrer un formulaire de contact\n• Personnaliser les couleurs et textes` })
          }

        // ── EDIT: existing agent loop ─────────────────────────────────────
        } else {
          const { data: history } = await supabaseAdmin
            .from('messages').select('role, content')
            .eq('site_id', siteId).order('created_at', { ascending: true }).limit(20)

          type TextBlock  = { type: 'text'; text: string }
          type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
          const userContent: (TextBlock | ImageBlock)[] = []

          if (allImages.length > 0) {
            for (const img of allImages) {
              userContent.push({ type: 'image', source: { type: 'base64', media_type: img.mimeType, data: img.base64 } })
            }
            userContent.push({ type: 'text', text: [
              message ? `Instruction : ${message}` : '',
              `URLs publiques : ${allImages.map(img => img.url).join(', ')}`,
              `Utilise ${allImages.length > 1 ? 'ces images' : 'cette image'} dans le site si pertinent.`,
            ].filter(Boolean).join('\n') })
          } else {
            const detectedUrl = extractUrl(message)
            const urlContext  = detectedUrl ? await scrapeUrl(detectedUrl) : null
            const text = urlContext ? `${message}\n\n---\n[Contenu extrait]\n${urlContext}` : message
            userContent.push({ type: 'text', text })
          }

          let currentCode = site.html || ''
          const agentMessages: Anthropic.MessageParam[] = [
            ...(history || []).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
            { role: 'user', content: allImages.length > 0 ? userContent : (userContent[0] as TextBlock).text },
          ]

          for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            console.log(`${tag} ── iteration ${iteration + 1}/${MAX_ITERATIONS}`)

            const claudeStream = anthropic.messages.stream({
              model:       'claude-sonnet-4-6',
              max_tokens:  16000,
              system:      buildAgentSystemPrompt(currentCode, site.type, site.id, message),
              tools:       AGENT_TOOLS,
              tool_choice: { type: 'auto' },
              messages:    agentMessages,
            })

            let partialJson    = ''
            let activeToolName = ''
            let lastStreamedLen = 0

            claudeStream.on('text', (text: string) => safeSendTracked({ chunk: text }))

            claudeStream.on('streamEvent', (event: any) => {
              if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
                partialJson    = ''
                activeToolName = event.content_block.name
                lastStreamedLen = 0
              }
              if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
                if (activeToolName === 'write_code') {
                  partialJson += event.delta.partial_json ?? ''
                  const partial = extractPartialCode(partialJson)
                  if (partial && partial.length - lastStreamedLen > 300) {
                    lastStreamedLen = partial.length
                    safeSend({ code_stream: partial })
                  }
                }
              }
            })

            const response = await claudeStream.finalMessage()
            const usage    = response.usage
            console.log(`${tag}    stop=${response.stop_reason} in=${usage.input_tokens} out=${usage.output_tokens}`)

            if (response.stop_reason === 'max_tokens') {
              const partialTools = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
              agentMessages.push({ role: 'assistant', content: response.content })
              agentMessages.push({
                role: 'user',
                content: partialTools.length > 0
                  ? partialTools.map(t => ({ type: 'tool_result' as const, tool_use_id: t.id, content: 'Interrompu — réécris en version plus courte.', is_error: true }))
                  : 'Limite de tokens. Continue avec write_code en version compacte (max 800 lignes).',
              })
              continue
            }

            if (response.stop_reason === 'end_turn') {
              const tb = response.content.find(b => b.type === 'text')
              if (tb && tb.type === 'text' && tb.text.trim()) finalNote = tb.text.trim().split('\n')[0].slice(0, 120)
              break
            }

            if (response.stop_reason === 'tool_use') {
              const toolBlocks   = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
              const toolResults: Anthropic.ToolResultBlockParam[] = []

              for (const tb of toolBlocks) {
                const input = tb.input as Record<string, any>
                const meta  = getToolMeta(tb.name, input)
                safeSend({ tool_start: { name: tb.name, icon: meta.icon, label: meta.label } })

                const result = await executeTool(tb.name, input, currentCode)

                if (tb.name === 'ask_user') {
                  askQuestion = result.askQuestion || null
                  toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: 'Question posée.' })
                } else if (result.error) {
                  toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: `Erreur : ${result.error}`, is_error: true })
                } else if (result.info) {
                  // Informational result (e.g. search_unsplash) — no code change, pass data back to agent
                  toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: result.info })
                } else if (result.code) {
                  const syntaxErr = validateTSX(result.code)
                  if (syntaxErr) {
                    // Feed the exact error back so the agent fixes it in the next iteration
                    console.warn(`${tag}  ⚠️  ${tb.name} syntax error: ${syntaxErr}`)
                    toolResults.push({
                      type: 'tool_result', tool_use_id: tb.id, is_error: true,
                      content: `Erreur de syntaxe TSX — le code a été rejeté par le parser :\n${syntaxErr}\n\nCauses fréquentes : apostrophes non échappées dans des strings single-quotées (utilise des backticks \`...\`), virgules manquantes, JSX mal fermé. Corrige et rappelle le tool.`,
                    })
                  } else {
                    currentCode = result.code
                    finalCode   = result.code
                    if (result.note) finalNote = result.note
                    safeSend({ code_update: result.code })
                    toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: 'Succès.' })
                  }
                } else {
                  toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: 'Succès.' })
                }
              }

              agentMessages.push({ role: 'assistant', content: response.content })
              agentMessages.push({ role: 'user', content: toolResults })
              if (askQuestion) break
            }
          }
        }

        // ── Save site code first (most critical) ─────────────────────────
        let versionLimitHit = false
        if (finalCode) {
          const { error: siteErr, data: savedSite } = await supabaseAdmin
            .from('sites')
            .update({ html: finalCode, updated_at: new Date().toISOString() })
            .eq('id', siteId)
            .select('id')
            .single()
          if (siteErr) {
            console.error(`${tag} ❌ site save error:`, siteErr)
            safeSend({ saveError: `Erreur lors de la sauvegarde : ${siteErr.message}` })
          } else {
            console.log(`${tag} 💾 saved  codeLen=${finalCode.length}  id=${savedSite?.id}`)
          }

          try {
            const { isAdminUser } = await import('@/lib/admin')
            const { PLANS }       = await import('@/lib/stripe')
            const { data: profile } = await supabaseAdmin.from('profiles').select('plan').eq('id', user.id).single()
            const plan        = (profile?.plan ?? 'free') as keyof typeof PLANS
            const maxVersions = isAdminUser(user.id) ? Infinity : (PLANS[plan] ?? PLANS.free).maxVersionsPerSite
            const { count }   = await supabaseAdmin.from('versions').select('id', { count: 'exact', head: true }).eq('site_id', siteId)

            if (maxVersions === Infinity || (count ?? 0) < maxVersions) {
              await supabaseAdmin.from('versions').insert({ site_id: siteId, user_id: user.id, html: finalCode, note: finalNote })
            } else {
              versionLimitHit = true
            }
          } catch (vErr) {
            console.error(`${tag} ⚠️  version save error (non-blocking):`, vErr)
          }
        }

        // ── Save messages ─────────────────────────────────────────────────
        const savedUserContent = allImages.length > 0
          ? `${message} [images: ${allImages.map(i => i.url).join(', ')}]`
          : message
        // Save the full streamed text (reflexion + plan), fallback to note
        const savedNote = askQuestion
          ? `[Question] ${askQuestion}`
          : (fullText.trim() || finalNote)
        const [umRes, amRes] = await Promise.all([
          supabaseAdmin.from('messages').insert({ site_id: siteId, user_id: user.id, role: 'user',      content: savedUserContent }),
          supabaseAdmin.from('messages').insert({ site_id: siteId, user_id: user.id, role: 'assistant', content: savedNote }),
        ])
        if (umRes.error) console.error(`${tag} ❌ user msg save error:`, umRes.error)
        if (amRes.error) console.error(`${tag} ❌ ai msg save error:`,   amRes.error)

        // ── Done ──────────────────────────────────────────────────────────
        safeSend({
          done: true,
          code: finalCode,
          note: finalNote,
          ...(askQuestion      ? { ask: askQuestion } : {}),
          ...(versionLimitHit  ? { upgrade: true }    : {}),
        })
        safeClose()

      } catch (err) {
        console.error('[generate] error:', err)
        const msg = err instanceof z.ZodError ? 'Entrée invalide'
          : err instanceof Error ? err.message : 'Erreur serveur'
        safeSend({ error: msg })
        safeClose()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}

// ─── PUT /api/generate — initial generation (non-streaming, legacy) ───────────
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { siteId, name, type, description, templateSchema } = await req.json()
    const { data: site } = await supabaseAdmin.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).single()
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

    const { generateInitialSite } = await import('@/lib/anthropic')
    const desc     = templateSchema ? `Template fourni: ${templateSchema.slice(0, 500)}` : description
    const siteCode = await generateInitialSite({ name, type, description: desc, siteId })

    await Promise.all([
      supabaseAdmin.from('versions').insert({ site_id: siteId, user_id: user.id, html: siteCode, note: 'Version initiale' }),
      supabaseAdmin.from('sites').update({ html: siteCode }).eq('id', siteId),
    ])

    return NextResponse.json({ code: siteCode, success: true })
  } catch (err) {
    console.error('[generate/initial]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
