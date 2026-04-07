import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

// POST /api/auth/welcome — send welcome email after signup
// Called client-side immediately after successful signUp()
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ ok: false })

    // Fire-and-forget — don't block on email delivery
    sendWelcomeEmail(user.email).catch(console.error)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/welcome]', err)
    return NextResponse.json({ ok: false })
  }
}
