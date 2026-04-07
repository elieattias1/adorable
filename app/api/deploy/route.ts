import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { sendSiteLiveEmail } from '@/lib/email'

export const maxDuration = 30

// ─── POST /api/deploy ──────────────────────────────────────────────────────────
// Sites are served directly from adorable.click/s/[siteId] — no external
// build step needed. "Deploying" just marks the site as published.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { siteId } = await req.json()

    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single()

    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    if (!site.html) return NextResponse.json({ error: 'No content to deploy' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'
    const url = `${appUrl}/s/${siteId}`

    await supabaseAdmin
      .from('sites')
      .update({ deployed_url: url, is_published: true })
      .eq('id', siteId)

    // Send site-live email (fire and forget)
    if (user.email) {
      sendSiteLiveEmail(user.email, site.name, url).catch(console.error)
    }

    return NextResponse.json({ url, building: false })

  } catch (err: any) {
    console.error('[deploy]', err)
    return NextResponse.json({ error: err.message || 'Deployment failed' }, { status: 500 })
  }
}

// ─── GET /api/deploy — kept for backwards compatibility (always returns ready) ─
export async function GET(_req: NextRequest) {
  return NextResponse.json({ status: 'ready' })
}
