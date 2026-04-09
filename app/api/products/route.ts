/**
 * /api/products
 * GET  ?siteId=  — list products for a site (public, active only unless owner)
 * POST           — create product (authenticated, site owner)
 * PUT            — update product (authenticated, site owner)
 * DELETE ?id=    — delete product (authenticated, site owner)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'

const ProductSchema = z.object({
  site_id:     z.string().uuid(),
  name:        z.string().min(1).max(100),
  description: z.string().max(500).nullish().transform(v => v ?? undefined),
  price:       z.number().int().min(1).max(100000),  // cents
  category:    z.enum(['pain', 'viennoiserie', 'patisserie', 'entremet', 'snack', 'boisson', 'service', 'other']).default('other'),
  photo_url:   z.string().url().nullish().or(z.literal('')).transform(v => v ?? undefined),
  emoji:       z.string().max(4).nullish().transform(v => v ?? undefined),
  active:      z.boolean().default(true),
  sort_order:  z.number().int().default(0),
})

const UpdateSchema = ProductSchema.partial().extend({ id: z.string().uuid() })

// ─── GET /api/products?siteId= ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Check if caller is the owner (authenticated)
  const supabase  = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabaseAdmin
    .from('products')
    .select('*')
    .eq('site_id', siteId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  // Non-owners only see active products
  if (!user) query = query.eq('active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data ?? [] })
}

// ─── POST /api/products — create ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = ProductSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  // Verify site belongs to user
  const { data: site } = await supabaseAdmin.from('sites').select('id').eq('id', parsed.data.site_id).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}

// ─── PUT /api/products — update ───────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { id, ...rest } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product: data })
}

// ─── DELETE /api/products?id= ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
