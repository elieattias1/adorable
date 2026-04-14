import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

// GET /api/site/[id] — fetch site data + stats
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [siteRes, versionsRes, submissionsRes, ordersRes] = await Promise.all([
    supabaseAdmin.from('sites')
      .select('*')
      .eq('id', id).eq('user_id', user.id).single(),
    supabaseAdmin.from('versions')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id),
    supabaseAdmin.from('contact_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id),
    supabaseAdmin.from('orders')
      .select('total_cents, customer_email, status')
      .eq('site_id', id)
      .not('status', 'in', '(cancelled,pending_payment)'),
  ])

  if (!siteRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const orders = ordersRes.data ?? []
  const uniqueEmails = new Set(orders.map((o: any) => o.customer_email?.toLowerCase()).filter(Boolean))

  return NextResponse.json({
    site:             siteRes.data,
    versionCount:     versionsRes.count ?? 0,
    submissionCount:  submissionsRes.count ?? 0,
    orderCount:       orders.length,
    customerCount:    uniqueEmails.size,
    ordersTotalCents: orders.reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0),
  })
}

// PATCH /api/site/[id] — update site settings
const PatchSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  seoTitle:     z.string().max(200).optional(),
  seoDesc:      z.string().max(500).optional(),
  favicon:      z.string().max(500).optional(),
  integrations: z.record(z.record(z.string())).optional(),
  is_published: z.boolean().optional(),
  deployed_url: z.string().nullable().optional(),
  site_config:  z.record(z.unknown()).optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Verify ownership
  const { data: site } = await supabaseAdmin
    .from('sites').select('id, html').eq('id', id).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patch = PatchSchema.parse(body)
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (patch.name         !== undefined) updates.name         = patch.name
  if (patch.is_published !== undefined) updates.is_published = patch.is_published
  if (patch.deployed_url !== undefined) updates.deployed_url = patch.deployed_url
  if (patch.site_config  !== undefined) updates.site_config  = patch.site_config
  if (patch.favicon      !== undefined) updates.favicon_url  = patch.favicon

  const { data, error } = await supabaseAdmin
    .from('sites').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ site: data })
}

// DELETE /api/site/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabaseAdmin
    .from('sites').delete().eq('id', id).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
