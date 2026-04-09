/**
 * POST /api/shop/checkout
 * Creates a Stripe Checkout session for a bakery shop order.
 * Called from the generated site's ShopSection (no auth required — customers).
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe, createShopCheckoutSession } from '@/lib/stripe'

const ItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity:   z.number().int().min(1).max(99),
})

const CheckoutSchema = z.object({
  site_id:        z.string().uuid(),
  customer_name:  z.string().min(1).max(100),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  items:          z.array(ItemSchema).min(1).max(50),
  note:           z.string().max(500).optional(),
  pickup_at:      z.string().optional(),
})

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
      .from('sites').select('id, user_id, name').eq('id', site_id).single()
    if (!site) return NextResponse.json({ error: 'Site introuvable' }, { status: 404 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_connect_id, stripe_connect_onboarded, orders_enabled')
      .eq('id', site.user_id)
      .single()

    if (!profile?.orders_enabled) {
      return NextResponse.json({ error: 'Les commandes ne sont pas activées pour ce site' }, { status: 403 })
    }
    if (!profile?.stripe_connect_id || !profile?.stripe_connect_onboarded) {
      return NextResponse.json({ error: 'Paiement non configuré par le commerçant' }, { status: 503 })
    }

    // ── Fetch products and validate ────────────────────────────────────────
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

    // ── Compute total ──────────────────────────────────────────────────────
    const lineItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id)!
      return {
        name:     product.name,
        amount:   product.price,
        quantity: item.quantity,
        images:   product.photo_url ? [product.photo_url] : undefined,
      }
    })
    const totalCents = lineItems.reduce((sum, i) => sum + i.amount * i.quantity, 0)

    // ── Create order record (pending) ──────────────────────────────────────
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        site_id,
        user_id:        site.user_id,
        customer_name,
        customer_email,
        customer_phone,
        status:         'pending',
        total_cents:    totalCents,
        note,
        pickup_at:      pickup_at ?? null,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Erreur création commande' }, { status: 500 })
    }

    // ── Insert order items ─────────────────────────────────────────────────
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id)!
      return {
        order_id:    order.id,
        product_id:  item.product_id,
        name:        product.name,
        price_cents: product.price,
        quantity:    item.quantity,
        photo_url:   product.photo_url,
      }
    })
    await supabaseAdmin.from('order_items').insert(orderItems)

    // ── Create Stripe Checkout Session ─────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'
    const session = await createShopCheckoutSession({
      connectedAccountId: profile.stripe_connect_id,
      lineItems,
      orderId:     order.id,
      siteId:      site_id,
      successUrl:  `${appUrl}/shop/success?order=${order.id}`,
      cancelUrl:   `${appUrl}/shop/cancel?order=${order.id}`,
    })

    // ── Save session ID to order ───────────────────────────────────────────
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (err: any) {
    console.error('[shop/checkout]', err)
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 })
  }
}
