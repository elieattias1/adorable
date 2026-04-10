/**
 * scripts/generate-templates.ts
 *
 * Generates production-quality boulangerie templates using the EXACT same
 * manifest → section → assemble pipeline as the editor (imports from lib/ai/).
 *
 * Each template:
 *  - Uses vision from a high-quality reference screenshot for visual inspiration
 *  - Gets a real backing site in DB (so shop + form endpoints work)
 *  - Gets 15 default products seeded
 *  - Gets a Playwright screenshot (rendered via page.setContent — no dev server)
 *  - Is saved to reference_sites for the template picker
 *
 * Prerequisites:
 *   - npx playwright install chromium
 *   - ADMIN_USER_ID env var (a Supabase user UUID for the backing sites)
 *
 * Usage:
 *   ADMIN_USER_ID=xxx npx tsx scripts/generate-templates.ts
 *   ADMIN_USER_ID=xxx npx tsx scripts/generate-templates.ts --force
 *   ADMIN_USER_ID=xxx npx tsx scripts/generate-templates.ts --slug=tpl-boul-doree
 */

import { createClient }  from '@supabase/supabase-js'
import Anthropic          from '@anthropic-ai/sdk'
import { randomUUID }     from 'crypto'
import dotenv             from 'dotenv'
import {
  MANIFEST_TOOL,
  SECTION_TOOL,
  buildSectionPrompt,
  assembleSections,
} from '../lib/ai/manifest'
import type { SiteManifest } from '../lib/ai/types'

dotenv.config({ path: '.env.local' })

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'
const ADMIN_USER_ID = process.env.ADMIN_USER_ID

if (!ADMIN_USER_ID) {
  console.error('❌  ADMIN_USER_ID env var required')
  process.exit(1)
}

// ── Template definitions ───────────────────────────────────────────────────────

const TEMPLATES = [
  { slug: 'tpl-boul-doree',       anonName: 'Au Pain Doré',          referenceId: 42,  preset: 'CLAIR_TERRACOTTA' },
  { slug: 'tpl-boul-merveilles',  anonName: 'Les Merveilles',         referenceId: 52,  preset: 'SOMBRE_OR'        },
  { slug: 'tpl-patisserie-fine',  anonName: 'Maison Blanc',           referenceId: 132, preset: 'BLANC_LUXE'       },
  { slug: 'tpl-boul-parisienne',  anonName: 'La Parisienne',          referenceId: 83,  preset: 'CLAIR_TERRACOTTA' },
  { slug: 'tpl-boul-prestige',    anonName: 'Maison Prestige',        referenceId: 86,  preset: 'SOMBRE_OR'        },
  { slug: 'tpl-boul-lumiere',     anonName: 'Lumière & Pâtisserie',   referenceId: 54,  preset: 'BLANC_LUXE'       },
]

// ── Design presets — fed into buildManifestPrompt as designPreset ─────────────

const PRESETS: Record<string, string> = {
  CLAIR_TERRACOTTA: `DESIGN SYSTEM — Boulangerie Artisanale (mode CLAIR, chaleureux) :
• Mode : light
• Fond : #fffbf5 | Surface : #ffffff | Accent : #c2410c | AccentHover : #a33209
• HeadingText : #1c0a00 | BodyText : #57534e | MutedText : #a8a29e
• Border : border-orange-100 | Radius : rounded-2xl | HeadingFont : Playfair Display
• Ton : chaleureux, artisanal, authentique

PHOTOS UNSPLASH (utilise chaque URL UNE SEULE FOIS) :
https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&h=1080&fit=crop
https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&h=600&fit=crop`,

  SOMBRE_OR: `DESIGN SYSTEM — Boulangerie Premium (dark warm, doré) :
• Mode : dark
• Fond : #120900 | Surface : #1e1008 | Accent : #d4a853 | AccentHover : #e0b85e
• HeadingText : #f9efd7 | BodyText : #c4a882 | MutedText : #7a6040
• Border : border-[#d4a853]/20 | Radius : rounded-3xl | HeadingFont : Playfair Display
• Ton : luxueux, nocturne, gastronomique

PHOTOS UNSPLASH (utilise chaque URL UNE SEULE FOIS) :
https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=1920&h=1080&fit=crop
https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=600&fit=crop`,

  BLANC_LUXE: `DESIGN SYSTEM — Pâtisserie Fine (mode CLAIR, luxueux) :
• Mode : light
• Fond : #fdf9f6 | Surface : #ffffff | Accent : #b45309 | AccentHover : #92400e
• HeadingText : #1a1a1a | BodyText : #6b7280 | MutedText : #9ca3af
• Border : border-amber-100 | Radius : rounded-3xl | HeadingFont : Playfair Display
• Ton : épuré, luxueux, pâtisserie fine

PHOTOS UNSPLASH (utilise chaque URL UNE SEULE FOIS) :
https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1920&h=1080&fit=crop
https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1583338917451-face2751d8d5?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=800&h=800&fit=crop
https://images.unsplash.com/photo-1585418579316-4c1f91478248?w=800&h=600&fit=crop`,
}

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
  { name: "Jus d'Orange",        category: 'boisson',      price: 380,  emoji: '🍊', sort_order: 32 },
]

// ── Phase 1: Generate manifest (Opus + vision from reference screenshot) ───────

async function generateManifest(
  anonName: string,
  preset: string,
  refScreenshotUrl: string | null,
): Promise<SiteManifest> {
  const userContent: Anthropic.MessageParam['content'] = []

  if (refScreenshotUrl) {
    try {
      const res = await fetch(refScreenshotUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: buf.toString('base64') },
        })
        userContent.push({
          type: 'text',
          text: `Voici le screenshot d'une boulangerie parisienne de référence. Inspire-toi de son ambiance et de sa mise en page. Business : "${anonName}" — boulangerie artisanale parisienne.`,
        })
      }
    } catch { /* ignore fetch errors */ }
  }

  if (userContent.length === 0) {
    userContent.push({ type: 'text', text: `Business : "${anonName}" — boulangerie artisanale parisienne` })
  }

  const systemPrompt = `Tu es un expert en design de sites web. Tu analyses une demande et produis un manifest complet.

${preset}

RÈGLES :
- businessName : "${anonName}"
- industry : "Boulangerie"
- design : respecte STRICTEMENT les valeurs du design system — couleurs, typo, radius
- sections : 6 à 7 sections — NavSection en premier, FooterSection en dernier
  → inclure une ShopSection (id: "shop") pour la boutique en ligne
  → inclure une ContactSection (id: "contact") pour le formulaire
- unsplashUrls : uniquement les URLs listées ci-dessus

Appelle create_manifest avec le manifest complet.`

  const res = await anthropic.messages.create({
    model:       'claude-opus-4-6',
    max_tokens:  8000,
    system:      systemPrompt,
    tools:       [MANIFEST_TOOL],
    tool_choice: { type: 'tool', name: 'create_manifest' },
    messages:    [{ role: 'user', content: userContent }],
  })

  const block = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'create_manifest')
  if (!block) throw new Error(`manifest: no tool_use — stop=${res.stop_reason}`)
  const manifest = block.input as SiteManifest
  if (!manifest?.sections?.length) throw new Error('manifest: no sections')
  manifest.businessName = anonName
  return manifest
}

// ── Phase 2: Write sections using the exact same buildSectionPrompt as editor ──

async function writeSections(
  manifest: SiteManifest,
  formEndpoint: string,
  shopEndpoint: string,
  shopSiteId: string,
): Promise<Array<{ component: string; code: string }>> {
  const completed: Array<{ component: string; code: string }> = []
  let previousCode = ''

  for (const section of manifest.sections) {
    process.stdout.write(`   ✍  ${section.component.padEnd(28)} `)

    // Use the EXACT same prompt builder as the editor — same rules, same patterns
    const prompt = buildSectionPrompt(
      manifest,
      section,
      previousCode,
      formEndpoint,
      null,         // no syntax error
      shopEndpoint,
      shopSiteId,
    )

    let code: string | null = null
    for (let attempt = 0; attempt <= 2; attempt++) {
      const res = await anthropic.messages.create({
        model:       'claude-sonnet-4-6',
        max_tokens:  8000,
        system:      prompt,
        tools:       [SECTION_TOOL],
        tool_choice: { type: 'tool', name: 'write_section' },
        messages:    [{ role: 'user', content: `Écris le composant ${section.component} maintenant.` }],
      })

      const block = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'write_section')
      code = (block?.input as any)?.code?.trim() ?? null
      if (code) break
    }

    if (code) {
      completed.push({ component: section.component, code })
      previousCode = completed.map(s => s.code).join('\n\n')
      console.log(`✓ (${code.split('\n').length} lines)`)
    } else {
      console.log(`✗ skipped`)
    }
  }

  return completed
}

// ── Screenshot via Playwright (no dev server — page.setContent) ───────────────

const CDN = {
  react:      'https://esm.sh/react@18',
  jsxRuntime: 'https://esm.sh/react@18/jsx-runtime',
  reactDom:   'https://esm.sh/react-dom@18/client',
  lucide:     'https://esm.sh/lucide-react?deps=react@18',
}

function buildHtml(reactCode: string): string {
  const cleaned = reactCode
    .replace(/^import\s+type\b.+$/gm, '')
    .replace(/^(?:export\s+)?interface\s+\w+[^{]*\{[^{}]*\}/gm, '')
    .replace(/^(?:export\s+)?type\s+\w+\s*(?:<[^>]*>)?\s*=\s*.+;?\s*$/gm, '')
    .replace(/\}\s*:\s*\{[^{}]*\}/g, '}')
    .replace(/((?:const|let|var)\s+\w+)\s*:\s*[A-Za-z_$][\w$.<>[\]|& ,'"?!()]+?(?=\s*=(?!=))/g, '$1')
    .replace(/\b([a-zA-Z_$][\w$]*)\s*:\s*(?:React\.[\w.]+(?:<[^<>()]*>)?|[\w.]+(?:<[^<>()]*>)?(?:\[\])?(?:\s*\|\s*[\w.]+(?:<[^<>()]*>)?(?:\[\])?)*)\s*(?=[,)=])/g, '$1')
    .replace(/\b([a-zA-Z_$][\w$]*)\s*:\s*'[^']*'(?:\s*\|\s*(?:'[^']*'|"[^"]*"))+\s*(?=[,)=])/g, '$1')
    .replace(/\b(useState|useRef|useCallback|useMemo|useReducer|useContext|useLayoutEffect|useImperativeHandle|createRef|createContext)\s*<[^<>()[\]{}]+>/g, '$1')

  const escaped = JSON.stringify(cleaned)
  const r = JSON.stringify(CDN.react), j = JSON.stringify(CDN.jsxRuntime)
  const d = JSON.stringify(CDN.reactDom), l = JSON.stringify(CDN.lucide)

  return `<!DOCTYPE html><html lang="fr"><head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <style>*,*::before,*::after{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}[id]{scroll-margin-top:80px}
  @keyframes spin{to{transform:rotate(360deg)}}
  #loading{position:fixed;inset:0;background:#0f0f13;display:flex;align-items:center;justify-content:center;z-index:9999}</style>
</head><body>
  <div id="loading"><div style="width:32px;height:32px;border:2px solid #7c3aed;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite"></div></div>
  <div id="root"></div>
  <script>(function(){
    var R=${r},J=${j},D=${d},L=${l};
    function run(){
      var code=${escaped},compiled;
      try{compiled=Babel.transform(code,{presets:[['react',{runtime:'automatic'}]],filename:'App.jsx'}).code;}
      catch(e){document.getElementById('loading').remove();document.getElementById('root').innerHTML='<pre style="color:#f87171;padding:24px;font-size:12px">'+e.message+'</pre>';return;}
      var js=compiled
        .replace(/export\\s+default\\s+(function|class)\\s+App\\b/,'$1 App')
        .replace(/from\\s+['"]react\\/jsx-runtime['"]/g,"from '"+J+"'")
        .replace(/from\\s+['"]react['"]/g,"from '"+R+"'")
        .replace(/from\\s+['"]react-dom\\/client['"]/g,"from '"+D+"'")
        .replace(/^import\\s+\\{([^}]+)\\}\\s+from\\s+['"]lucide-react['"];?\\s*$/gm,function(_,n){return"import * as _L from '"+L+"';\\nconst{"+n.trim()+"}=new Proxy(_L,{get:(t,k)=>t[k]||(()=>null)});";})
        .replace(/^import\\s+.*?from\\s+['"][^h][^t][^t].*?['"];?\\s*$/gm,'');
      var src="import React from '"+R+"';import{createRoot}from '"+D+"';"+js+"\\ntry{createRoot(document.getElementById('root')).render(React.createElement(App));}catch(e){console.error(e);}";
      var s=document.createElement('script');s.type='module';s.src=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
      s.onload=function(){document.getElementById('loading').remove();};
      document.body.appendChild(s);
    }
    if(window.Babel)run();else document.querySelector('[src*="babel"]').addEventListener('load',run);
  })();</script>
</body></html>`
}

async function takeScreenshot(reactCode: string): Promise<Buffer> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const page    = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.setContent(buildHtml(reactCode), { waitUntil: 'networkidle' })
  await page.waitForSelector('#loading', { state: 'detached', timeout: 25_000 }).catch(() => {})
  await page.waitForTimeout(2000)
  const buffer = await page.screenshot({ type: 'png', fullPage: false })
  await browser.close()
  return buffer
}

async function uploadScreenshot(buffer: Buffer, slug: string): Promise<string> {
  const path = `templates/${slug}/hero.png`
  const { error } = await supabase.storage.from('sites').upload(path, buffer, { contentType: 'image/png', upsert: true })
  if (error) throw new Error(error.message)
  return supabase.storage.from('sites').getPublicUrl(path).data.publicUrl
}

// ── Main generation ────────────────────────────────────────────────────────────

async function generateTemplate(tpl: typeof TEMPLATES[0], force: boolean) {
  console.log(`\n━━ ${tpl.anonName} (${tpl.slug}) ━━`)

  const { data: existing } = await supabase
    .from('reference_sites')
    .select('id, react_code, screenshot_url')
    .eq('slug', tpl.slug)
    .single()

  if (existing?.react_code && existing?.screenshot_url && !force) {
    console.log(`   ⏭  Already complete — use --force to overwrite`)
    return
  }

  // 1. Get reference screenshot
  const { data: refSite } = await supabase
    .from('reference_sites')
    .select('screenshot_url')
    .eq('id', tpl.referenceId)
    .single()

  // 2. Create backing site (for shop + form endpoints)
  const siteId       = randomUUID()
  const formEndpoint = `${APP_URL}/api/forms/${siteId}`
  const shopEndpoint = `${APP_URL}/api`

  console.log(`   📝 Creating backing site ${siteId}`)
  const { error: siteErr } = await supabase.from('sites').insert({
    id: siteId, user_id: ADMIN_USER_ID, name: tpl.anonName, type: 'bakery', html: null, is_published: false,
  })
  if (siteErr) throw new Error(`site insert: ${siteErr.message}`)

  // 3. Seed products
  const { error: prodErr } = await supabase.from('products').insert(
    DEFAULT_PRODUCTS.map(p => ({ ...p, site_id: siteId, user_id: ADMIN_USER_ID, photo_url: null, active: true }))
  )
  if (prodErr) console.warn(`   ⚠  products: ${prodErr.message}`)
  else console.log(`   🛍  Seeded ${DEFAULT_PRODUCTS.length} products`)

  // 4. Generate manifest (Opus + vision)
  console.log(`   🎨 Generating manifest…`)
  const manifest = await generateManifest(tpl.anonName, PRESETS[tpl.preset], refSite?.screenshot_url ?? null)
  console.log(`   📋 Sections: [${manifest.sections.map(s => s.id).join(', ')}]`)

  // 5. Write sections using the shared buildSectionPrompt (same as editor)
  const completed = await writeSections(manifest, formEndpoint, shopEndpoint, siteId)
  if (completed.length === 0) throw new Error('no sections generated')

  // 6. Assemble using shared assembleSections (same as editor)
  const reactCode = assembleSections(completed)
  console.log(`   ✅ Assembled  total=${reactCode.split('\n').length} lines`)

  // 7. Save code to backing site
  await supabase.from('sites').update({ html: reactCode }).eq('id', siteId)

  // 8. Screenshot
  let screenshotUrl: string | null = null
  try {
    console.log(`   📸 Taking screenshot…`)
    const buffer = await takeScreenshot(reactCode)
    screenshotUrl = await uploadScreenshot(buffer, tpl.slug)
    console.log(`   🖼  Screenshot uploaded`)
  } catch (err: any) {
    console.warn(`   ⚠  Screenshot failed: ${err.message}`)
  }

  // 9. Save to reference_sites
  const payload = {
    slug: tpl.slug, name: tpl.anonName, industry: 'Boulangerie',
    url: `${APP_URL}/s/${siteId}`, react_code: reactCode,
    site_type: 'bakery', quality_score: 9, screenshot_url: screenshotUrl,
  }
  const { error: refErr } = existing
    ? await supabase.from('reference_sites').update(payload).eq('id', existing.id)
    : await supabase.from('reference_sites').insert(payload)
  if (refErr) throw new Error(`reference_sites: ${refErr.message}`)

  console.log(`   💾 Saved to reference_sites`)
  console.log(`   🌐 Preview: ${APP_URL}/s/${siteId}?preview=1`)
}

// ── Entry point ────────────────────────────────────────────────────────────────

;(async () => {
  const force    = process.argv.includes('--force')
  const onlySlug = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1]
  const targets  = onlySlug ? TEMPLATES.filter(t => t.slug === onlySlug) : TEMPLATES

  if (targets.length === 0) { console.error('❌  No matching template:', onlySlug); process.exit(1) }

  console.log(`🥐  Generating ${targets.length} boulangerie template(s) via production AI pipeline…\n`)

  let ok = 0, failed = 0
  for (const tpl of targets) {
    try   { await generateTemplate(tpl, force); ok++ }
    catch (err: any) { console.error(`   ❌ FAILED: ${err.message}`); failed++ }
  }
  console.log(`\n✅  ${ok} done, ❌ ${failed} failed`)
})()
