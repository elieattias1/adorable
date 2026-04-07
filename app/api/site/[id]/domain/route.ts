import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { addCustomDomain } from '@/lib/deploy'

type Params = { params: Promise<{ id: string }> }

// POST /api/site/[id]/domain — add a custom domain
export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { domain } = await req.json()

  if (!domain || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain)) {
    return NextResponse.json({ error: 'Domaine invalide' }, { status: 400 })
  }

  // Verify ownership
  const { data: site } = await supabaseAdmin
    .from('sites').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    // The Vercel project name is deterministic from siteId
    const projectName = `sitebot-${id.slice(0, 8)}`
    await addCustomDomain(projectName, domain)
  } catch (err: any) {
    // Domain already added is not an error
    if (!err.message?.includes('already')) {
      console.error('[domain] addCustomDomain:', err.message)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // Save to DB
  await supabaseAdmin
    .from('sites')
    .update({ custom_domain: domain, domain_verified: false })
    .eq('id', id)

  return NextResponse.json({ success: true })
}

// DELETE /api/site/[id]/domain — remove custom domain
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: site } = await supabaseAdmin
    .from('sites').select('id, custom_domain').eq('id', id).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (site.custom_domain) {
    try {
      const projectName = `sitebot-${id.slice(0, 8)}`
      const VERCEL_API = 'https://api.vercel.com'
      const TEAM = process.env.VERCEL_TEAM_ID
      const teamQ = TEAM ? `?teamId=${TEAM}` : ''
      await fetch(`${VERCEL_API}/v9/projects/${projectName}/domains/${site.custom_domain}${teamQ}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` },
      })
    } catch {}
  }

  await supabaseAdmin
    .from('sites')
    .update({ custom_domain: null, domain_verified: false })
    .eq('id', id)

  return NextResponse.json({ success: true })
}

// GET /api/site/[id]/domain — check domain verification status
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: site } = await supabaseAdmin
    .from('sites').select('custom_domain, domain_verified').eq('id', id).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!site.custom_domain) return NextResponse.json({ domain: null })

  // Check with Vercel API
  const projectName = `sitebot-${id.slice(0, 8)}`
  const VERCEL_API = 'https://api.vercel.com'
  const TEAM = process.env.VERCEL_TEAM_ID
  const teamQ = TEAM ? `?teamId=${TEAM}` : ''

  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${projectName}/domains/${site.custom_domain}${teamQ}`,
      { headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` } }
    )
    const data = await res.json()
    const verified = data.verified === true

    if (verified && !site.domain_verified) {
      await supabaseAdmin.from('sites').update({ domain_verified: true }).eq('id', id)
    }

    return NextResponse.json({
      domain: site.custom_domain,
      verified,
      apexName: data.apexName,
      cname: data.cname,
    })
  } catch {
    return NextResponse.json({ domain: site.custom_domain, verified: false })
  }
}
