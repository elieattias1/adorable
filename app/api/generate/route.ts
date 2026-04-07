import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { anthropic, buildAgentSystemPrompt, AGENT_TOOLS, executeTool, getToolMeta } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rate-limit'
import { scrapeUrl, extractUrl } from '@/lib/scrape-url'
import type Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

const MAX_ITERATIONS = 6

// Extract partial code string from a streaming (incomplete) JSON input blob
// The tool input looks like: {"code":"import React...\n...","note":"..."}
function extractPartialCode(partialJson: string): string | null {
  const idx = partialJson.indexOf('"code"')
  if (idx === -1) return null
  const colonIdx = partialJson.indexOf(':', idx + 6)
  if (colonIdx === -1) return null
  const quoteIdx = partialJson.indexOf('"', colonIdx + 1)
  if (quoteIdx === -1) return null
  // Everything after the opening quote — unescape basic JSON sequences
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

// POST /api/generate — agent loop streaming via SSE
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
        // ── Auth ────────────────────────────────────────────────────────────
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { safeSend({ error: 'Non autorisé' }); safeClose(); return }

        // ── Validate ────────────────────────────────────────────────────────
        const body = await req.json()
        const { siteId, message, image } = GenerateSchema.parse(body)

        // ── Rate limit ──────────────────────────────────────────────────────
        const { allowed, limit } = await checkRateLimit(user.id)
        if (!allowed) {
          safeSend({ error: `Limite journalière atteinte (${limit} générations/jour). Passe à Pro pour des générations illimitées.`, upgrade: true })
          safeClose(); return
        }

        // ── Fetch site ──────────────────────────────────────────────────────
        const { data: site } = await supabaseAdmin
          .from('sites').select('id, html, user_id, type, name')
          .eq('id', siteId).eq('user_id', user.id).single()
        if (!site) { safeSend({ error: 'Site introuvable' }); safeClose(); return }

        // ── Message history ─────────────────────────────────────────────────
        const { data: history } = await supabaseAdmin
          .from('messages').select('role, content')
          .eq('site_id', siteId).order('created_at', { ascending: true }).limit(20)

        // ── Build initial user message ──────────────────────────────────────
        type TextBlock  = { type: 'text'; text: string }
        type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

        const userContent: (TextBlock | ImageBlock)[] = []

        if (image) {
          userContent.push({ type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } })
          userContent.push({ type: 'text', text: [
            message ? `Instruction : ${message}` : '',
            `URL publique de l'image : ${image.url}`,
            `Utilise cette image dans le site si pertinent. Ne la mets jamais dans un champ texte.`,
          ].filter(Boolean).join('\n') })
        } else {
          const detectedUrl = extractUrl(message)
          const urlContext = detectedUrl ? await scrapeUrl(detectedUrl) : null
          const text = urlContext ? `${message}\n\n---\n[Contenu extrait de la page]\n${urlContext}` : message
          userContent.push({ type: 'text', text })
        }

        // ── Agent loop ──────────────────────────────────────────────────────
        const tag = `[agent:${siteId.slice(0, 8)}]`
        let currentCode: string = site.html || ''
        let finalCode: string | null = null
        let finalNote = 'Site mis à jour.'
        let askQuestion: string | null = null

        console.log(`${tag} ▶ START  msg="${message.slice(0, 80)}" codeLen=${currentCode.length}`)

        // Conversation messages for Claude
        const agentMessages: Anthropic.MessageParam[] = [
          ...(history || []).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
          { role: 'user', content: image ? userContent : (userContent[0] as TextBlock).text },
        ]

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
          console.log(`${tag} ── iteration ${iteration + 1}/${MAX_ITERATIONS}`)

          const claudeStream = anthropic.messages.stream({
            model:       'claude-sonnet-4-6',
            max_tokens:  16000,
            system:      buildAgentSystemPrompt(currentCode, site.type, site.id),
            tools:       AGENT_TOOLS,
            tool_choice: { type: 'auto' },
            messages:    agentMessages,
          })

          let chunkCount = 0
          let partialJson = ''
          let activeToolName = ''
          let lastStreamedLen = 0

          claudeStream.on('text', (text: string) => {
            safeSend({ chunk: text })
            chunkCount++
          })

          // Stream tool input deltas so the client can show code being written live
          claudeStream.on('streamEvent', (event: any) => {
            if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
              partialJson = ''
              activeToolName = event.content_block.name
              lastStreamedLen = 0
            }
            if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
              if (activeToolName === 'write_code') {
                partialJson += event.delta.partial_json ?? ''
                const partial = extractPartialCode(partialJson)
                // Throttle: only send every ~300 chars to avoid flooding
                if (partial && partial.length - lastStreamedLen > 300) {
                  lastStreamedLen = partial.length
                  safeSend({ code_stream: partial })
                }
              }
            }
          })

          const response = await claudeStream.finalMessage()
          const usage = response.usage
          console.log(`${tag}    stop=${response.stop_reason} chunks=${chunkCount} in=${usage.input_tokens} out=${usage.output_tokens}`)

          // ── Max tokens hit ─────────────────────────────────────────────
          if (response.stop_reason === 'max_tokens') {
            console.warn(`${tag} ⚠️  max_tokens — injecting retry`)
            // Partial tool_use blocks need tool_result responses or the API rejects the next turn
            const partialTools = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
            agentMessages.push({ role: 'assistant', content: response.content })
            if (partialTools.length > 0) {
              agentMessages.push({
                role: 'user',
                content: [
                  ...partialTools.map(t => ({
                    type: 'tool_result' as const,
                    tool_use_id: t.id,
                    content: 'Interrompu (limite de tokens). Réécris en version plus courte.',
                    is_error: true,
                  })),
                ],
              })
            } else {
              agentMessages.push({
                role: 'user',
                content: 'Tu as atteint la limite de tokens. Continue en appelant write_code avec une version plus compacte (max 800 lignes) — garde toutes les sections mais optimise la répétition avec des tableaux.',
              })
            }
            continue
          }

          // ── End turn: Claude is done ───────────────────────────────────
          if (response.stop_reason === 'end_turn') {
            const textBlock = response.content.find(b => b.type === 'text')
            if (textBlock && textBlock.type === 'text' && textBlock.text.trim()) {
              finalNote = textBlock.text.trim().split('\n')[0].slice(0, 120)
            }
            console.log(`${tag} ■ END_TURN  note="${finalNote}"`)
            break
          }

          // ── Tool use: execute each tool ───────────────────────────────
          if (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
            const toolResults: Anthropic.ToolResultBlockParam[] = []

            for (const toolBlock of toolUseBlocks) {
              const input = toolBlock.input as Record<string, any>
              const meta  = getToolMeta(toolBlock.name, input)

              console.log(`${tag}    🔧 ${toolBlock.name}  note="${input.note || ''}"`)

              // Tell client a tool is being called
              safeSend({ tool_start: { name: toolBlock.name, icon: meta.icon, label: meta.label } })

              const t0 = Date.now()
              const result = executeTool(toolBlock.name, input, currentCode)
              const elapsed = Date.now() - t0

              if (toolBlock.name === 'ask_user') {
                console.log(`${tag}    💬 ask_user: "${result.askQuestion}"`)
                askQuestion = result.askQuestion || null
                toolResults.push({
                  type:        'tool_result',
                  tool_use_id: toolBlock.id,
                  content:     'Question posée à l\'utilisateur.',
                })
              } else if (result.error) {
                console.error(`${tag}    ❌ ${toolBlock.name} ERROR: ${result.error}`)
                toolResults.push({
                  type:        'tool_result',
                  tool_use_id: toolBlock.id,
                  content:     `Erreur : ${result.error}`,
                  is_error:    true,
                })
              } else if (result.code) {
                console.log(`${tag}    ✅ ${toolBlock.name} OK  codeLen=${result.code.length} (${elapsed}ms)`)
                currentCode = result.code
                finalCode   = result.code
                if (result.note) finalNote = result.note

                safeSend({ code_update: result.code })

                toolResults.push({
                  type:        'tool_result',
                  tool_use_id: toolBlock.id,
                  content:     'Succès. Code mis à jour.',
                })
              } else {
                console.log(`${tag}    ✅ ${toolBlock.name} OK (no code, ${elapsed}ms)`)
                toolResults.push({
                  type:        'tool_result',
                  tool_use_id: toolBlock.id,
                  content:     'Succès.',
                })
              }
            }

            agentMessages.push({ role: 'assistant', content: response.content })
            agentMessages.push({ role: 'user', content: toolResults })

            if (askQuestion) break
          }
        }

        // ── Save user + assistant messages ──────────────────────────────
        const savedUserContent = image
          ? `${message}${message ? ' ' : ''}[image: ${image.url}]`
          : message
        const savedNote = askQuestion ? `[Question] ${askQuestion}` : finalNote

        await Promise.all([
          supabaseAdmin.from('messages').insert({ site_id: siteId, user_id: user.id, role: 'user', content: savedUserContent }),
          supabaseAdmin.from('messages').insert({ site_id: siteId, user_id: user.id, role: 'assistant', content: savedNote }),
        ])

        // ── Save version + update DB ────────────────────────────────────
        let versionLimitHit = false
        if (finalCode) {
          const { isAdminUser } = await import('@/lib/admin')
          const { PLANS } = await import('@/lib/stripe')
          const { data: profile } = await supabaseAdmin.from('profiles').select('plan').eq('id', user.id).single()
          const plan = (profile?.plan ?? 'free') as keyof typeof PLANS
          const planLimits = PLANS[plan] ?? PLANS.free
          const maxVersions = isAdminUser(user.id) ? Infinity : planLimits.maxVersionsPerSite
          const { count } = await supabaseAdmin.from('versions').select('id', { count: 'exact', head: true }).eq('site_id', siteId)

          if (maxVersions === Infinity || (count ?? 0) < maxVersions) {
            await supabaseAdmin.from('versions').insert({ site_id: siteId, user_id: user.id, html: finalCode, note: finalNote })
          } else {
            versionLimitHit = true
          }
          await supabaseAdmin.from('sites').update({ html: finalCode, updated_at: new Date().toISOString() }).eq('id', siteId)
          console.log(`${tag} 💾 saved  codeLen=${finalCode.length}  note="${finalNote}"`)
        } else {
          console.log(`${tag} ⚠️  no finalCode — nothing saved`)
        }

        // ── Done ─────────────────────────────────────────────────────────
        console.log(`${tag} ✔ DONE`)
        safeSend({
          done: true,
          code: finalCode,
          note: finalNote,
          ...(askQuestion ? { ask: askQuestion } : {}),
          ...(versionLimitHit ? { upgrade: true } : {}),
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

// PUT /api/generate — initial site generation (non-streaming)
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { siteId, name, type, description, templateSchema } = await req.json()

    const { data: site } = await supabaseAdmin.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).single()
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

    let siteCode: string

    if (templateSchema) {
      // Legacy template: generate code from it by using it as context
      const { generateInitialSite } = await import('@/lib/anthropic')
      siteCode = await generateInitialSite({ name, type, description: `Template fourni: ${templateSchema.slice(0, 500)}`, siteId })
    } else {
      const { generateInitialSite } = await import('@/lib/anthropic')
      siteCode = await generateInitialSite({ name, type, description, siteId })
    }

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
