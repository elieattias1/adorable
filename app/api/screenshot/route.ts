/**
 * POST /api/screenshot
 * Body: { siteId: string }
 *
 * Takes a 1440×900 screenshot of /s/[siteId], stores it in Supabase Storage
 * under screenshots/[siteId].png, and returns the public URL.
 *
 * Requires Playwright + Chromium installed locally (npm install playwright &&
 * npx playwright install chromium).
 *
 * On Vercel/serverless, this route will return 501 unless you configure
 * @sparticuz/chromium or a dedicated screenshot microservice.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { siteId } = await req.json()
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // ── Verify site exists ─────────────────────────────────────────────────────
  const { data: site } = await supabaseAdmin
    .from('sites')
    .select('id, name')
    .eq('id', siteId)
    .single()

  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  // ── Playwright screenshot ──────────────────────────────────────────────────
  let screenshotBuffer: Buffer
  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ headless: true })
    const page    = await browser.newPage()
    await page.setViewportSize({ width: 1440, height: 900 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const url    = `${appUrl}/s/${siteId}`

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })

    // Wait for the loading overlay to disappear (site renders React)
    await page.waitForSelector('#sitebot-loading', { state: 'detached', timeout: 20_000 }).catch(() => {})
    // Extra settle time for animations
    await page.waitForTimeout(1500)

    screenshotBuffer = await page.screenshot({ type: 'png', fullPage: false })
    await browser.close()
  } catch (err: any) {
    // Playwright not available (serverless) — return 501
    if (err?.code === 'MODULE_NOT_FOUND' || err?.message?.includes('Executable')) {
      return NextResponse.json({ error: 'Playwright not available in this environment' }, { status: 501 })
    }
    console.error('[screenshot] Playwright error:', err)
    return NextResponse.json({ error: 'Screenshot failed', detail: err?.message }, { status: 500 })
  }

  // ── Upload to Supabase Storage ─────────────────────────────────────────────
  const storagePath = `screenshots/${siteId}.png`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('sites')
    .upload(storagePath, screenshotBuffer, {
      contentType:  'image/png',
      upsert:       true,
    })

  if (uploadError) {
    console.error('[screenshot] Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed', detail: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('sites')
    .getPublicUrl(storagePath)

  // ── Persist URL on the site row ────────────────────────────────────────────
  await supabaseAdmin
    .from('sites')
    .update({ screenshot_url: publicUrl })
    .eq('id', siteId)

  return NextResponse.json({ url: publicUrl })
}
