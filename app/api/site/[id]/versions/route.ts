import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// GET — list versions for a site (newest first, max 20)
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
    .from('versions')
    .select('id, note, created_at')
    .eq('site_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ versions: data })
}
