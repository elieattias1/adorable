import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) return NextResponse.json({ results: [] })

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  )

  if (!res.ok) return NextResponse.json({ results: [] }, { status: res.status })

  const data = await res.json()
  const results = (data.results ?? []).map((p: any) => ({
    id:    p.id,
    url:   `${p.urls.raw}&w=1200&q=80&fit=crop`,
    thumb: `${p.urls.raw}&w=400&q=70&fit=crop`,
    alt:   p.alt_description ?? p.description ?? query,
    user:  p.user?.name ?? '',
  }))

  return NextResponse.json({ results })
}
