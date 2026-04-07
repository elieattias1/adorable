import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { isAdminUser } from '@/lib/admin'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminUser(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { plan } = await req.json()
  if (!['free', 'pro', 'enterprise'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  await supabaseAdmin.from('profiles').update({ plan }).eq('id', user.id)
  return NextResponse.json({ success: true, plan })
}
