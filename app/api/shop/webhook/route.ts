/**
 * POST /api/shop/webhook
 * Stripe webhook for shop order payments.
 * Marks order as paid when checkout.session.completed fires.
 */
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_SHOP_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[shop/webhook] signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const orderId  = session.metadata?.orderId
    const intentId = session.payment_intent

    if (orderId) {
      await supabaseAdmin
        .from('orders')
        .update({
          status:                 'paid',
          stripe_payment_intent:  intentId,
          updated_at:             new Date().toISOString(),
        })
        .eq('id', orderId)

      console.log(`[shop/webhook] order ${orderId} marked as paid`)
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as any
    const orderId  = session.metadata?.orderId
    if (orderId) {
      // Only cancel if still pending (not already paid)
      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending')
    }
  }

  return NextResponse.json({ received: true })
}
