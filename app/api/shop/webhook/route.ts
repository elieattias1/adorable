/**
 * POST /api/shop/webhook
 * Stripe webhook for shop order payments.
 * On checkout.session.completed: mark order 'pending' + notify owner.
 * On checkout.session.expired: cancel order.
 */
import { NextRequest, NextResponse }    from 'next/server'
import { stripe }                       from '@/lib/stripe'
import { supabaseAdmin }                from '@/lib/supabase'
import { sendOrderNotification }        from '@/lib/notifications'

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
    const session   = event.data.object as any
    const orderId   = session.metadata?.orderId
    const intentId  = session.payment_intent

    if (!orderId) return NextResponse.json({ received: true })

    // ── Mark order as pending (ready for bakery to prepare) ───────────────
    await supabaseAdmin
      .from('orders')
      .update({
        status:                'pending',
        stripe_payment_intent: intentId,
        updated_at:            new Date().toISOString(),
      })
      .eq('id', orderId)

    console.log(`[shop/webhook] order ${orderId} paid → pending`)

    // ── Fetch order + items for notification ───────────────────────────────
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (order) {
      const { data: site }    = await supabaseAdmin.from('sites').select('name, user_id').eq('id', order.site_id).single()
      const { data: profile } = await supabaseAdmin.from('profiles').select('email, notification_email, notification_phone').eq('id', site?.user_id ?? '').single()

      sendOrderNotification({
        orderId:       order.id,
        siteName:      site?.name ?? '',
        customerName:  order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        items:         (order.order_items ?? []).map((i: any) => ({
          name:        i.name,
          quantity:    i.quantity,
          price_cents: i.price_cents,
        })),
        totalCents:    order.total_cents,
        note:          order.note,
        pickupAt:      order.pickup_at,
        ownerEmail:    profile?.notification_email ?? profile?.email,
        ownerPhone:    profile?.notification_phone ?? null,
      }).catch(err => console.error('[shop/webhook] notification error:', err))
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as any
    const orderId  = session.metadata?.orderId
    if (orderId) {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending_payment')
    }
  }

  return NextResponse.json({ received: true })
}
