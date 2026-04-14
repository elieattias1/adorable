import { NextRequest, NextResponse } from 'next/server'

// Twemoji PNG URLs — served via jsDelivr CDN (GitHub source, reliable)
const FAVICONS: Record<string, string> = {
  bakery:     'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f950.png', // 🥐
  restaurant: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f37d.png', // 🍽️
  cafe:       'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2615.png',  // ☕
  default:    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26a1.png',  // ⚡
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'default'
  const url  = FAVICONS[type] ?? FAVICONS.default

  const upstream = await fetch(url)
  if (!upstream.ok) return new NextResponse(null, { status: 404 })

  const buffer = await upstream.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
