import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Block iframe navigation ──────────────────────────────────────────────────
  if (request.headers.get('Sec-Fetch-Dest') === 'iframe' && !pathname.startsWith('/s/')) {
    return new NextResponse(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0"></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  // ── Site-wide password protection ────────────────────────────────────────────
  const SITE_PASSWORD = process.env.SITE_PASSWORD
  const isUnlockRoute = pathname.startsWith('/unlock') || pathname.startsWith('/api/unlock')
  const isPublicSite  = pathname.startsWith('/s/')

  if (SITE_PASSWORD && !isUnlockRoute && !isPublicSite) {
    const cookie = request.cookies.get('site_unlocked')
    if (cookie?.value !== SITE_PASSWORD) {
      const url = request.nextUrl.clone()
      url.pathname = '/unlock'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()         { return request.cookies.getAll() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookies: any[]) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookies.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  const protectedRoutes = ['/dashboard', '/editor']
  if (protectedRoutes.some(r => pathname.startsWith(r)) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login page (but NOT from the landing page)
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|\\.well-known).*)'],
}
