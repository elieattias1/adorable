import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// GET /api/site/[id]/submissions
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify ownership
  const { data: site } = await supabaseAdmin
    .from('sites').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('contact_submissions')
    .select('*')
    .eq('site_id', id)
    .order('created_at', { ascending: false })
    .limit(200)

  // Table may not exist yet if migration hasn't been run
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ submissions: [], _migrationNeeded: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ submissions: data })
}

// PATCH /api/site/[id]/submissions — mark as read
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { submissionId, read } = await req.json()

  // Verify ownership via site
  const { data: site } = await supabaseAdmin
    .from('sites').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('contact_submissions')
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq('id', submissionId)
    .eq('site_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
