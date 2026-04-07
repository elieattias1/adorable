import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNudgeEmail } from '@/lib/email'

export const runtime = 'nodejs'

// GET /api/cron/nudge — called daily by Vercel Cron
// Finds users who signed up 7 days ago and haven't deployed a site yet
export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or internally)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

    // Find profiles created 7 days ago (±24h window) who have no published site
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .gte('created_at', eightDaysAgo.toISOString())
      .lte('created_at', sevenDaysAgo.toISOString())

    if (!profiles?.length) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      if (!profile.email) continue

      // Check if they have any deployed site
      const { count } = await supabaseAdmin
        .from('sites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_published', true)

      if ((count ?? 0) === 0) {
        await sendNudgeEmail(profile.email).catch(console.error)
        sent++
      }
    }

    console.log(`[cron/nudge] Sent ${sent} nudge emails`)
    return NextResponse.json({ sent })

  } catch (err) {
    console.error('[cron/nudge]', err)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
