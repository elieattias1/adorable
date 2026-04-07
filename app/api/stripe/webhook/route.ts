import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { constructWebhookEvent, planFromSubscription } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

// Must export config to disable body parsing (Stripe needs the raw body)
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(Buffer.from(body), signature)
  } catch (err) {
    console.error('[webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Subscription created or updated ─────────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub      = event.data.object as Stripe.Subscription
        const plan     = planFromSubscription(sub)
        const custId   = sub.customer as string

        await supabaseAdmin
          .from('profiles')
          .update({
            plan,
            stripe_subscription_id: sub.id,
            subscription_status:    sub.status,
            subscription_ends_at:   sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_customer_id', custId)

        console.log(`[webhook] Subscription ${event.type}: customer=${custId}, plan=${plan}`)
        break
      }

      // ── Subscription canceled ────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const custId = sub.customer as string

        await supabaseAdmin
          .from('profiles')
          .update({
            plan:                   'free',
            stripe_subscription_id: null,
            subscription_status:    'canceled',
            subscription_ends_at:   null,
          })
          .eq('stripe_customer_id', custId)

        console.log(`[webhook] Subscription canceled: customer=${custId}`)
        break
      }

      // ── Payment failed ───────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const custId  = invoice.customer as string

        await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', custId)

        // TODO: send payment failure email via Resend
        console.log(`[webhook] Payment failed: customer=${custId}`)
        break
      }

      // ── Checkout completed ───────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[webhook] Checkout completed: customer=${session.customer}`)
        // Subscription events above will handle the plan update
        break
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error(`[webhook] Handler error for ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
