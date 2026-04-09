import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/site-config?siteId=X  — public, no auth required
// Used by deployed React sites to fetch live editable data (hours, etc.)
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('sites')
    .select('site_config')
    .eq('id', siteId)
    .single()

  if (error || !data) return NextResponse.json({ config: {} })

  return NextResponse.json(
    { config: data.site_config ?? {} },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  )
}
