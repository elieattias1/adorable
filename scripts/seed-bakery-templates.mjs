/**
 * scripts/seed-bakery-templates.mjs
 *
 * Generates anonymized, fully-functional bakery templates by feeding real
 * bakery screenshots to Claude Opus (vision). Each template gets:
 *   - Visual style extracted from real screenshots
 *   - Fully anonymized content (no real names/addresses/phones)
 *   - Working shop section (orders via /api/shop/checkout)
 *   - Working contact form (via /api/forms/:siteId)
 *   - 15 default products seeded in the DB
 *   - Code saved to reference_sites for use as a template picker
 *
 * Usage:
 *   ADMIN_USER_ID=xxx node scripts/seed-bakery-templates.mjs
 *   ADMIN_USER_ID=xxx node scripts/seed-bakery-templates.mjs --force   # overwrite existing
 *   ADMIN_USER_ID=xxx node scripts/seed-bakery-templates.mjs --slug=boulangerie-bigot  # single
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const anthropic   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'
const SCREENSHOTS = '/Users/elieattias/Downloads/no-website-finder/website-output/screenshots'
const ADMIN_USER_ID = process.env.ADMIN_USER_ID

if (!ADMIN_USER_ID) {
  console.error('❌  Set ADMIN_USER_ID env var to a real Supabase user ID')
  process.exit(1)
}

// ── Target bakeries ────────────────────────────────────────────────────────────

const BAKERIES = [
  {
    slug:       'tpl-aux-fruits-eden',
    sourceSlug: 'aux-fruits-d-eden',
    anonName:   'Au Jardin Doré',
    industry:   'Boulangerie',
  },
  {
    slug:       'tpl-aux-gourmands',
    sourceSlug: 'aux-gourmands-de-la-place-boulangerie-patisserie-p',
    anonName:   'La Gourmandise du Marché',
    industry:   'Boulangerie',
  },
  {
    slug:       'tpl-merveilleux',
    sourceSlug: 'aux-merveilleux-de-fred',
    anonName:   'Les Délices de François',
    industry:   'Boulangerie',
  },
  {
    slug:       'tpl-peches-normands',
    sourceSlug: 'aux-peches-normands',
    anonName:   'La Boulangerie Normande',
    industry:   'Boulangerie',
  },
  {
    slug:       'tpl-bigot',
    sourceSlug: 'boulangerie-bigot',
    anonName:   'Maison Dupont',
    industry:   'Boulangerie',
  },
  {
    slug:       'tpl-la-parisienne',
    sourceSlug: 'boulangerie-la-parisienne',
    anonName:   'La Parisienne',
    industry:   'Boulangerie',
  },
]

// ── Default products ───────────────────────────────────────────────────────────

const DEFAULT_PRODUCTS = [
  { name: 'Baguette Tradition',  category: 'pain',         price: 130,  emoji: '🥖', sort_order: 1  },
  { name: 'Pain au Levain',      category: 'pain',         price: 490,  emoji: '🍞', sort_order: 2  },
  { name: 'Pain de Campagne',    category: 'pain',         price: 420,  emoji: '🍞', sort_order: 3  },
  { name: 'Pain aux Céréales',   category: 'pain',         price: 380,  emoji: '🍞', sort_order: 4  },
  { name: 'Croissant',           category: 'viennoiserie', price: 140,  emoji: '🥐', sort_order: 10 },
  { name: 'Pain au Chocolat',    category: 'viennoiserie', price: 150,  emoji: '🍫', sort_order: 11 },
  { name: 'Chausson aux Pommes', category: 'viennoiserie', price: 180,  emoji: '🍎', sort_order: 12 },
  { name: 'Brioche',             category: 'viennoiserie', price: 320,  emoji: '🧁', sort_order: 13 },
  { name: 'Tarte aux Fraises',   category: 'patisserie',   price: 490,  emoji: '🍓', sort_order: 20 },
  { name: 'Éclair au Chocolat',  category: 'patisserie',   price: 390,  emoji: '🍫', sort_order: 21 },
  { name: 'Mille-feuille',       category: 'patisserie',   price: 450,  emoji: '🍰', sort_order: 22 },
  { name: 'Paris-Brest',         category: 'patisserie',   price: 520,  emoji: '🍩', sort_order: 23 },
  { name: 'Café',                category: 'boisson',      price: 200,  emoji: '☕', sort_order: 30 },
  { name: 'Chocolat Chaud',      category: 'boisson',      price: 350,  emoji: '🍫', sort_order: 31 },
  { name: 'Jus d\'Orange',       category: 'boisson',      price: 380,  emoji: '🍊', sort_order: 32 },
]

// ── Load screenshots as base64 ─────────────────────────────────────────────────

async function loadImages(sourceSlug, maxImages = 4) {
  const { readdirSync } = await import('fs')
  const dir = join(SCREENSHOTS, sourceSlug)
  if (!existsSync(dir)) return []

  const allFiles = readdirSync(dir).filter(f => f.endsWith('.png'))

  // Prioritize: home > menu > about > others
  const order = (f) => {
    if (f.startsWith('home'))    return 0
    if (f.startsWith('menu'))    return 1
    if (f.startsWith('about'))   return 2
    if (f.startsWith('order'))   return 3
    if (f.startsWith('contact')) return 4
    return 5
  }
  const sorted = allFiles.sort((a, b) => order(a) - order(b)).slice(0, maxImages)

  return sorted.map(filename => {
    const buffer = readFileSync(join(dir, filename))
    return {
      filename,
      base64: buffer.toString('base64'),
      mediaType: 'image/png',
    }
  })
}

// ── Generate code via Claude Opus (vision) ────────────────────────────────────

async function generateFromScreenshots(bakery, siteId, images) {
  const shopEndpoint = `${APP_URL}/api`
  const formEndpoint = `${APP_URL}/api/forms/${siteId}`

  const imageBlocks = images.map(img => ({
    type: 'image',
    source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
  }))

  const textPrompt = `Tu es un expert React/Tailwind. Analyse ces screenshots d'un site de boulangerie française et génère un site web complet qui s'inspire de ce style visuel.

ANONYMISATION OBLIGATOIRE :
- Remplace le vrai nom par : "${bakery.anonName}"
- Invente une adresse fictive (rue et ville françaises plausibles)
- Invente un numéro de téléphone fictif (format français)
- Remplace les vrais prénoms/noms par des noms fictifs
- Garde les mêmes couleurs, polices, mise en page et ambiance visuelle

SECTIONS OBLIGATOIRES (dans cet ordre) :
1. NavSection — navigation sticky avec logo "${bakery.anonName}" et liens ancres
2. HeroSection — hero inspiré du style du site (couleurs, ambiance, typographie)
3. ShopSection — boutique en ligne FONCTIONNELLE (pattern exact ci-dessous)
4. HistoireSection — histoire fictive mais crédible, valeurs artisanales
5. AvisSection — 4-6 témoignages clients avec noms français fictifs et notes ⭐
6. ContactSection — formulaire de contact (pattern ci-dessous) + adresse fictive
7. FooterSection — footer complet (liens, réseaux sociaux fictifs, horaires)

━━ PATTERN BOUTIQUE (copie EXACTEMENT ce code) ━━
\`\`\`tsx
const SHOP_API  = '${shopEndpoint}'
const SHOP_SITE = '${siteId}'

// Dans ShopSection :
const [products,   setProducts]   = useState<any[]>([])
const [cart,       setCart]       = useState<Record<string,number>>({})
const [showModal,  setShowModal]  = useState(false)
const [form,       setForm]       = useState({ name:'', email:'', phone:'', note:'' })
const [status,     setStatus]     = useState<'idle'|'loading'|'success'|'error'>('idle')

useEffect(() => {
  fetch(SHOP_API + '/products?siteId=' + SHOP_SITE)
    .then(r => r.json()).then(d => setProducts(d.products ?? []))
}, [])

const cartCount = Object.values(cart).reduce((s:any, q:any) => s + q, 0)
const cartTotal = products.reduce((s, p) => s + (cart[p.id] ?? 0) * p.price, 0)

const handleCheckout = async () => {
  setStatus('loading')
  const items = Object.entries(cart).filter(([,q])=>(q as number)>0).map(([product_id,quantity])=>({product_id,quantity}))
  const res = await fetch(SHOP_API + '/shop/checkout', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ site_id:SHOP_SITE, customer_name:form.name, customer_email:form.email, customer_phone:form.phone||undefined, note:form.note||undefined, items })
  })
  const data = await res.json()
  setStatus(data.orderId ? 'success' : 'error')
}
\`\`\`
- Grille produits : photo (p.photo_url ou emoji), nom, prix formaté "X,XX €", bouton "+"
- Badge panier sticky bottom-right avec total et bouton "Commander"
- Modal : Nom*, Email*, Téléphone, Note — bouton "Confirmer"
- Succès : "✅ Commande confirmée ! Nous vous contacterons pour l'heure de retrait."
- products vide : "Catalogue bientôt disponible 🥐"

━━ FORMULAIRE DE CONTACT ━━
fetch('${formEndpoint}', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, email, message}) })
Succès : "Message envoyé ! Nous vous répondrons sous 24h."

━━ RÈGLES ABSOLUES ━━
- Exports : export function NavSection(){} ... export function App(){ return <><NavSection/><HeroSection/><ShopSection/><HistoireSection/><AvisSection/><ContactSection/><FooterSection/></> }
- PAS de default export, PAS d'autres exports
- Imports : import { useState, useEffect } from 'react' et/ou import { IconName } from 'lucide-react'
- Tailwind uniquement, valeurs arbitraires ok ex: bg-[#2c1810]
- Images : vraies URLs Unsplash de boulangerie/pain/viennoiseries
- Minimum 600 lignes — site COMPLET, magnifique, prêt à l'emploi
- Responsive : mobile-first, grid cols-1 → cols-2/3 sur desktop
- Contenu 100% fictif mais ultra-réaliste pour une boulangerie française

Génère maintenant le TSX complet.`

  const response = await anthropic.messages.create({
    model:      'claude-opus-4-6',
    max_tokens: 8000,
    messages:   [{
      role: 'user',
      content: [
        ...imageBlocks,
        { type: 'text', text: textPrompt },
      ],
    }],
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? ''

  // Extract code block
  const match = text.match(/```(?:tsx?|jsx?)?\n([\s\S]+?)```/)
  if (match) return match[1].trim()

  // If no code block, look for export function App
  const appMatch = text.match(/((?:export function|function)\s+\w+[\s\S]+export function App[\s\S]+)$/)
  if (appMatch) return appMatch[1].trim()

  return text.trim()
}

// ── Upsert reference_site entry ───────────────────────────────────────────────

async function upsertReferenceSite(bakery, siteId, code, screenshotUrl) {
  const { data: existing } = await supabase
    .from('reference_sites')
    .select('id')
    .eq('slug', bakery.slug)
    .single()

  const payload = {
    slug:          bakery.slug,
    name:          bakery.anonName,
    industry:      bakery.industry,
    url:           `${APP_URL}/s/${siteId}`,
    react_code:    code,
    site_type:     'bakery',
    quality_score: 9,
    screenshot_url: screenshotUrl ?? null,
  }

  if (existing) {
    return supabase.from('reference_sites').update(payload).eq('id', existing.id)
  }
  return supabase.from('reference_sites').insert(payload)
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const force     = process.argv.includes('--force')
  const onlySlug  = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1]
  const targets   = onlySlug ? BAKERIES.filter(b => b.slug === onlySlug || b.sourceSlug === onlySlug) : BAKERIES

  if (targets.length === 0) {
    console.error('❌ No matching bakery found for slug:', onlySlug)
    process.exit(1)
  }

  console.log(`🥐 Seeding ${targets.length} bakery template(s)…\n`)

  for (const bakery of targets) {
    console.log(`\n━━ ${bakery.anonName} (${bakery.slug}) ━━`)
    console.log(`   Source screenshots: ${bakery.sourceSlug}`)

    // Check if already done
    const { data: existing } = await supabase
      .from('reference_sites')
      .select('id, react_code')
      .eq('slug', bakery.slug)
      .single()

    if (existing?.react_code && !force) {
      console.log(`   ⏭  Already has react_code — use --force to overwrite`)
      continue
    }

    // 1. Load screenshots
    const images = await loadImages(bakery.sourceSlug, 4)
    if (images.length === 0) {
      console.error(`   ❌ No screenshots found in ${SCREENSHOTS}/${bakery.sourceSlug}`)
      continue
    }
    console.log(`   📸 Loaded ${images.length} screenshots: ${images.map(i => i.filename).join(', ')}`)

    // 2. Create site in DB
    const siteId = randomUUID()
    console.log(`   📝 Creating site ${siteId}`)

    const { error: siteErr } = await supabase.from('sites').insert({
      id:           siteId,
      user_id:      ADMIN_USER_ID,
      name:         bakery.anonName,
      type:         'bakery',
      html:         null,
      is_published: false,
    })
    if (siteErr) {
      console.error(`   ❌ site insert error:`, siteErr.message)
      continue
    }

    // 3. Seed products
    const productRows = DEFAULT_PRODUCTS.map(p => ({
      site_id:    siteId,
      user_id:    ADMIN_USER_ID,
      name:       p.name,
      category:   p.category,
      price:      p.price,
      emoji:      p.emoji,
      photo_url:  null,
      active:     true,
      sort_order: p.sort_order,
    }))
    const { error: prodErr } = await supabase.from('products').insert(productRows)
    if (prodErr) console.warn(`   ⚠  products:`, prodErr.message)
    else console.log(`   🛍  Seeded ${productRows.length} products`)

    // 4. Generate code
    console.log(`   🤖 Generating with Claude Opus (vision)…`)
    let code
    try {
      code = await generateFromScreenshots(bakery, siteId, images)
      const lines = code.split('\n').length
      console.log(`   ✅ Code generated  lines=${lines}`)
      if (lines < 100) {
        console.warn(`   ⚠  Very short code (${lines} lines) — may be incomplete`)
      }
    } catch (err) {
      console.error(`   ❌ Generation failed:`, err.message)
      // Clean up site
      await supabase.from('sites').delete().eq('id', siteId)
      continue
    }

    // 5. Save code to site
    await supabase.from('sites').update({ html: code }).eq('id', siteId)

    // 6. Use home.png as screenshot if it exists
    let screenshotUrl = null
    const homePngPath = join(SCREENSHOTS, bakery.sourceSlug, 'home.png')
    if (existsSync(homePngPath)) {
      // Upload to Supabase Storage
      const imgBuffer = readFileSync(homePngPath)
      const storagePath = `templates/${bakery.slug}/home.png`
      const { error: uploadErr } = await supabase.storage
        .from('screenshots')
        .upload(storagePath, imgBuffer, { contentType: 'image/png', upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(storagePath)
        screenshotUrl = urlData?.publicUrl ?? null
        console.log(`   🖼  Screenshot uploaded`)
      } else {
        console.warn(`   ⚠  Screenshot upload failed:`, uploadErr.message)
      }
    }

    // 7. Upsert reference_site
    const { error: refErr } = await upsertReferenceSite(bakery, siteId, code, screenshotUrl)
    if (refErr) {
      console.error(`   ❌ reference_sites error:`, refErr.message)
      continue
    }

    console.log(`   💾 Saved to reference_sites`)
    console.log(`   🌐 Preview: ${APP_URL}/s/${siteId}?preview=1`)
  }

  console.log('\n✅ Done!')
}

main().catch(err => { console.error(err); process.exit(1) })
