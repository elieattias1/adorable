/**
 * POST /api/shop/checkout
 * Creates an order + Stripe Checkout Session for pay-online flow.
 *   1. Validate items against DB
 *   2. Create order with status 'pending_payment'
 *   3. Create Stripe Checkout Session → return { checkoutUrl }
 *   4. On payment: webhook marks order 'pending' and notifies owner
 */
import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { supabaseAdmin }             from '@/lib/supabase'
import { stripe }                    from '@/lib/stripe'

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

    // ── Fetch site ─────────────────────────────────────────────────────────
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('id, user_id, name')
      .eq('id', site_id)
      .single()

    if (!site) return NextResponse.json({ error: 'Site introuvable' }, { status: 404 })

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

    // ── Compute total ──────────────────────────────────────────────────────
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

    // ── Create Stripe Checkout Session ─────────────────────────────────────
    const pickupLabel = pickup_at
      ? new Date(pickup_at).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'dès que possible'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email,
      line_items: lineItems.map(item => ({
        price_data: {
          currency:     'eur',
          product_data: {
            name: item.name,
            ...(item.photo_url ? { images: [item.photo_url] } : {}),
          },
          unit_amount: item.price_cents,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      metadata: {
        orderId:       order.id,
        siteId:        site_id,
        customerPhone: customer_phone ?? '',
        note:          note ?? '',
        pickupAt:      pickup_at ?? '',
        pickupLabel,
      },
      success_url: `${APP_URL}/order/success?orderId=${order.id}&siteId=${site_id}`,
      cancel_url:  `${APP_URL}/s/${site_id}`,
      payment_intent_data: {
        metadata: { orderId: order.id, siteId: site_id },
      },
    })

    return NextResponse.json({ checkoutUrl: session.url, orderId: order.id }, { status: 201 })

  } catch (err: any) {
    console.error('[shop/checkout]', err)
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 })
  }
}
