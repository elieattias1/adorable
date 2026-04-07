#!/usr/bin/env node
/**
 * scripts/import-templates.mjs
 *
 * Imports the scraped reference templates into Supabase:
 *   1. Uploads each screenshot PNG to Storage bucket "sites" under templates/screenshots/
 *   2. Upserts a row in the `templates` table
 *
 * Prerequisites:
 *   - Run the SQL migration: supabase/migrations/20260407_templates_table.sql
 *   - Ensure the "sites" storage bucket exists and is public
 *   - Have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   node scripts/import-templates.mjs
 *   node scripts/import-templates.mjs --dry-run   (no writes)
 *   node scripts/import-templates.mjs --slug notion (single site)
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── Load env ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found')
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
}
loadEnv()

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Args ──────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ONLY    = args.find(a => a.startsWith('--slug='))?.slice(7) ?? null

// ── Load scrape results ───────────────────────────────────────────────────────
const SCRAPER_ROOT  = path.join(ROOT, 'scraper', 'output')
const resultsPath   = path.join(SCRAPER_ROOT, 'scrape-results.json')

if (!fs.existsSync(resultsPath)) {
  console.error('scraper/output/scrape-results.json not found — run the scraper first')
  process.exit(1)
}

const { sites } = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'))
const toImport  = sites
  .filter(s => s.status === 'success')
  .filter(s => !ONLY || s.slug === ONLY)

console.log(`\n📦  Importing ${toImport.length} templates${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uploadScreenshot(slug) {
  const localPath = path.join(SCRAPER_ROOT, 'screenshots', `${slug}.png`)
  if (!fs.existsSync(localPath)) {
    console.warn(`  ⚠️  screenshot not found: ${slug}.png`)
    return null
  }

  const storagePath = `templates/screenshots/${slug}.png`
  const buffer      = fs.readFileSync(localPath)

  const { error } = await supabase.storage
    .from('sites')
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: true })

  if (error) {
    console.warn(`  ⚠️  upload failed for ${slug}: ${error.message}`)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('sites')
    .getPublicUrl(storagePath)

  return publicUrl
}

async function upsertTemplate(site, screenshotUrl) {
  const row = {
    slug:           site.slug,
    name:           site.name,
    url:            site.url,
    industry:       site.industry,
    site_type:      site.type,
    tags:           site.tags ?? [],
    priority:       site.priority ?? 'medium',
    fonts:          site.meta?.fonts ?? [],
    has_dark_bg:    site.meta?.hasDarkBg ?? false,
    cta_texts:      site.meta?.ctaTexts ?? [],
    screenshot_url: screenshotUrl,
  }

  const { error } = await supabase
    .from('templates')
    .upsert(row, { onConflict: 'slug' })

  if (error) throw new Error(`DB upsert failed for ${site.slug}: ${error.message}`)
}

// ── Main loop ─────────────────────────────────────────────────────────────────

let ok = 0, failed = 0

for (const site of toImport) {
  process.stdout.write(`  [${ok + failed + 1}/${toImport.length}] ${site.name.padEnd(28)} `)

  if (DRY_RUN) {
    console.log('(skipped — dry run)')
    ok++
    continue
  }

  try {
    const screenshotUrl = await uploadScreenshot(site.slug)
    await upsertTemplate(site, screenshotUrl)
    console.log(`✅  ${screenshotUrl ? '📸' : '  '}`)
    ok++
  } catch (err) {
    console.log(`❌  ${err.message}`)
    failed++
  }
}

console.log(`\n✅  ${ok} imported, ❌ ${failed} failed\n`)
