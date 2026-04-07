import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendFormSubmissionEmail } from '@/lib/email'

export const runtime = 'nodejs'

type Params = { params: Promise<{ siteId: string }> }

// ─── CORS helpers ─────────────────────────────────────────────────────────────
// Reflect the request Origin (including 'null' from srcdoc iframes) so that
// both preview iframes and deployed sites on custom domains can POST.
function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '*'
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

// ─── POST /api/forms/[siteId] ─────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  const { siteId } = await params
  const cors = corsHeaders(req)

  try {
    const body = await req.json()

    // ── Honeypot — bots fill hidden fields, humans don't ──────────────────
    if (body._honeypot) {
      return NextResponse.json({ ok: true }, { headers: cors })
    }

    // ── Validate siteId ───────────────────────────────────────────────────
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('id, name, user_id')
      .eq('id', siteId)
      .single()

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404, headers: cors })
    }

    // ── Rate limit: max 20 submissions/hour per site ───────────────────────
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('contact_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .gte('created_at', since)

    if ((count ?? 0) >= 20) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: cors }
      )
    }

    // ── Extract fields — strip internal keys ──────────────────────────────
    const { form: formName = 'contact', _honeypot: _h, ...data } = body

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Empty submission' }, { status: 400, headers: cors })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

    // ── Store submission ──────────────────────────────────────────────────
    const { error: insertError } = await supabaseAdmin.from('contact_submissions').insert({
      site_id:   siteId,
      form_name: formName,
      data,
      ip,
    })

    if (insertError) {
      console.error('[forms] insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500, headers: cors }
      )
    }

    // ── Notify site owner ─────────────────────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', site.user_id)
      .single()

    if (profile?.email) {
      sendFormSubmissionEmail(profile.email, site.name, formName, data).catch(console.error)
    }

    return NextResponse.json({ ok: true }, { headers: cors })

  } catch (err) {
    console.error('[forms]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors })
  }
}

// ─── GET /api/forms/[siteId] — fetch submissions (authenticated) ──────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { siteId } = await params

  try {
    const { data: submissions, error } = await supabaseAdmin
      .from('contact_submissions')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return NextResponse.json({ submissions })
  } catch (err) {
    console.error('[forms/get]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── PATCH /api/forms/[siteId] — mark submissions as read ────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const { siteId } = await params

  try {
    const { ids } = await req.json()

    const query = supabaseAdmin
      .from('contact_submissions')
      .update({ read_at: new Date().toISOString() })
      .eq('site_id', siteId)
      .is('read_at', null)

    if (ids?.length) query.in('id', ids)

    await query
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forms/patch]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
