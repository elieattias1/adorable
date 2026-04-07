import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string; versionId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, versionId } = await params

  // Verify ownership
  const { data: site } = await supabaseAdmin
    .from('sites').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch the version's html
  const { data: version } = await supabaseAdmin
    .from('versions').select('html').eq('id', versionId).eq('site_id', id).single()
  if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

  // Save current as a new version before restoring
  const { data: currentSite } = await supabaseAdmin
    .from('sites').select('html').eq('id', id).single()
  if (currentSite?.html) {
    await supabaseAdmin.from('versions').insert({
      site_id: id, user_id: user.id, html: currentSite.html, note: 'Sauvegarde avant restauration',
    })
  }

  // Restore
  const { error } = await supabaseAdmin
    .from('sites').update({ html: version.html, updated_at: new Date().toISOString() }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
