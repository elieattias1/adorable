/**
 * scripts/clone-leads.ts
 *
 * Clones a "master template" bakery site for every lead in the `leads` table
 * that matches the target region (val d'oise by default) and hasn't been built yet.
 *
 * For each lead Claude (Haiku) substitutes only:
 *   - bakery name
 *   - address
 *   - phone / contact info
 *   - siteId in API fetch calls (via regex)
 * The design, layout, images, and products are left unchanged.
 *
 * After creation the lead's `site_id` and `status` are updated to 'built'.
 *
 * Usage:
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts --dry-run
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts --dept=95          # filter by departement
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts --postcode=95260   # filter by postcode prefix
 *   ADMIN_USER_ID=<uuid> npx tsx scripts/clone-leads.ts --limit=5          # max N leads
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
    .is('site_id', null)          // not yet built
    .neq('status', 'closed')      // exclude closed leads

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

// ── Claude Haiku substitution ──────────────────────────────────────────────────
// Swaps only the business-specific text — name, address, phone, email.
// Everything else (design, images, layout, API calls) is preserved verbatim.

async function substituteBusinessInfo(
  templateCode: string,
  templateName: string,
  lead:         DbLead,
): Promise<string> {
  const lines = [
    `- Nom : "${lead.business_name}"`,
    lead.address ? `- Adresse : "${lead.address}${lead.city ? ', ' + lead.city : ''}"` : '',
    lead.phone   ? `- Téléphone : "${lead.phone}"`   : '',
    lead.email   ? `- Email : "${lead.email}"`        : '',
    lead.notes   ? `- Note : ${lead.notes}`           : '',
  ].filter(Boolean).join('\n')

  const prompt = `Tu es un développeur React. Voici le code source d'un site de boulangerie nommée "${templateName}".
Ton seul travail : remplacer le nom, l'adresse, le téléphone et l'email de la boulangerie par les nouvelles valeurs ci-dessous.

NOUVELLE BOULANGERIE :
${lines}

RÈGLES ABSOLUES :
1. Remplace uniquement les chaînes de texte qui correspondent au nom, à l'adresse, au téléphone ou à l'email de la boulangerie actuelle.
2. Ne modifie JAMAIS : les couleurs, la mise en page, les images Unsplash, les URLs d'API, les classes Tailwind, la logique JavaScript, les imports, les hooks React.
3. Si une information n'est pas fournie, garde le texte original de la boulangerie template.
4. Retourne UNIQUEMENT le code React modifié. Aucune explication, aucun backtick, aucune balise.

CODE SOURCE :
${templateCode}`

  const res = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 16000,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = res.content.find(b => b.type === 'text')?.text ?? ''
  if (!text || text.length < 200) throw new Error('Claude returned empty or truncated response')
  return text.trim()
}

// ── Patch siteId in API fetch calls ───────────────────────────────────────────

function patchSiteId(code: string, newSiteId: string): string {
  return code
    .replace(/([?&]siteId=['"]?)([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g,
      (_, prefix) => `${prefix}${newSiteId}`)
    .replace(/(site_id\s*[=:]\s*['"])([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(['"])/g,
      (_, pre, _id, post) => `${pre}${newSiteId}${post}`)
}

// ── Seed products ──────────────────────────────────────────────────────────────

async function seedProducts(siteId: string) {
  const rows = DEFAULT_BAKERY_PRODUCTS.map((p, i) => ({
    id:          randomUUID(),
    site_id:     siteId,
    name:        p.name,
    category:    p.category,
    price_cents: p.price_cents,
    emoji:       p.emoji,
    photo_url:   p.photo_url,
    sort_order:  p.sort_order ?? i,
    is_visible:  true,
  }))
  const { error } = await supabase.from('products').insert(rows)
  if (error) console.warn(`  ⚠  products seed error: ${error.message}`)
}

// ── Create site + update lead ──────────────────────────────────────────────────

async function createSiteForLead(lead: DbLead, html: string): Promise<string> {
  const siteId  = randomUUID()
  const patched = patchSiteId(html, siteId)

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] site id would be ${siteId}`)
    return siteId
  }

  // 1. Insert site
  const { error: siteErr } = await supabase.from('sites').insert({
    id:           siteId,
    user_id:      ADMIN_USER_ID,
    name:         lead.business_name,
    type:         'boulangerie',
    html:         patched,
    is_published: false,
    view_count:   0,
  })
  if (siteErr) throw new Error(`Site insert failed: ${siteErr.message}`)

  // 2. Seed products
  await seedProducts(siteId)

  // 3. Update lead → mark built
  await supabase
    .from('leads')
    .update({ site_id: siteId, status: 'built', updated_at: new Date().toISOString() })
    .eq('id', lead.id)

  return siteId
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const filterDesc = POSTCODE_PREFIX
    ? `postcode ${POSTCODE_PREFIX}*`
    : `${DEPT_FILTER}`

  console.log(`\n🍞  Clone Leads — ${filterDesc}${DRY_RUN ? '  [DRY-RUN]' : ''}`)
  console.log(`   Template  : ${APP_URL}/s/${TEMPLATE_SITE_ID}`)
  console.log()

  // Fetch leads + template in parallel
  const [leads, template] = await Promise.all([fetchLeads(), fetchTemplateCode()])

  if (leads.length === 0) {
    console.log(`ℹ️  No unbuilt leads found for ${filterDesc}. Nothing to do.`)
    return
  }

  console.log(`📋  ${leads.length} lead(s) to process (template: "${template.name}")\n`)

  const ok:   Array<{ name: string; url: string }> = []
  const fail: Array<{ name: string; error: string }> = []

  for (const lead of leads) {
    process.stdout.write(`🔄  ${lead.business_name.padEnd(38)} `)
    try {
      const substituted = await substituteBusinessInfo(template.html, template.name, lead)
      const siteId      = await createSiteForLead(lead, substituted)
      const url         = `${APP_URL}/s/${siteId}`
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
