import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard'
  const type  = searchParams.get('type')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Password reset — redirect to the update-password page
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/reset-password', req.url))
  }

  return NextResponse.redirect(new URL(next, req.url))
}
