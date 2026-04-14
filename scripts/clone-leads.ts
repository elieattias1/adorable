/**
 * scripts/clone-leads.ts
 *
 * Clones a "master template" bakery site for every lead in the `leads` table
 * that matches the target region (val d'oise by default) and hasn't been built yet.
 *
 * Substitution strategy — two steps, no regex:
 *   1. Haiku reads the template code and returns the EXACT strings used for
 *      name / address / phone / email (tiny JSON response, no truncation risk).
 *   2. We do plain replaceAll() with the new bakery's values.
 *   The siteId is also swapped with a plain replaceAll().
 *
 * After creation the lead's `site_id` and `status` are updated to 'built'.
 *
 * Usage:
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts --dry-run
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts --dept=95
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts --postcode=95100
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts --limit=5
 *
 * Prerequisites:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY in .env.local
 *   ADMIN_USER_ID env var — the Supabase user that owns both the leads and the new sites
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import { DEFAULT_BAKERY_PRODUCTS } from '../lib/bakery-defaults'

dotenv.config({ path: '.env.local' })

// ── Config ─────────────────────────────────────────────────────────────────────

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'

const ADMIN_USER_ID = process.env.ADMIN_USER_ID
const DRY_RUN       = process.argv.includes('--dry-run')
const REBUILD       = process.argv.includes('--rebuild')  // re-process already-built leads

// CLI flags
const argDept     = process.argv.find(a => a.startsWith('--dept='))?.split('=')[1]
const argPostcode = process.argv.find(a => a.startsWith('--postcode='))?.split('=')[1]
const argLimit    = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] ?? '9999', 10)

// Maps numeric dept codes → full name stored in the `departement` column
const DEPT_NAME_MAP: Record<string, string> = {
  '75': 'Paris',
  '77': 'Seine-et-Marne',
  '78': 'Yvelines',
  '91': 'Essonne',
  '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne',
  '95': "Val-d'Oise",
}

// Default: Val-d'Oise. Pass --dept=92 or --dept=Paris etc.
const DEPT_FILTER     = argDept ? (DEPT_NAME_MAP[argDept] ?? argDept) : "Val-d'Oise"
const POSTCODE_PREFIX = argPostcode ?? null  // overrides dept filter when set

// The bakery site to use as the visual/structural template
const TEMPLATE_SITE_ID = '2c183759-85ed-46c3-99c9-cf39218ee0c1'

// ─────────────────────────────────────────────────────────────────────────────

if (!ADMIN_USER_ID) {
  console.error('❌  ADMIN_USER_ID env var required')
  process.exit(1)
}

// ── DB types ───────────────────────────────────────────────────────────────────

interface DbLead {
  id:            string
  business_name: string
  address:       string | null
  phone:         string | null
  email:         string | null
  city:          string | null
  postcode:      string | null
  departement:   string | null
  instagram:     string | null
  notes:         string | null
  site_id:       string | null
  status:        string
  latitude:      number | null
  longitude:     number | null
}

// ── Fetch leads from DB ────────────────────────────────────────────────────────

async function fetchLeads(): Promise<DbLead[]> {
  let query = supabase
    .from('leads')
    .select('id, business_name, address, phone, email, city, postcode, departement, instagram, notes, site_id, status, latitude, longitude')
    .eq('user_id', ADMIN_USER_ID!)
    .neq('status', 'closed')

  if (REBUILD) {
    // Target leads that already have a site (for rebuilding)
    query = query.not('site_id', 'is', null)
  } else {
    // Normal run: only unbuilt leads
    query = query.is('site_id', null)
  }

  if (POSTCODE_PREFIX) {
    query = query.like('postcode', `${POSTCODE_PREFIX}%`)
  } else {
    query = query.eq('departement', DEPT_FILTER)
  }

  const { data, error } = await query.limit(argLimit)
  if (error) throw new Error(`Failed to fetch leads: ${error.message}`)
  return (data ?? []) as DbLead[]
}

// ── Fetch template code ────────────────────────────────────────────────────────

async function fetchTemplateCode(): Promise<{ html: string; name: string }> {
  const { data, error } = await supabase
    .from('sites')
    .select('html, name')
    .eq('id', TEMPLATE_SITE_ID)
    .single()
  if (error || !data?.html) throw new Error(`Template site not found: ${error?.message}`)
  return data as { html: string; name: string }
}

// ── Step 1: extract exact strings used in the template ────────────────────────
// Haiku returns a tiny JSON — no risk of truncation, no regex needed.

interface TemplateStrings {
  name:      string
  address:   string | null
  phone:     string | null
  email:     string | null
  instagram: string | null
}

let cachedTemplateStrings: TemplateStrings | null = null

async function extractTemplateStrings(templateCode: string, templateName: string): Promise<TemplateStrings> {
  if (cachedTemplateStrings) return cachedTemplateStrings

  const prompt = `This is the React source code of a bakery website named "${templateName}".
Find the EXACT string literals that appear in the JSX/JS for:
- the bakery display name (as shown to visitors)
- the full street address
- the phone number
- the contact email
- the Instagram handle or URL
- the full <img .../> or <img ...> JSX tag of the decorative photo in the "nous rendre visite" / visit us / contact section (the photo of the baker/bakery, not a product image). Copy it character-for-character including all attributes and the closing slash.

Return ONLY a JSON object: { "name": "...", "address": "...", "phone": "...", "email": "...", "instagram": "...", "contact_photo": "..." }
Use null for anything not present. Copy the strings character-for-character as they appear in the code.`

  const res = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages:   [{ role: 'user', content: `${prompt}\n\nCODE:\n${templateCode}` }],
  })

  const text = res.content.find(b => b.type === 'text')?.text ?? ''
  // Extract the JSON object from the response
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`Could not extract template strings. Response: ${text}`)

  cachedTemplateStrings = JSON.parse(text.slice(start, end + 1)) as TemplateStrings
  console.log(`   Template strings: ${JSON.stringify(cachedTemplateStrings)}`)
  return cachedTemplateStrings
}

// ── Step 2: plain replaceAll substitution ─────────────────────────────────────

function replaceOsmUrl(code: string, lat: number, lon: number): string {
  const marker = 'openstreetmap.org/export/embed.html'
  const idx = code.indexOf(marker)
  if (idx === -1) return code

  // Walk back to find the start of the URL (opening quote)
  let urlStart = idx
  while (urlStart > 0 && code[urlStart] !== '"' && code[urlStart] !== "'" && code[urlStart] !== '`') {
    urlStart--
  }
  urlStart++ // skip the opening quote

  // Walk forward to find the end of the URL (closing quote)
  const quote = code[urlStart - 1]
  let urlEnd = urlStart
  while (urlEnd < code.length && code[urlEnd] !== quote) {
    urlEnd++
  }

  const oldUrl = code.slice(urlStart, urlEnd)
  const delta  = 0.003
  const bbox   = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
  const newUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`

  return code.split(oldUrl).join(newUrl)
}

function applySubstitutions(
  code:            string,
  templateStrings: TemplateStrings,
  lead:            DbLead,
  newSiteId:       string,
): string {
  let result = code

  // Swap siteId — plain string replace, no regex
  result = result.split(TEMPLATE_SITE_ID).join(newSiteId)

  // Swap business info — only replace where the template value is known
  if (templateStrings.name) {
    result = result.split(templateStrings.name).join(lead.business_name)
  }

  const fullAddress = [lead.address, lead.city].filter(Boolean).join(', ')
  if (templateStrings.address && fullAddress) {
    result = result.split(templateStrings.address).join(fullAddress)
  }

  if (templateStrings.phone && lead.phone) {
    result = result.split(templateStrings.phone).join(lead.phone)
  }

  if (templateStrings.email && lead.email) {
    result = result.split(templateStrings.email).join(lead.email)
  }

  // Instagram: replace with lead value if present, otherwise remove template value entirely
  if (templateStrings.instagram) {
    const replacement = lead.instagram ?? ''
    result = result.split(templateStrings.instagram).join(replacement)
  }

  // OSM map: replace the hardcoded OSM URL in the template with lead-specific coordinates
  if (lead.latitude != null && lead.longitude != null) {
    result = replaceOsmUrl(result, lead.latitude, lead.longitude)
  }

  // Sanitize any escaped apostrophes — \' is invalid in JSX text content
  result = result.split("\\'").join("'")

  return result
}

// ── Seed products ──────────────────────────────────────────────────────────────

async function seedProducts(siteId: string) {
  const rows = DEFAULT_BAKERY_PRODUCTS.map((p, i) => ({
    id:         randomUUID(),
    site_id:    siteId,
    user_id:    ADMIN_USER_ID,
    name:       p.name,
    category:   p.category,
    price:      p.price_cents,   // column is `price`, stores cents
    emoji:      p.emoji,
    photo_url:  p.photo_url,
    sort_order: p.sort_order ?? i,
    active:     true,
  }))
  const { error } = await supabase.from('products').insert(rows)
  if (error) console.warn(`  ⚠  products seed error: ${error.message}`)
}

// ── Create site + update lead ──────────────────────────────────────────────────

async function createSiteForLead(lead: DbLead, html: string, siteId: string): Promise<void> {
  if (DRY_RUN) return

  if (REBUILD && lead.site_id) {
    // Save current HTML as a version before overwriting
    const { data: current } = await supabase.from('sites').select('html').eq('id', lead.site_id).single()
    if (current?.html) {
      await supabase.from('versions').insert({
        site_id: lead.site_id,
        user_id: ADMIN_USER_ID,
        html:    current.html,
        note:    'Sauvegarde avant refonte automatique',
      })
    }

    // Update existing site with fresh HTML
    const { error: updateErr } = await supabase.from('sites')
      .update({ html, updated_at: new Date().toISOString() })
      .eq('id', lead.site_id)
    if (updateErr) throw new Error(`Site update failed: ${updateErr.message}`)

    // Mark lead as en cours (building)
    await supabase.from('leads')
      .update({ status: 'building', updated_at: new Date().toISOString() })
      .eq('id', lead.id)

    return
  }

  // Normal create path
  const { error: siteErr } = await supabase.from('sites').insert({
    id:           siteId,
    user_id:      ADMIN_USER_ID,
    name:         lead.business_name,
    type:         'bakery',
    html,
    is_published: false,
    view_count:   0,
  })
  if (siteErr) throw new Error(`Site insert failed: ${siteErr.message}`)

  await seedProducts(siteId)

  await supabase
    .from('leads')
    .update({ site_id: siteId, status: 'built', updated_at: new Date().toISOString() })
    .eq('id', lead.id)
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const filterDesc = POSTCODE_PREFIX ? `postcode ${POSTCODE_PREFIX}*` : DEPT_FILTER

  const modeLabel = REBUILD ? '  [REBUILD]' : ''
  console.log(`\n🍞  Clone Leads — ${filterDesc}${modeLabel}${DRY_RUN ? '  [DRY-RUN]' : ''}`)
  console.log(`   Template  : ${APP_URL}/s/${TEMPLATE_SITE_ID}`)
  console.log()

  const [leads, template] = await Promise.all([fetchLeads(), fetchTemplateCode()])

  if (leads.length === 0) {
    console.log(`ℹ️  No ${REBUILD ? 'built' : 'unbuilt'} leads found for ${filterDesc}.`)
    return
  }

  console.log(`📋  ${leads.length} lead(s) to process (template: "${template.name}")`)

  // Extract template strings once, reuse for all leads
  const templateStrings = await extractTemplateStrings(template.html, template.name)
  console.log()

  const ok:   Array<{ name: string; url: string }> = []
  const fail: Array<{ name: string; error: string }> = []

  for (const lead of leads) {
    process.stdout.write(`🔄  ${lead.business_name.padEnd(38)} `)
    try {
      const siteId  = REBUILD && lead.site_id ? lead.site_id : randomUUID()
      const html    = applySubstitutions(template.html, templateStrings, lead, siteId)
      await createSiteForLead(lead, html, siteId)
      const url     = `${APP_URL}/s/${siteId}`
      ok.push({ name: lead.business_name, url })
      console.log(`✅  ${url}`)
    } catch (err) {
      const msg = (err as Error).message
      fail.push({ name: lead.business_name, error: msg })
      console.log(`❌  ${msg}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅  ${ok.length} created   ❌  ${fail.length} failed\n`)

  for (const r of ok)   console.log(`  ✅  ${r.name.padEnd(40)} ${r.url}`)
  for (const r of fail) console.log(`  ❌  ${r.name.padEnd(40)} ${r.error}`)

  console.log(`\nPublier depuis le dashboard : ${APP_URL}/dashboard`)
}

main().catch(e => { console.error(e); process.exit(1) })
