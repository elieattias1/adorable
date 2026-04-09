#!/usr/bin/env node
/**
 * scripts/replicate-reference-sites.mjs
 *
 * For each row in reference_sites (with a screenshot_url):
 *   1. Fetch the screenshot → send as vision to Claude
 *   2. Optionally fetch the HTML from html_url → provide as context
 *   3. Ask Claude to replicate the design as React + Tailwind CSS
 *      in a format compatible with our live renderer
 *   4. Save the resulting react_code back to reference_sites.react_code
 *
 * Usage:
 *   node scripts/replicate-reference-sites.mjs
 *   node scripts/replicate-reference-sites.mjs --dry-run
 *   node scripts/replicate-reference-sites.mjs --slug=a-lacroix
 *   node scripts/replicate-reference-sites.mjs --min-score=8
 *   node scripts/replicate-reference-sites.mjs --industry=Boulangerie
 *   node scripts/replicate-reference-sites.mjs --skip-existing   (skip rows that already have react_code)
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient }  from '@supabase/supabase-js'
import Anthropic         from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── Load .env.local ────────────────────────────────────────────────────────────
function loadEnv() {
  const p = path.join(ROOT, '.env.local')
  if (!fs.existsSync(p)) throw new Error('.env.local not found')
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
}
loadEnv()

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Args ───────────────────────────────────────────────────────────────────────
const args          = process.argv.slice(2)
const DRY_RUN       = args.includes('--dry-run')
const SKIP_EXISTING = args.includes('--skip-existing')
const ONLY_SLUG     = args.find(a => a.startsWith('--slug='))?.slice(7) ?? null
const MIN_SCORE     = parseInt(args.find(a => a.startsWith('--min-score='))?.slice(12) ?? '7')
const ONLY_INDUSTRY = args.find(a => a.startsWith('--industry='))?.slice(11) ?? null

// ── Tool schema ────────────────────────────────────────────────────────────────
const WRITE_SITE_TOOL = {
  name: 'write_react_site',
  description: 'Writes the complete React + Tailwind site code that replicates the reference screenshot.',
  input_schema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The full React site code — named section functions + a default App export.',
      },
    },
    required: ['code'],
  },
}

// ── System prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un expert en réplication visuelle de sites web en React + Tailwind CSS.

Tu vas recevoir :
- Le screenshot d'un vrai site web
- Optionnellement son HTML source

Ta mission est de répliquer ce site en React + Tailwind CSS pour notre moteur de rendu.

═══ CONTRAINTES DU MOTEUR DE RENDU ════════════════════════════════════
• React 18 — useState / useEffect autorisés
• Tailwind CSS v3 — UNIQUEMENT des classes Tailwind pour le style (pas de CSS inline sauf variables)
• lucide-react — pour les icônes (import { IconName } from 'lucide-react')
• PAS d'autres dépendances externes
• Pas de TypeScript — JavaScript JSX pur
• Pas d'images locales — utilise les URLs Unsplash ou placeholder via https://picsum.photos
• Google Fonts via @import dans un <style> tag ou via className (Tailwind ne charge pas les fonts)
• Les formulaires : fetch('/api/forms/preview', { method: 'POST', ... })
══════════════════════════════════════════════════════════════════════

═══ FORMAT REQUIS ════════════════════════════════════════════════════
Le code doit suivre exactement ce format :

\`\`\`
import { useState, useEffect } from 'react'
import { SomeIcon } from 'lucide-react'

function NavSection() {
  return ( ... )
}

function HeroSection() {
  return ( ... )
}

// ... autres sections ...

export default function App() {
  return (
    <div>
      <NavSection />
      <HeroSection />
      // ... autres sections ...
    </div>
  )
}
\`\`\`

RÈGLES :
1. Chaque section est une fonction nommée (PascalCase)
2. UN SEUL export default function App() à la fin
3. Toutes les imports en haut du fichier
4. Contenu réaliste — reprend fidèlement les textes/couleurs/layout du screenshot
5. Si le screenshot montre des produits avec des prix → reproduis-les
6. Si le screenshot montre des horaires, adresse, téléphone → reproduis-les
7. Responsive : mobile-first avec breakpoints md:/lg:
8. Qualité professionnelle — reproduis fidèlement le style visuel
══════════════════════════════════════════════════════════════════════

Appelle write_react_site avec le code complet.`

// ── Fetch and encode screenshot ────────────────────────────────────────────────
async function fetchScreenshot(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`screenshot fetch failed: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ct  = res.headers.get('content-type') ?? 'image/png'
  const mediaType = ct.includes('jpeg') || ct.includes('jpg') ? 'image/jpeg'
    : ct.includes('webp') ? 'image/webp'
    : ct.includes('gif')  ? 'image/gif'
    : 'image/png'
  return { base64: buf.toString('base64'), mediaType }
}

// ── Fetch and truncate HTML ────────────────────────────────────────────────────
async function fetchHtml(url, maxChars = 12000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const text = await res.text()
    // Strip scripts and styles (to save tokens), keep structure/content
    const cleaned = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    return cleaned.length > maxChars ? cleaned.slice(0, maxChars) + '\n... [truncated]' : cleaned
  } catch {
    return null
  }
}

// ── Replicate one site ─────────────────────────────────────────────────────────
async function replicateSite(refSite) {
  if (!refSite.screenshot_url) throw new Error('no screenshot_url')

  const screenshot = await fetchScreenshot(refSite.screenshot_url)

  // Build message content
  const contentParts = []

  // Vision: screenshot
  contentParts.push({
    type: 'image',
    source: { type: 'base64', media_type: screenshot.mediaType, data: screenshot.base64 },
  })

  // Text: description + optional HTML
  let textContent = `Voici le screenshot du site "${refSite.name}" (${refSite.industry}).
URL : ${refSite.url}
Site type : ${refSite.site_type}

Reproduis fidèlement ce site en React + Tailwind CSS selon les contraintes du moteur de rendu.`

  // Append HTML if available
  if (refSite.html_url) {
    const html = await fetchHtml(refSite.html_url)
    if (html) {
      textContent += `\n\n━━ HTML SOURCE (extrait) ━━\n${html}`
    }
  }

  contentParts.push({ type: 'text', text: textContent })

  // Call Claude
  let lastErr = null
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await anthropic.messages.create({
        model:       'claude-opus-4-6',
        max_tokens:  8000,
        system:      SYSTEM_PROMPT,
        tools:       [WRITE_SITE_TOOL],
        tool_choice: { type: 'tool', name: 'write_react_site' },
        messages:    [{ role: 'user', content: contentParts }],
      })

      const block = res.content.find(b => b.type === 'tool_use' && b.name === 'write_react_site')
      const code  = block?.input?.code?.trim()
      if (!code) throw new Error(`no code in tool response (stop_reason=${res.stop_reason})`)
      return code
    } catch (err) {
      lastErr = err
      if (attempt < 2) {
        process.stdout.write(` [retry ${attempt + 1}]`)
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  throw lastErr
}

// ── Main ───────────────────────────────────────────────────────────────────────
let query = supabase
  .from('reference_sites')
  .select('id, slug, name, url, industry, site_type, screenshot_url, html_url, quality_score')
  .not('screenshot_url', 'is', null)
  .gte('quality_score', MIN_SCORE)
  .order('quality_score', { ascending: false })
  .limit(ONLY_SLUG ? 1000 : 100)

if (ONLY_INDUSTRY) query = query.eq('industry', ONLY_INDUSTRY)

const { data: refSites, error } = await query
if (error) { console.error(error); process.exit(1) }

let sites = ONLY_SLUG ? refSites.filter(s => s.slug === ONLY_SLUG) : refSites

if (SKIP_EXISTING) {
  const { data: existing } = await supabase
    .from('reference_sites')
    .select('slug')
    .not('react_code', 'is', null)
    .in('slug', sites.map(s => s.slug))
  const existingSlugs = new Set((existing ?? []).map(r => r.slug))
  const before = sites.length
  sites = sites.filter(s => !existingSlugs.has(s.slug))
  console.log(`  ✓ ${existingSlugs.size} already have react_code — skipping`)
}

console.log(`\n🔁  Replicating ${sites.length} reference sites (min score: ${MIN_SCORE})${DRY_RUN ? ' — DRY RUN' : ''}\n`)

let ok = 0, failed = 0

for (let i = 0; i < sites.length; i++) {
  const site = sites[i]
  const tag  = `[${String(i + 1).padStart(3, '0')}/${sites.length}]`

  process.stdout.write(`${tag} ${site.name.padEnd(40)} `)

  if (DRY_RUN) { console.log('(dry run)'); ok++; continue }

  try {
    const reactCode = await replicateSite(site)

    const { error: upsertErr } = await supabase
      .from('reference_sites')
      .update({ react_code: reactCode })
      .eq('id', site.id)

    if (upsertErr) throw new Error(upsertErr.message)

    console.log(`✅  ${reactCode.split('\n').length} lines`)
    ok++
  } catch (err) {
    console.log(`❌  ${err.message}`)
    failed++
  }
}

console.log(`\n✅  ${ok} replicated, ❌ ${failed} failed\n`)
