#!/usr/bin/env node
/**
 * scripts/generate-bakery-templates.mjs
 *
 * For each row in reference_sites (industry = 'Boulangerie', quality_score >= MIN_SCORE):
 *   1. Pick an anonymized name (e.g. "Boulangerie Artisanale", "Café du Pain")
 *   2. Run the exact same manifest → section pipeline as the editor
 *      (with vision: passes the reference screenshot to the manifest call)
 *   3. Assemble all sections into a single React string
 *   4. Upsert into `templates` with react_code set, industry='Boulangerie'
 *
 * Usage:
 *   node scripts/generate-bakery-templates.mjs
 *   node scripts/generate-bakery-templates.mjs --dry-run
 *   node scripts/generate-bakery-templates.mjs --slug=a-lacroix
 *   node scripts/generate-bakery-templates.mjs --min-score=8
 *   node scripts/generate-bakery-templates.mjs --skip-existing   (skip slugs already in templates)
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
const args         = process.argv.slice(2)
const DRY_RUN      = args.includes('--dry-run')
const SKIP_EXISTING = args.includes('--skip-existing')
const ONLY_SLUG    = args.find(a => a.startsWith('--slug='))?.slice(7) ?? null
const MIN_SCORE    = parseInt(args.find(a => a.startsWith('--min-score='))?.slice(12) ?? '7')

// ── Anonymized name pool ───────────────────────────────────────────────────────
// These generic names replace real bakery names in generated code.
// We rotate through them so each template gets a distinct placeholder.
const ANON_NAMES = [
  'Boulangerie Artisanale',
  'Au Pain Doré',
  'La Fournée',
  'Maison du Pain',
  'Le Fournil',
  'Pains & Saveurs',
  'La Mie Dorée',
  'Au Levain',
  'Le Pétrin',
  'Boulangerie du Quartier',
  'Pain de Tradition',
  'L\'Artisan Boulanger',
  'La Boulange',
  'Au Bon Pain',
  'Le Fournil Artisanal',
  'Maison Artisanale',
  'La Pâtisserie du Coin',
  'Pain & Viennoiseries',
  'Le Pain Quotidien Artisan',
  'Boulangerie Tradition',
]

// ── Design preset for boulangerie (matches lib/ai/design-presets.ts) ───────────
// NOTE: Rotates between 3 palette/layout variants to ensure visual diversity
const BOULANGERIE_PRESETS = [
  // Variant A — CLAIR terracotta (most common)
  `DESIGN SYSTEM — Boulangerie de Quartier (mode CLAIR, chaleureux) :
• Fond : #fffbf5 | Accent : #c2410c (terracotta) | Secondaire : #92400e
• Surfaces : bg-white border border-orange-100 rounded-2xl shadow-sm
• Texte : text-stone-900 titres, text-stone-600 corps, text-orange-700 prix
• Typo : Playfair Display 700 titres de sections, Inter 400/500 reste
• Hero : SPLIT 50/50 — titre UNIQUE inventé + badge horaires + CTA, photo produits

PHOTOS — utilise chaque URL UNE SEULE FOIS :
Hero : https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&h=1080&fit=crop
Baguette : https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&h=800&fit=crop
Croissant : https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=800&fit=crop
Pain chocolat : https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=800&fit=crop
Pain levain : https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800&h=800&fit=crop
Brioche : https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=800&h=800&fit=crop
Tarte citron : https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=800&h=800&fit=crop
Macaron : https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&h=800&fit=crop
Sandwich : https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop

PRODUITS — sélectionne 6 variés (ne pas mettre les mêmes que les autres templates) :
Pains : Baguette 1,20€ | Levain 4,50€ | Campagne 3,80€
Viennoiseries : Croissant 1,40€ | Pain chocolat 1,50€ | Brioche 3,20€ | Chausson pommes 1,80€
Pâtisseries : Tarte citron 4,20€ | Macaron x3 4,50€ | Éclair 3,50€
Snacks : Sandwich jambon-beurre 4,50€

SECTIONS :
1. NavSection | 2. HeroSection | 3. ProduitsSection | 4. NotreHistoireSection | 5. HorairesEtAdresseSection | 6. AvisClientsSection | 7. FooterSection`,

  // Variant B — SOMBRE doré artisanal
  `DESIGN SYSTEM — Boulangerie Artisanale (dark warm) :
• Fond : #120900 (brun nuit) | Accent : #d4a853 (doré beurre) | Secondaire : #8B4513
• Surfaces : bg-[#1e1008]/80 border border-[#d4a853]/20 rounded-3xl
• Texte : text-[#f9efd7] titres, text-[#c4a882] corps
• Typo : Playfair Display italic titres et produits, Inter descriptions
• Hero : PLEIN ÉCRAN h-screen, overlay gradient from-[#120900]/80, texte centré

PHOTOS — utilise chaque URL UNE SEULE FOIS :
Hero : https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=1920&h=1080&fit=crop
Croissant : https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=800&h=800&fit=crop
Pain levain : https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&h=800&fit=crop
Éclair : https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=800&fit=crop
Opéra : https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop
Mille-feuille : https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=800&fit=crop
Brioche : https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=800&fit=crop
Tarte framboise : https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&h=800&fit=crop

PRODUITS — sélectionne 6 variés axés sur les pâtisseries premium :
Opéra 5,50€ | Mille-feuille 4,80€ | Éclair chocolat 3,50€ | Pain levain 4,50€ | Croissant 1,40€ | Tarte framboise 4,50€

SECTIONS :
1. NavSection | 2. HeroSection | 3. ProduitsVedettesSection | 4. NotreHistoireSection | 5. HorairesAdresseSection | 6. AvisClientsSection | 7. FooterSection`,

  // Variant C — BLANC luxueux pâtisserie
  `DESIGN SYSTEM — Pâtisserie Fine (mode CLAIR, luxueux) :
• Fond : #fdf9f6 | Accent : #b45309 (ambre caramel) | Secondaire : #fde68a
• Surfaces : bg-white border border-amber-100 rounded-3xl shadow-md
• Texte : text-stone-900 titres, text-stone-600 corps
• Typo : Playfair Display italic géant (text-6xl+) hero, Inter léger descriptions
• Hero : MINIMAL CENTRÉ — fond crème, titre Playfair italic UNIQUE, photo gâteau signature

PHOTOS — utilise chaque URL UNE SEULE FOIS :
Hero : https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1920&h=1080&fit=crop
Macaron : https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&h=800&fit=crop
Tarte citron : https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800&h=800&fit=crop
Opéra : https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&h=800&fit=crop
Chausson : https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=800&h=800&fit=crop
Pain raisins : https://images.unsplash.com/photo-1583338917451-face2751d8d5?w=800&h=800&fit=crop
Financier : https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800&h=800&fit=crop
Baguette : https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=800&h=800&fit=crop

PRODUITS — sélectionne 6 variés axés pâtisserie fine et viennoiseries :
Macaron x3 4,50€ | Tarte citron 4,20€ | Opéra 5,50€ | Chausson pommes 1,80€ | Pain raisins 1,60€ | Financier 2,20€

SECTIONS :
1. NavSection | 2. HeroSection | 3. CollectionSection | 4. SavoirFaireSection | 5. HorairesAdresseSection | 6. AvisClientsSection | 7. FooterSection`,
]

// ── Tool schemas (mirrors lib/ai/manifest.ts) ──────────────────────────────────
const MANIFEST_TOOL = {
  name: 'create_manifest',
  description: 'Creates the complete design manifest and ordered section plan.',
  input_schema: {
    type: 'object',
    properties: {
      businessName: { type: 'string' },
      industry:     { type: 'string' },
      design: {
        type: 'object',
        properties: {
          mode:        { type: 'string', enum: ['dark', 'light'] },
          bg:          { type: 'string' },
          surface:     { type: 'string' },
          accent:      { type: 'string' },
          accentHover: { type: 'string' },
          headingText: { type: 'string' },
          bodyText:    { type: 'string' },
          mutedText:   { type: 'string' },
          border:      { type: 'string' },
          headingFont: { type: 'string', enum: ['Playfair Display', 'Inter'] },
          radius:      { type: 'string' },
          tone:        { type: 'string' },
        },
        required: ['mode','bg','surface','accent','accentHover','headingText','bodyText','mutedText','border','headingFont','radius','tone'],
      },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id:        { type: 'string' },
            component: { type: 'string' },
            spec:      { type: 'string' },
          },
          required: ['id', 'component', 'spec'],
        },
      },
      unsplashUrls: { type: 'array', items: { type: 'string' } },
    },
    required: ['businessName', 'industry', 'design', 'sections', 'unsplashUrls'],
  },
}

const SECTION_TOOL = {
  name: 'write_section',
  description: 'Writes a single React section component.',
  input_schema: {
    type: 'object',
    properties: { code: { type: 'string' } },
    required: ['code'],
  },
}

// ── Assemble sections into a single App component ─────────────────────────────
function assembleSections(sections) {
  // Parse all imports, merge named imports by module, strip from section bodies
  const namedByModule = {}  // module → Set of named imports
  const sideEffects   = []  // side-effect imports (no specifiers)

  const stripped = sections.map(s => {
    const lines = s.code.split('\n')
    const body  = []
    for (const line of lines) {
      const trimmed = line.trim()
      // named: import { A, B } from 'module'
      const namedMatch = trimmed.match(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/)
      if (namedMatch) {
        const mod     = namedMatch[2]
        const names   = namedMatch[1].split(',').map(n => n.trim()).filter(Boolean)
        if (!namedByModule[mod]) namedByModule[mod] = new Set()
        names.forEach(n => namedByModule[mod].add(n))
        continue
      }
      // side-effect or default import — keep as-is (deduplicate by string)
      if (/^import\s/.test(trimmed)) {
        if (!sideEffects.includes(trimmed)) sideEffects.push(trimmed)
        continue
      }
      body.push(line)
    }
    return { ...s, code: body.join('\n').replace(/^\n+/, '') }
  })

  const mergedImports = [
    ...Object.entries(namedByModule).map(([mod, names]) =>
      `import { ${[...names].join(', ')} } from '${mod}'`
    ),
    ...sideEffects,
  ].join('\n')

  const fns  = stripped.map(s => s.code).join('\n\n')
  const calls = stripped.map(s => `  <${s.component} />`).join('\n')
  return `${mergedImports}\n\n${fns}\n\nexport default function App() {\n  return (\n    <div>\n${calls}\n    </div>\n  )\n}\n`
}

// ── Generate React code for one reference site ─────────────────────────────────
async function generateForSite(refSite, anonName, idx) {
  const tag = `[${String(idx).padStart(3,'0')}]`

  // ── Phase 1: Manifest (with vision if screenshot available) ───────────────
  const preset = BOULANGERIE_PRESETS[idx % BOULANGERIE_PRESETS.length]
  const systemPrompt = `Tu es un expert en design de sites web. Tu analyses une demande et produis un manifest complet.\n\n${preset}\n\nRÈGLES :\n- businessName : utilise EXACTEMENT le nom fourni\n- industry : "boulangerie"\n- design : respecte STRICTEMENT les valeurs du design system ci-dessus\n- sections : 6 à 7 sections selon le design system\n- unsplashUrls : utilise les URLs du design system\n\nAppelle create_manifest avec le manifest complet.`

  const userContentParts = []

  // Attach screenshot if available (vision context)
  if (refSite.screenshot_url) {
    try {
      const res = await fetch(refSite.screenshot_url)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        userContentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: buf.toString('base64') },
        })
        userContentParts.push({
          type: 'text',
          text: `Voici le screenshot d'une vraie boulangerie parisienne de référence. Inspire-toi de son ambiance, ses couleurs et sa mise en page pour générer le site de "${anonName}". Ce site doit avoir exactement le même niveau de qualité et de charme. Business : ${anonName} (boulangerie artisanale parisienne).`,
        })
      }
    } catch {}
  }

  if (userContentParts.length === 0) {
    userContentParts.push({ type: 'text', text: `Business : ${anonName}\nType : boulangerie artisanale parisienne` })
  }

  const manifestRes = await anthropic.messages.create({
    model:       'claude-opus-4-6',
    max_tokens:  8000,
    system:      systemPrompt,
    tools:       [MANIFEST_TOOL],
    tool_choice: { type: 'tool', name: 'create_manifest' },
    messages:    [{ role: 'user', content: userContentParts }],
  })

  const manifestBlock = manifestRes.content.find(b => b.type === 'tool_use' && b.name === 'create_manifest')
  if (!manifestBlock) throw new Error(`manifest: no tool_use block — stop_reason=${manifestRes.stop_reason}`)
  const manifest = manifestBlock.input
  if (!manifest?.sections?.length) throw new Error(`manifest: sections missing or empty — keys=${Object.keys(manifest ?? {}).join(',')}`)
  manifest.businessName = anonName  // force anonymized name

  process.stdout.write(` manifest✓ sections=[${manifest.sections.map(s=>s.id).join(',')}]\n`)

  // ── Phase 2: Write each section ───────────────────────────────────────────
  const completed = []
  let previousCode = ''
  const formEndpoint = 'https://adorable.click/api/forms/preview'

  for (const section of manifest.sections) {
    process.stdout.write(`${tag}   → ${section.component.padEnd(28)} `)

    const d    = manifest.design ?? {}
    const urls = manifest.unsplashUrls ?? []
    const photosLine = urls.length > 0 ? `Photos Unsplash : ${urls.join(' | ')}` : ''

    const sectionPrompt = `Tu es un expert React/Tailwind. Tu écris UNE SEULE section : ${section.component}.

━━ DESIGN SYSTEM ━━
Mode          : ${d.mode}
Fond page     : ${d.bg}
Fond surfaces : ${d.surface}
Accent        : ${d.accent}  (hover: ${d.accentHover})
Texte titres  : ${d.headingText}
Texte corps   : ${d.bodyText}
Texte muted   : ${d.mutedText}
Bordures      : ${d.border}
Police titres : ${d.headingFont}
Police corps  : Inter
Border radius : ${d.radius}
Ton visuel    : ${d.tone}
${photosLine}

━━ SITE ━━
Business : ${anonName}
Industrie : boulangerie artisanale

━━ SPEC DE CETTE SECTION ━━
${section.spec}

${previousCode ? `━━ SECTIONS DÉJÀ ÉCRITES (respecte exactement le même style) ━━\n\`\`\`tsx\n${previousCode.slice(-3000)}\n\`\`\`` : ''}

${(section.id === 'contact' || section.id === 'reservation') ? `━━ FORMULAIRE ━━\nUtilise exactement : fetch('${formEndpoint}', { method: 'POST', ... })` : ''}

━━ RÈGLES ABSOLUES ━━
1. Exporte UNIQUEMENT : export function ${section.component}() { ... }
2. PAS de default export — PAS d'autres exports
3. Imports : import { useState, useEffect } from 'react' et/ou import { IconName } from 'lucide-react'
4. Tailwind uniquement pour le style
5. Max 180 lignes
6. Contenu réaliste pour une boulangerie artisanale — jamais Lorem Ipsum
7. Avatars témoignages : https://i.pravatar.cc/80?img=[1-70]
8. py-20 minimum sur les sections
9. Responsive : 1 colonne mobile, 2-3 colonnes desktop

Appelle write_section avec le code complet de ${section.component}.`

    let accepted = false
    for (let attempt = 0; attempt <= 2; attempt++) {
      const sectionRes = await anthropic.messages.create({
        model:       'claude-sonnet-4-6',
        max_tokens:  8000,
        system:      sectionPrompt,
        tools:       [SECTION_TOOL],
        tool_choice: { type: 'tool', name: 'write_section' },
        messages:    [{ role: 'user', content: `Écris le composant ${section.component} maintenant.` }],
      })

      const block = sectionRes.content.find(b => b.type === 'tool_use' && b.name === 'write_section')
      const code  = block?.input?.code?.trim()
      if (!code) { process.stdout.write('empty '); break }

      completed.push({ component: section.component, code })
      previousCode = completed.map(s => s.code).join('\n\n')
      process.stdout.write('✓ ')
      accepted = true
      break
    }
    if (!accepted) process.stdout.write('✗ ')
    process.stdout.write('\n')
  }

  if (completed.length === 0) throw new Error('no sections generated')
  return assembleSections(completed)
}

// ── Main ───────────────────────────────────────────────────────────────────────
const { data: refSites, error } = await supabase
  .from('reference_sites')
  .select('slug, name, screenshot_url, quality_score, fonts, has_dark_bg, cta_texts, tags')
  .eq('industry', 'Boulangerie')
  .not('has_cookies_wall', 'eq', true)
  .gte('quality_score', MIN_SCORE)
  .order('quality_score', { ascending: false })
  .limit(ONLY_SLUG ? 1000 : 50)

if (error) { console.error(error); process.exit(1) }

const sites = ONLY_SLUG ? refSites.filter(s => s.slug === ONLY_SLUG) : refSites

// Skip existing if requested
let toProcess = sites
if (SKIP_EXISTING) {
  const { data: existing } = await supabase
    .from('templates')
    .select('slug')
    .in('slug', sites.map(s => s.slug))
  const existingSlugs = new Set((existing ?? []).map(r => r.slug))
  toProcess = sites.filter(s => !existingSlugs.has(s.slug))
  console.log(`  ✓ ${existingSlugs.size} already have react_code — skipping`)
}

console.log(`\n🥐  Generating ${toProcess.length} anonymized boulangerie templates (min score: ${MIN_SCORE})${DRY_RUN ? ' — DRY RUN' : ''}\n`)

let ok = 0, failed = 0

for (let i = 0; i < toProcess.length; i++) {
  const refSite  = toProcess[i]
  const anonName = ANON_NAMES[i % ANON_NAMES.length]
  const tag      = `[${String(i+1).padStart(3,'0')}/${toProcess.length}]`

  process.stdout.write(`${tag} ${refSite.name.padEnd(35)} → "${anonName}" `)

  if (DRY_RUN) { console.log('(dry run)'); ok++; continue }

  try {
    const reactCode = await generateForSite(refSite, anonName, i + 1)

    const row = {
      slug:          `boulan-${refSite.slug}`,  // prefix avoids collision with old template slugs
      name:          anonName,
      url:           '',
      industry:      'Boulangerie',
      site_type:     'bakery',
      tags:          ['boulangerie', 'bakery', 'artisan', 'paris'],
      priority:      refSite.quality_score >= 9 ? 'high' : 'medium',
      fonts:         refSite.fonts ?? [],
      has_dark_bg:   refSite.has_dark_bg ?? false,
      cta_texts:     refSite.cta_texts ?? [],
      screenshot_url: refSite.screenshot_url,  // reuse reference screenshot for picker preview
      react_code:    reactCode,
    }

    const { error: upsertErr } = await supabase
      .from('templates')
      .upsert(row, { onConflict: 'slug' })

    if (upsertErr) throw new Error(upsertErr.message)

    console.log(`  ✅  ${reactCode.split('\n').length} lines`)
    ok++
  } catch (err) {
    console.log(`  ❌  ${err.message}`)
    failed++
  }
}

console.log(`\n✅  ${ok} generated, ❌ ${failed} failed\n`)
