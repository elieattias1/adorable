#!/usr/bin/env node
/**
 * scripts/import-boulangeries.mjs
 *
 * For each boulangerie in website-output:
 *   1. Load home.png + metadata JSON + home HTML
 *   2. Use Claude vision to:
 *      a. Detect if the screenshot is a cookies/consent wall → skip
 *      b. Score the website design quality 1–10
 *   3. Upload screenshot PNG + HTML to Supabase Storage
 *   4. Upsert a row into `templates` with industry='Boulangerie'
 *
 * Usage:
 *   node scripts/import-boulangeries.mjs
 *   node scripts/import-boulangeries.mjs --dry-run
 *   node scripts/import-boulangeries.mjs --slug=a-lacroix
 *   node scripts/import-boulangeries.mjs --skip-vision   (skip Claude, score=5)
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient }  from '@supabase/supabase-js'
import Anthropic         from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── Load .env.local ───────────────────────────────────────────────────────────
function loadEnv() {
  const p = path.join(ROOT, '.env.local')
  if (!fs.existsSync(p)) throw new Error('.env.local not found')
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
}
loadEnv()

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }
if (!ANTHROPIC_KEY)                { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1) }

const supabase  = createClient(SUPABASE_URL, SERVICE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ── Args ──────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2)
const DRY_RUN    = args.includes('--dry-run')
const SKIP_VISION = args.includes('--skip-vision')
const ONLY_SLUG  = args.find(a => a.startsWith('--slug='))?.slice(7) ?? null

// ── Paths ─────────────────────────────────────────────────────────────────────
const DATA_ROOT   = '/Users/elieattias/Downloads/no-website-finder/website-output'
const META_DIR    = path.join(DATA_ROOT, 'metadata')
const SHOT_DIR    = path.join(DATA_ROOT, 'screenshots')
const HTML_DIR    = path.join(DATA_ROOT, 'html')
const BUCKET      = 'sites'

// ── Collect slugs ─────────────────────────────────────────────────────────────
const allSlugs = fs.readdirSync(META_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''))
  .filter(s => !ONLY_SLUG || s === ONLY_SLUG)

console.log(`\n🥐  Importing ${allSlugs.length} boulangeries${DRY_RUN ? ' (DRY RUN)' : ''}${SKIP_VISION ? ' (no vision)' : ''}\n`)

// ── Check which columns exist ─────────────────────────────────────────────────
const { error: colProbe } = await supabase.from('templates').select('quality_score,html_url,has_cookies_wall').limit(1)
const EXTENDED_COLS = !colProbe

if (!EXTENDED_COLS) {
  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│  One-time setup: run this SQL in the Supabase SQL editor:       │')
  console.log('│                                                                  │')
  console.log('│  ALTER TABLE templates                                           │')
  console.log('│    ADD COLUMN IF NOT EXISTS quality_score INT,                  │')
  console.log('│    ADD COLUMN IF NOT EXISTS html_url TEXT,                      │')
  console.log('│    ADD COLUMN IF NOT EXISTS has_cookies_wall BOOLEAN            │')
  console.log('│      NOT NULL DEFAULT FALSE;                                     │')
  console.log('│                                                                  │')
  console.log('│  Proceeding without those columns for now.                      │')
  console.log('└─────────────────────────────────────────────────────────────────┘\n')
}

// ── Vision: detect cookies wall + score ───────────────────────────────────────
async function analyzeScreenshot(pngPath) {
  if (SKIP_VISION) return { isCookiesWall: false, score: 5, reason: 'vision skipped' }

  const buffer = fs.readFileSync(pngPath)
  const b64    = buffer.toString('base64')

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: b64 },
        },
        {
          type: 'text',
          text: `You are evaluating a boulangerie/bakery website screenshot.

Answer with a JSON object only (no markdown, no explanation):
{
  "is_cookies_wall": true/false,   // true if the page is dominated by a cookie consent banner/overlay
  "score": 1-10,                   // visual design quality (1=ugly/broken, 10=beautiful/professional). Only score if not a cookies wall.
  "reason": "one short sentence"   // brief justification of the score or why it's a cookies wall
}`,
        },
      ],
    }],
  })

  const text = msg.content[0].text.trim()
  try {
    const json = JSON.parse(text.replace(/^```json\n?|```$/g, '').trim())
    return {
      isCookiesWall: !!json.is_cookies_wall,
      score:         typeof json.score === 'number' ? Math.round(json.score) : 5,
      reason:        json.reason ?? '',
    }
  } catch {
    // If parsing fails, be conservative
    return { isCookiesWall: false, score: 5, reason: 'parse error' }
  }
}

// ── Storage upload ────────────────────────────────────────────────────────────
async function upload(localPath, storagePath, contentType) {
  if (!fs.existsSync(localPath)) return null
  const buffer = fs.readFileSync(localPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true })
  if (error) { console.warn(`    ⚠️  upload failed (${storagePath}): ${error.message}`); return null }
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return publicUrl
}

// ── Main loop ─────────────────────────────────────────────────────────────────
let ok = 0, skipped = 0, failed = 0

for (const slug of allSlugs) {
  const idx = ok + skipped + failed + 1
  process.stdout.write(`  [${idx}/${allSlugs.length}] ${slug.padEnd(45)} `)

  // Load metadata
  const metaPath = path.join(META_DIR, `${slug}.json`)
  let meta
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) }
  catch { console.log('❌  bad metadata'); failed++; continue }

  const screenshotPath = path.join(SHOT_DIR, slug, 'home.png')
  const htmlPath       = path.join(HTML_DIR, `${slug}.html`)

  if (!fs.existsSync(screenshotPath)) {
    console.log('⏭️  no screenshot'); skipped++; continue
  }

  // Vision analysis
  let analysis = { isCookiesWall: false, score: 5, reason: '' }
  try {
    analysis = await analyzeScreenshot(screenshotPath)
  } catch (err) {
    console.log(`⚠️  vision error: ${err.message}`)
    analysis = { isCookiesWall: false, score: 5, reason: 'vision error' }
  }

  if (analysis.isCookiesWall) {
    console.log(`🍪  cookies wall — skipped (${analysis.reason})`)
    skipped++
    continue
  }

  if (DRY_RUN) {
    console.log(`✅  score=${analysis.score} — ${analysis.reason} (dry run)`)
    ok++
    continue
  }

  // Upload screenshot + HTML
  const screenshotUrl = await upload(screenshotPath, `templates/boulangeries/${slug}.png`, 'image/png')
  const htmlUrl       = await upload(htmlPath,       `templates/boulangeries/${slug}.html`, 'text/html')

  // Build row
  const row = {
    slug,
    name:           meta.name ?? slug,
    url:            meta.websiteUrl ?? '',
    industry:       'Boulangerie',
    site_type:      'bakery',
    tags:           ['boulangerie', 'bakery', 'food', 'artisan', 'paris'],
    priority:       analysis.score >= 8 ? 'high' : analysis.score >= 5 ? 'medium' : 'low',
    fonts:          meta.meta?.fonts ?? [],
    has_dark_bg:    meta.meta?.hasDarkBg ?? false,
    cta_texts:      meta.meta?.ctaTexts?.slice(0, 5) ?? [],
    screenshot_url: screenshotUrl,
    ...(EXTENDED_COLS && {
      html_url:         htmlUrl,
      quality_score:    analysis.score,
      has_cookies_wall: false,
    }),
  }

  const { error } = await supabase.from('templates').upsert(row, { onConflict: 'slug' })
  if (error) {
    console.log(`❌  DB error: ${error.message}`)
    failed++
    continue
  }

  console.log(`✅  score=${analysis.score}/10  📸${screenshotUrl ? '✓' : '✗'}  📄${htmlUrl ? '✓' : '✗'}  — ${analysis.reason}`)
  ok++
}

console.log(`\n🥐  Done: ${ok} imported, ${skipped} skipped (cookies/no-screenshot), ${failed} failed\n`)
