/**
 * GET /api/order-status?orderId=
 * Public endpoint — returns order status so the success page can poll until paid.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, customer_name, customer_email, total_cents, pickup_at, note, status')
    .eq('id', orderId)
    .single()

  if (error || !data) return NextResponse.json({ order: null })

  // Only expose non-sensitive fields
  return NextResponse.json({ order: data })
}
