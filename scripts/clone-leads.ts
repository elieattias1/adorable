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
  notes:         string | null
  site_id:       string | null
  status:        string
}

// ── Fetch leads from DB ────────────────────────────────────────────────────────

async function fetchLeads(): Promise<DbLead[]> {
  let query = supabase
    .from('leads')
    .select('id, business_name, address, phone, email, city, postcode, departement, notes, site_id, status')
    .eq('user_id', ADMIN_USER_ID!)
    .is('site_id', null)
    .neq('status', 'closed')

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
  name:    string
  address: string | null
  phone:   string | null
  email:   string | null
}

let cachedTemplateStrings: TemplateStrings | null = null

async function extractTemplateStrings(templateCode: string, templateName: string): Promise<TemplateStrings> {
  if (cachedTemplateStrings) return cachedTemplateStrings

  const prompt = `This is the source code of a bakery website named "${templateName}".
Find the exact string literals used in the JSX for:
- the bakery's display name
- the full address
- the phone number
- the contact email (if any)

Return ONLY a JSON object with these keys: name, address, phone, email.
Use null for anything not found. No explanation, no markdown.`

  const res = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages:   [{ role: 'user', content: `${prompt}\n\nCODE:\n${templateCode.slice(0, 6000)}` }],
  })

  const text = res.content.find(b => b.type === 'text')?.text ?? ''
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (!json) throw new Error(`Could not extract template strings from: ${text}`)

  cachedTemplateStrings = JSON.parse(json) as TemplateStrings
  console.log(`   Template strings: ${JSON.stringify(cachedTemplateStrings)}`)
  return cachedTemplateStrings
}

// ── Step 2: plain replaceAll substitution ─────────────────────────────────────

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

  console.log(`\n🍞  Clone Leads — ${filterDesc}${DRY_RUN ? '  [DRY-RUN]' : ''}`)
  console.log(`   Template  : ${APP_URL}/s/${TEMPLATE_SITE_ID}`)
  console.log()

  const [leads, template] = await Promise.all([fetchLeads(), fetchTemplateCode()])

  if (leads.length === 0) {
    console.log(`ℹ️  No unbuilt leads found for ${filterDesc}.`)
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
      const siteId  = randomUUID()
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
