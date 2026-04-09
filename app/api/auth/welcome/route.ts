import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

// POST /api/auth/welcome — send welcome email + save phone after signup
// Called client-side immediately after successful signUp()
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const phone: string | undefined = body.phone

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // After signUp with email confirmation, session may not be set yet.
    // Fall back to looking up by email if provided.
    let userId = user?.id
    let userEmail = user?.email

    if (!userId && body.email) {
      const { data: found } = await supabaseAdmin.auth.admin.listUsers()
      const match = found?.users?.find(u => u.email === body.email)
      if (match) { userId = match.id; userEmail = match.email }
    }

    if (!userEmail) return NextResponse.json({ ok: false })

    // Save phone to profile
    if (userId && phone) {
      await supabaseAdmin
        .from('profiles')
        .upsert({ id: userId, notification_phone: phone }, { onConflict: 'id' })
    }

    // Fire-and-forget — don't block on email delivery
    sendWelcomeEmail(userEmail).catch(console.error)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/welcome]', err)
    return NextResponse.json({ ok: false })
  }
}
