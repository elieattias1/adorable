/**
 * /api/orders
 * GET  ?siteId= — list orders for a site (authenticated, owner only)
 * PUT  { id, status } — update order status (authenticated, owner only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'

// ─── GET /api/orders?siteId= ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = req.nextUrl.searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`*, order_items(*)`)
    .eq('site_id', siteId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data ?? [] })
}

// ─── PUT /api/orders — update status ─────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  const VALID = ['pending','paid','preparing','ready','delivered','cancelled']
  if (!id || !VALID.includes(status)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ order: data })
}
