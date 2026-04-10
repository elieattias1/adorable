/**
 * scripts/upload-product-photos.ts
 *
 * 1. Uploads every photo from "photos boulangerie/" to Supabase storage
 *    (bucket: sites, path: product-photos/<slug>.<ext>)
 * 2. Prints the mapping slug → publicUrl so you can paste into bakery-defaults.ts
 * 3. Updates all existing products in DB whose name matches a slug to set photo_url
 *
 * Usage:
 *   npx tsx scripts/upload-product-photos.ts
 *   npx tsx scripts/upload-product-photos.ts --dry-run   (skip upload, just print mapping)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DRY_RUN    = process.argv.includes('--dry-run')
const BUCKET     = 'sites'
const PHOTOS_DIR = join(process.cwd(), 'photos boulangerie')

// ── Slug mapping: folder name → product slug in bakery-defaults.ts ──────────
const FOLDER_TO_SLUG: Record<string, string> = {
  'baguette tradition':       'baguette_tradition',
  'pain au levain':           'pain_levain',
  'pain aux cereales':        'pain_cereales',
  'pain complet':             'pain_complet',
  'pain de campagne':         'pain_campagne',
  'croissant':                'croissant',
  'pain au chocolat':         'pain_chocolat',
  'chausson aux pommes':      'chausson_pommes',
  'brioche':                  'brioche',
  'chouquettes':              'chouquettes',       // NEW
  'eclair':                   'eclair',
  'opera':                    'opera',
  'paris brest':              'paris_brest',
  'tarte au citron meringuee':'tarte_citron',
  'tartelette aux fraises':   'tarte_fruits',
  'cafe':                     'cafe',
  'chocolat chaud':           'chocolat_chaud',
  'coca':                     'coca',              // NEW
  "jus d'orange":             'jus_orange',
}

// ── Pick best file from a folder (prefer jpg/png over webp/avif) ────────────
function pickBestFile(dir: string): string | null {
  let files: string[]
  try { files = readdirSync(dir).filter(f => !f.startsWith('.')) }
  catch { return null }
  if (files.length === 0) return null
  const preferred = files.find(f => /\.(jpe?g|png)$/i.test(f))
  return join(dir, preferred ?? files[0])
}

// ── Collect all photos to upload ─────────────────────────────────────────────
interface PhotoEntry {
  slug:    string
  srcPath: string
  ext:     string
}

function collectPhotos(): PhotoEntry[] {
  const entries: PhotoEntry[] = []

  // Also handle root-level files in category folders (e.g. pain-levain-naturel-ithq.jpg)
  const rootLevelMap: Record<string, string> = {
    'pain-levain-naturel-ithq.jpg': 'pain_levain',
  }

  const categories = ['pain', 'viennoiserie', 'patisserie', 'boissons']

  for (const cat of categories) {
    const catDir = join(PHOTOS_DIR, cat)
    let items: string[]
    try { items = readdirSync(catDir).filter(f => !f.startsWith('.')) }
    catch { continue }

    for (const item of items) {
      const itemPath = join(catDir, item)
      const stat = statSync(itemPath)

      if (stat.isFile()) {
        // Root-level file in category
        const slug = rootLevelMap[item]
        if (slug) entries.push({ slug, srcPath: itemPath, ext: extname(item) })
      } else if (stat.isDirectory()) {
        const slug = FOLDER_TO_SLUG[item.toLowerCase()]
        if (!slug) { console.warn(`  ⚠️  No slug for folder: ${cat}/${item}`) ; continue }
        const file = pickBestFile(itemPath)
        if (!file) { console.warn(`  ⚠️  No file in: ${cat}/${item}`) ; continue }
        entries.push({ slug, srcPath: file, ext: extname(file) })
      }
    }
  }

  return entries
}

// ── Upload + return public URL ────────────────────────────────────────────────
async function uploadPhoto(entry: PhotoEntry): Promise<string> {
  const storagePath = `product-photos/${entry.slug}${entry.ext}`
  const buffer      = readFileSync(entry.srcPath)

  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.webp': 'image/webp',
    '.avif': 'image/avif',
  }
  const contentType = mimeMap[entry.ext.toLowerCase()] ?? 'image/jpeg'

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Upload failed for ${entry.slug}: ${error.message}`)

  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}

// ── Main ──────────────────────────────────────────────────────────────────────
;(async () => {
  const photos = collectPhotos()
  console.log(`\n📸  Found ${photos.length} photos to process\n`)

  const slugToUrl: Record<string, string> = {}

  for (const entry of photos) {
    process.stdout.write(`  ${entry.slug.padEnd(30)} `)

    if (DRY_RUN) {
      console.log(`[dry-run] ${basename(entry.srcPath)}`)
      slugToUrl[entry.slug] = `[dry-run: ${basename(entry.srcPath)}]`
      continue
    }

    try {
      const url = await uploadPhoto(entry)
      slugToUrl[entry.slug] = url
      console.log(`✓`)
    } catch (err: any) {
      console.log(`✗ ${err.message}`)
    }
  }

  // ── Print mapping for bakery-defaults.ts ──────────────────────────────────
  console.log('\n\n── Paste these URLs into bakery-defaults.ts ────────────────────────────\n')
  for (const [slug, url] of Object.entries(slugToUrl)) {
    console.log(`  '${slug}': '${url}',`)
  }

  if (DRY_RUN) { console.log('\n[dry-run mode — no uploads performed]'); return }

  // ── Update existing products in DB ────────────────────────────────────────
  console.log('\n\n── Updating products in DB ─────────────────────────────────────────────\n')

  // Load all products
  const { data: allProducts, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, photo_url')

  if (fetchErr) { console.error('Failed to fetch products:', fetchErr.message); return }

  let updated = 0
  for (const [slug, url] of Object.entries(slugToUrl)) {
    // Match by slug keyword in name (case-insensitive)
    const keyword = slug.replace(/_/g, ' ')
    const matches = (allProducts ?? []).filter(p =>
      p.name.toLowerCase().includes(keyword.toLowerCase())
    )
    for (const product of matches) {
      const { error } = await supabase
        .from('products')
        .update({ photo_url: url })
        .eq('id', product.id)
      if (error) console.warn(`  ✗ ${product.name}: ${error.message}`)
      else { console.log(`  ✓ ${product.name}`); updated++ }
    }
  }

  console.log(`\n✅  ${updated} products updated in DB`)
})()
