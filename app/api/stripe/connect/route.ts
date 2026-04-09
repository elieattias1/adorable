/**
 * /api/stripe/connect
 * POST — create Stripe Connect Express account + return onboarding link
 * GET  — get current connect status for the authenticated user
 * PUT  — refresh onboarding link (if they didn't finish)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { stripe, createConnectAccount, createConnectOnboardingLink } from '@/lib/stripe'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'

// ─── GET — connect status ────────────────────────────────────────────────────
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_connect_id, stripe_connect_onboarded, orders_enabled')
    .eq('id', user.id)
    .single()

  // Sync onboarding status from Stripe if we have an account but not yet onboarded
  if (profile?.stripe_connect_id && !profile.stripe_connect_onboarded) {
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_connect_id)
      const onboarded = account.details_submitted && account.charges_enabled
      if (onboarded) {
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_connect_onboarded: true })
          .eq('id', user.id)
        return NextResponse.json({ connected: true, onboarded: true, ordersEnabled: profile.orders_enabled })
      }
    } catch {}
  }

  return NextResponse.json({
    connected:     !!profile?.stripe_connect_id,
    onboarded:     profile?.stripe_connect_onboarded ?? false,
    ordersEnabled: profile?.orders_enabled ?? false,
  })
}

// ─── POST — create account + onboarding link ─────────────────────────────────
export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_connect_id, stripe_connect_onboarded')
    .eq('id', user.id)
    .single()

  let connectId = profile?.stripe_connect_id

  // Create Connect account if doesn't exist yet
  if (!connectId) {
    const account = await createConnectAccount(user.email!, user.id)
    connectId = account.id
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_connect_id: connectId })
      .eq('id', user.id)
  }

  if (profile?.stripe_connect_onboarded) {
    return NextResponse.json({ alreadyOnboarded: true })
  }

  const link = await createConnectOnboardingLink({
    accountId:   connectId,
    refreshUrl:  `${appUrl}/dashboard?connect=refresh`,
    returnUrl:   `${appUrl}/dashboard?connect=success`,
  })

  return NextResponse.json({ url: link.url })
}

// ─── PUT — toggle orders enabled ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ordersEnabled } = await req.json()

  // Can only enable if onboarded
  if (ordersEnabled) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_connect_onboarded')
      .eq('id', user.id)
      .single()
    if (!profile?.stripe_connect_onboarded) {
      return NextResponse.json({ error: 'Complète d\'abord la configuration Stripe' }, { status: 403 })
    }
  }

  await supabaseAdmin
    .from('profiles')
    .update({ orders_enabled: ordersEnabled })
    .eq('id', user.id)

  return NextResponse.json({ ordersEnabled })
}
