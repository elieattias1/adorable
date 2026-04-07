import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, supabaseAdmin, canCreateSite } from '@/lib/supabase'
import { generateInitialSite } from '@/lib/anthropic'

const CreateSiteSchema = z.object({
  name:        z.string().min(1).max(80),
  type:        z.enum(['business','portfolio','restaurant','shop','blog','saas','landing','bakery','wellness','blank']),
  description: z.string().max(500).optional(),
})

// GET /api/sites — list all sites for current user
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sites, error } = await supabaseAdmin
    .from('sites')
    .select('id, name, type, html, deployed_url, is_published, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach unread submission counts
  const { data: unread } = await supabaseAdmin
    .from('contact_submissions')
    .select('site_id')
    .in('site_id', (sites ?? []).map(s => s.id))
    .is('read_at', null)

  const unreadBySite = (unread ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.site_id] = (acc[row.site_id] ?? 0) + 1
    return acc
  }, {})

  const sitesWithCounts = (sites ?? []).map(s => ({
    ...s,
    unread_submissions: unreadBySite[s.id] ?? 0,
  }))

  return NextResponse.json({ sites: sitesWithCounts })
}

// POST /api/sites — create a new site
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check plan limits
  const allowed = await canCreateSite(user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Plan limit reached. Upgrade to Pro to create unlimited sites.', code: 'PLAN_LIMIT' },
      { status: 403 }
    )
  }

  const body  = await req.json()
  const input = CreateSiteSchema.parse(body)

  // Create site record
  const { data: site, error: createError } = await supabaseAdmin
    .from('sites')
    .insert({ user_id: user.id, name: input.name, type: input.type })
    .select()
    .single()

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  // Generate initial HTML asynchronously (non-blocking for fast response)
  // In production: use a background job (Vercel cron, Supabase edge function, etc.)
  generateInitialSite({ name: input.name, type: input.type, description: input.description, siteId: site.id })
    .then(async html => {
      await Promise.all([
        supabaseAdmin.from('sites').update({ html }).eq('id', site.id),
        supabaseAdmin.from('versions').insert({
          site_id: site.id, user_id: user.id, html, note: 'Version initiale',
        }),
      ])
    })
    .catch(err => console.error('[sites] Initial generation failed:', err))

  return NextResponse.json({ site }, { status: 201 })
}

// DELETE /api/sites?id=uuid
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('sites')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)   // RLS double-check

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
