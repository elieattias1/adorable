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
import { scrapeUrl, extractUrl } from '@/lib/scrape-url'
import type Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

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

const GenerateSchema = z.object({
  siteId:  z.string().uuid(),
  message: z.string().max(2000),
  image: z.object({
    base64:   z.string(),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    url:      z.string().url(),
  }).optional(),
}).refine(d => d.message.trim().length > 0 || d.image !== undefined, { message: 'Message or image required' })

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'
  const formEndpoint = `${appUrl}/api/forms/${siteId}`

  const designPreset = getDesignPresetForManifest(siteType, message)

  // ── Phase 1: Manifest ──────────────────────────────────────────────────────
  console.log(`${tag} 📋 manifest phase`)
  safeSend({ chunk: `Analyse de ta demande pour **${siteName}**…\n` })

  const manifestRes = await anthropic.messages.create({
    model:       'claude-sonnet-4-6',
    max_tokens:  1500,
    system:      buildManifestPrompt(designPreset),
    tools:       [MANIFEST_TOOL],
    tool_choice: { type: 'tool', name: 'create_manifest' },
    messages:    [{ role: 'user', content: `Business : ${siteName}\nType : ${siteType}\nDemande : ${message}` }],
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

  for (const section of manifest.sections) {
    console.log(`${tag} 🔨 section ${section.id} (${section.component})`)
    safeSend({ section_start: { id: section.id, component: section.component, label: section.spec.split('.')[0] } })

    try {
      const sectionPrompt = buildSectionPrompt(manifest, section, previousCode, formEndpoint)

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

      if (sectionBlock && sectionBlock.type === 'tool_use') {
        const input = sectionBlock.input as { code?: string }
        const code  = (input.code ?? '').trim()
        if (code) {
          completed.push({ component: section.component, code })
          previousCode = completed.map(s => s.code).join('\n\n')
          const partialAssembled = assembleSections(completed)
          safeSend({ code_update: partialAssembled, section_done: section.id })
          console.log(`${tag}   ✅ ${section.id}  lines=${code.split('\n').length}`)
        } else {
          console.warn(`${tag}   ⚠️  ${section.id} returned empty code — skipping`)
          safeSend({ section_done: section.id, section_skipped: true })
        }
      } else {
        console.warn(`${tag}   ⚠️  ${section.id} returned no tool block — skipping`)
        safeSend({ section_done: section.id, section_skipped: true })
      }
    } catch (sectionErr) {
      // One section failing must NOT abort the whole generation
      console.error(`${tag}   ❌ ${section.id} error:`, sectionErr)
      safeSend({ section_done: section.id, section_skipped: true })
      // Continue to next section with whatever context we have
    }
  }

  if (completed.length === 0) return null

  const finalCode = assembleSections(completed)
  console.log(`${tag} ✅ all sections done  totalLines=${finalCode.split('\n').length}`)
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
        const { siteId, message, image } = GenerateSchema.parse(body)

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

        // ── INITIAL GENERATION: sequential section approach ────────────────
        if (isInitial) {
          finalCode = await runSequentialGeneration({
            siteId, siteName: site.name, siteType: site.type ?? 'landing',
            message, safeSend, tag,
          })

          if (finalCode) {
            finalNote = `Site ${site.name} généré`
            safeSend({ chunk: `\n\n✓ Site prêt ! Voici quelques améliorations possibles :\n• Ajouter une galerie photo\n• Intégrer un formulaire de contact\n• Personnaliser les couleurs et textes` })
          }

        // ── EDIT: existing agent loop ─────────────────────────────────────
        } else {
          const { data: history } = await supabaseAdmin
            .from('messages').select('role, content')
            .eq('site_id', siteId).order('created_at', { ascending: true }).limit(20)

          type TextBlock  = { type: 'text'; text: string }
          type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
          const userContent: (TextBlock | ImageBlock)[] = []

          if (image) {
            userContent.push({ type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } })
            userContent.push({ type: 'text', text: [
              message ? `Instruction : ${message}` : '',
              `URL publique de l'image : ${image.url}`,
              `Utilise cette image dans le site si pertinent.`,
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
            { role: 'user', content: image ? userContent : (userContent[0] as TextBlock).text },
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

            claudeStream.on('text', (text: string) => safeSend({ chunk: text }))

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

                const result = executeTool(tb.name, input, currentCode)

                if (tb.name === 'ask_user') {
                  askQuestion = result.askQuestion || null
                  toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: 'Question posée.' })
                } else if (result.error) {
                  toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: `Erreur : ${result.error}`, is_error: true })
                } else if (result.code) {
                  currentCode = result.code
                  finalCode   = result.code
                  if (result.note) finalNote = result.note
                  safeSend({ code_update: result.code })
                  toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: 'Succès.' })
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

        // ── Save messages ─────────────────────────────────────────────────
        const savedUserContent = image ? `${message} [image: ${image.url}]` : message
        const savedNote = askQuestion ? `[Question] ${askQuestion}` : finalNote
        await Promise.all([
          supabaseAdmin.from('messages').insert({ site_id: siteId, user_id: user.id, role: 'user',      content: savedUserContent }),
          supabaseAdmin.from('messages').insert({ site_id: siteId, user_id: user.id, role: 'assistant', content: savedNote }),
        ])

        // ── Save version + update DB ──────────────────────────────────────
        let versionLimitHit = false
        if (finalCode) {
          const { isAdminUser } = await import('@/lib/admin')
          const { PLANS }       = await import('@/lib/stripe')
          const { data: profile } = await supabaseAdmin.from('profiles').select('plan').eq('id', user.id).single()
          const plan      = (profile?.plan ?? 'free') as keyof typeof PLANS
          const maxVersions = isAdminUser(user.id) ? Infinity : (PLANS[plan] ?? PLANS.free).maxVersionsPerSite
          const { count } = await supabaseAdmin.from('versions').select('id', { count: 'exact', head: true }).eq('site_id', siteId)

          if (maxVersions === Infinity || (count ?? 0) < maxVersions) {
            await supabaseAdmin.from('versions').insert({ site_id: siteId, user_id: user.id, html: finalCode, note: finalNote })
          } else {
            versionLimitHit = true
          }
          await supabaseAdmin.from('sites').update({ html: finalCode, updated_at: new Date().toISOString() }).eq('id', siteId)
          console.log(`${tag} 💾 saved  codeLen=${finalCode.length}`)
        }

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
