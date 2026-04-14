/**
 * POST /api/shop/checkout
 * Creates an order + Stripe Checkout Session routed to the bakery owner's
 * Stripe Connect account (money goes to the owner, not the platform).
 *   1. Validate items
 *   2. Check owner has completed Stripe Connect onboarding
 *   3. Create order with status 'pending_payment'
 *   4. Create Stripe Checkout Session with destination charge → owner gets paid
 *   5. Return { checkoutUrl } — customer is redirected to Stripe
 *   6. On payment: webhook marks order 'pending' and notifies owner
 */
import { NextRequest, NextResponse }     from 'next/server'
import { z }                             from 'zod'
import { supabaseAdmin }                 from '@/lib/supabase'
import { createShopCheckoutSession }     from '@/lib/stripe'

const ItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity:   z.number().int().min(1).max(99),
})

const CheckoutSchema = z.object({
  site_id:        z.string().uuid(),
  customer_name:  z.string().min(1).max(100),
  customer_email: z.string().email(),
  customer_phone: z.string().max(30).optional(),
  items:          z.array(ItemSchema).min(1).max(50),
  note:           z.string().max(500).optional(),
  pickup_at:      z.string().optional(),
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = CheckoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { site_id, customer_name, customer_email, customer_phone, items, note, pickup_at } = parsed.data

    // ── Fetch site + owner profile ─────────────────────────────────────────
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('id, user_id, name')
      .eq('id', site_id)
      .single()

    if (!site) return NextResponse.json({ error: 'Site introuvable' }, { status: 404 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, notification_email, notification_phone, stripe_connect_id, stripe_connect_onboarded')
      .eq('id', site.user_id)
      .single()

    if (!profile?.stripe_connect_id || !profile.stripe_connect_onboarded) {
      return NextResponse.json(
        { error: 'La boutique n\'accepte pas encore les paiements en ligne. Contactez le propriétaire.' },
        { status: 400 }
      )
    }

    // ── Validate products ──────────────────────────────────────────────────
    const productIds = items.map(i => i.product_id)
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, price, photo_url, active')
      .eq('site_id', site_id)
      .in('id', productIds)

    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ error: 'Un ou plusieurs produits introuvables' }, { status: 400 })
    }

    const inactiveProduct = products.find(p => !p.active)
    if (inactiveProduct) {
      return NextResponse.json({ error: `"${inactiveProduct.name}" n'est plus disponible` }, { status: 400 })
    }

    // ── Compute line items ─────────────────────────────────────────────────
    const lineItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id)!
      return {
        product_id:  item.product_id,
        name:        product.name,
        price_cents: product.price,
        quantity:    item.quantity,
        photo_url:   product.photo_url ?? null,
      }
    })
    const totalCents = lineItems.reduce((sum, i) => sum + i.price_cents * i.quantity, 0)

    // ── Create order ───────────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        site_id,
        user_id:        site.user_id,
        customer_name,
        customer_email,
        customer_phone: customer_phone ?? null,
        status:         'pending_payment',
        total_cents:    totalCents,
        note:           note ?? null,
        pickup_at:      pickup_at ?? null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('[checkout] order insert error:', orderError)
      return NextResponse.json({ error: 'Erreur création commande' }, { status: 500 })
    }

    // ── Insert order items ─────────────────────────────────────────────────
    await supabaseAdmin.from('order_items').insert(
      lineItems.map(i => ({ ...i, order_id: order.id }))
    )

    // ── Create Stripe Checkout Session → money goes to owner ───────────────
    // Platform takes 2% fee (adjustable). Owner receives 98% directly.
    const session = await createShopCheckoutSession({
      connectedAccountId: profile.stripe_connect_id,
      lineItems: lineItems.map(i => ({
        name:     i.name,
        amount:   i.price_cents,
        quantity: i.quantity,
        ...(i.photo_url ? { images: [i.photo_url] } : {}),
      })),
      orderId:     order.id,
      siteId:      site_id,
      successUrl:  `${APP_URL}/order/success?orderId=${order.id}&siteId=${site_id}`,
      cancelUrl:   `${APP_URL}/s/${site_id}`,
      platformFeePercent: 2,
    })

    return NextResponse.json({ checkoutUrl: session.url, orderId: order.id }, { status: 201 })

  } catch (err: any) {
    console.error('[shop/checkout]', err)
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 })
  }
}
