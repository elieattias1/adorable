/**
 * POST /api/shop/checkout
 * Pay-at-pickup order flow:
 *   1. Validate items against DB
 *   2. Create order + order_items records
 *   3. Notify bakery owner by email (Resend) AND SMS (Twilio) — best-effort
 *   4. Return { orderId } — no redirect, customer pays in-store at pickup
 */
import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { supabaseAdmin }             from '@/lib/supabase'
import { sendOrderNotification }     from '@/lib/notifications'

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

    // ── Fetch owner notification contacts ─────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, notification_email, notification_phone')
      .eq('id', site.user_id)
      .single()

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
        status:         'pending',
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

    // ── Notify owner (best-effort — does not fail the order) ───────────────
    const ownerEmail = profile?.notification_email ?? profile?.email
    const ownerPhone = profile?.notification_phone ?? null

    sendOrderNotification({
      orderId:       order.id,
      siteName:      site.name,
      customerName:  customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      items:         lineItems,
      totalCents,
      note,
      pickupAt:      pickup_at,
      ownerEmail,
      ownerPhone,
    }).catch(err => console.error('[checkout] notification error:', err))

    return NextResponse.json({ orderId: order.id, success: true }, { status: 201 })

  } catch (err: any) {
    console.error('[shop/checkout]', err)
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 })
  }
}
