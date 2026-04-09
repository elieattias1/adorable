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

// ── Anonymized name pool ───────────────────────────────────────────────────────
const ANON_NAMES = [
  'Boulangerie Artisanale', 'Au Pain Doré', 'La Fournée', 'Maison du Pain',
  'Le Fournil', 'Pains & Saveurs', 'La Mie Dorée', 'Au Levain', 'Le Pétrin',
  'Boulangerie du Quartier', 'Pain de Tradition', "L'Artisan Boulanger",
  'La Boulange', 'Au Bon Pain', 'Le Fournil Artisanal',
]

// ── System prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un expert en création de sites web de boulangeries artisanales en React + Tailwind CSS.

Tu vas recevoir le screenshot d'une vraie boulangerie parisienne.
Ton objectif : t'inspirer de son STYLE VISUEL (palette, typographie, ambiance) pour créer
un site complet et anonymisé pour une boulangerie fictive.

═══ ANONYMISATION OBLIGATOIRE ═══════════════════════════════════════
⚠️  INTERDIT d'utiliser le vrai nom, adresse, téléphone, email, Instagram, URLs réels.
• Nom → le nom fictif fourni dans la demande
• Adresse → "12 rue du Marché, 75011 Paris"
• Téléphone → "01 42 00 00 00"
• Email → "bonjour@[slug-fictif].fr"
• Instagram → "@boulangerie_artisanale"
• Photos → uniquement des URLs Unsplash (liste ci-dessous)
══════════════════════════════════════════════════════════════════════

═══ PHOTOS UNSPLASH AUTORISÉES ══════════════════════════════════════
Utilise UNIQUEMENT ces URLs (une seule fois chacune) :
Hero        : https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&h=1080&fit=crop
Baguette    : https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&h=800&fit=crop
Croissant   : https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=800&fit=crop
Pain choc.  : https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=800&fit=crop
Pain levain : https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800&h=800&fit=crop
Brioche     : https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=800&h=800&fit=crop
Éclair      : https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&h=800&fit=crop
Macaron     : https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&h=800&fit=crop
Tarte citron: https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=800&h=800&fit=crop
Mille-feuille: https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=800&fit=crop
Intérieur   : https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=800&fit=crop
Boulanger   : https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=800&h=800&fit=crop
Sandwich    : https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop
══════════════════════════════════════════════════════════════════════

═══ SECTIONS REQUISES (7 obligatoires) ══════════════════════════════
1. NavSection      — logo + liens (Accueil, Nos pains, À propos, Horaires, Commander)
2. HeroSection     — grande image hero + accroche unique + CTA "Commander maintenant"
3. ProduitsSection — grille 3 colonnes, 6 produits avec photo/nom/prix (en euros)
4. NotreHistoireSection — texte artisanal + photo intérieur, savoir-faire
5. HorairesSection — tableau horaires + adresse + plan (iframe Google Maps fictif OK)
6. AvisSection     — 3 avis clients fictifs avec prénom + note étoiles
7. FooterSection   — liens + réseaux sociaux fictifs + copyright
══════════════════════════════════════════════════════════════════════

═══ CONTRAINTES TECHNIQUES ══════════════════════════════════════════
• React 18 — useState / useEffect autorisés
• Tailwind CSS v3 UNIQUEMENT (pas de CSS inline)
• lucide-react pour les icônes
• Pas de TypeScript — JSX pur
• Responsive : mobile-first, breakpoints md:/lg:
• py-20 minimum sur chaque section
• Formulaire de commande : fetch('/api/forms/preview', { method: 'POST', ... })
══════════════════════════════════════════════════════════════════════

═══ FORMAT DU CODE ══════════════════════════════════════════════════
\`\`\`
import { useState, useEffect } from 'react'
import { SomeIcon } from 'lucide-react'

function NavSection() { ... }
function HeroSection() { ... }
// ... 5 autres sections ...

export default function App() {
  return (
    <div>
      <NavSection />
      <HeroSection />
      ...
    </div>
  )
}
\`\`\`
• Chaque section = une fonction nommée PascalCase
• UN SEUL export default function App() à la fin
• Tous les imports en haut
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
async function replicateSite(refSite, anonName) {
  if (!refSite.screenshot_url) throw new Error('no screenshot_url')

  const screenshot = await fetchScreenshot(refSite.screenshot_url)

  // Build message content
  const contentParts = []

  // Vision: screenshot (style reference only — content will be anonymized)
  contentParts.push({
    type: 'image',
    source: { type: 'base64', media_type: screenshot.mediaType, data: screenshot.base64 },
  })

  // Text: ask for full anonymized website inspired by the screenshot style
  const textContent = `Voici le screenshot d'une vraie boulangerie parisienne de référence.

Inspire-toi de son STYLE VISUEL (palette de couleurs, typographie, ambiance, mise en page)
pour créer un site complet pour la boulangerie fictive : "${anonName}".

⚠️ N'utilise PAS le vrai nom de la boulangerie du screenshot — utilise UNIQUEMENT "${anonName}".
⚠️ Génère les 7 sections obligatoires (Nav, Hero, Produits, Histoire, Horaires, Avis, Footer).
⚠️ Contenu fictif mais réaliste : produits typiques, prix cohérents, horaires d'une vraie boulangerie.`

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
  const site     = sites[i]
  const anonName = ANON_NAMES[i % ANON_NAMES.length]
  const tag      = `[${String(i + 1).padStart(3, '0')}/${sites.length}]`

  process.stdout.write(`${tag} ${site.name.padEnd(35)} → "${anonName}" `)

  if (DRY_RUN) { console.log('(dry run)'); ok++; continue }

  try {
    const reactCode = await replicateSite(site, anonName)

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
