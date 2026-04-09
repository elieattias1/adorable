import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'

// GET /api/leads — list all leads for current user
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status')

  // Supabase caps results at 1000 per request — paginate to get all rows
  const PAGE = 1000
  let all: unknown[] = []
  let from = 0

  while (true) {
    let query = supabaseAdmin
      .from('leads')
      .select('*, sites(id, name, deployed_url, is_published)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(from, from + PAGE - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }

  return NextResponse.json({ leads: all })
}

// POST /api/leads — create a single lead
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    business_name, website_url, email, phone, address, category, city,
    status, notes, cms, page_title, meta_description, og_image, source,
    // Extended Google Maps fields
    arrondissement, postcode, departement, rating, reviews,
    opening_hours, instagram, facebook, latitude, longitude,
    google_maps_url, has_website, outreach_status,
  } = body

  if (!business_name?.trim()) {
    return NextResponse.json({ error: 'business_name is required' }, { status: 400 })
  }

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .insert({
      user_id: user.id,
      business_name: business_name.trim(),
      website_url:   website_url?.trim()    || null,
      email:         email?.trim()          || null,
      phone:         phone?.trim()          || null,
      address:       address?.trim()        || null,
      category:      category?.trim()       || null,
      city:          city?.trim()           || null,
      status:        status                 || 'new',
      notes:         notes?.trim()          || null,
      cms:           cms                    || null,
      page_title:    page_title             || null,
      meta_description: meta_description   || null,
      og_image:      og_image               || null,
      source:        source                 || 'manual',
      // Extended fields
      arrondissement: arrondissement?.toString().trim() || null,
      postcode:       postcode?.toString().trim()       || null,
      departement:    departement?.toString().trim()    || null,
      rating:         rating        != null ? Number(rating)   : null,
      reviews:        reviews       != null ? Number(reviews)  : null,
      opening_hours:  opening_hours?.trim()             || null,
      instagram:      instagram?.trim()                 || null,
      facebook:       facebook?.trim()                  || null,
      latitude:       latitude      != null ? Number(latitude)  : null,
      longitude:      longitude     != null ? Number(longitude) : null,
      google_maps_url: google_maps_url?.trim()          || null,
      has_website:    has_website   != null ? Boolean(has_website) : null,
      outreach_status: outreach_status?.trim()          || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead }, { status: 201 })
}

// POST /api/leads/bulk — handled in /api/leads/bulk/route.ts
