import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { isAdminUser } from '@/lib/admin'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminUser(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { plan, targetUserId } = await req.json()
  if (!['free', 'starter', 'pro', 'enterprise'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const userId = targetUserId ?? user.id
  const { data, error, count } = await supabaseAdmin
    .from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, plan')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If 0 rows updated the profile row may not exist yet — upsert it
  if (!data || data.length === 0) {
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, plan, updated_at: new Date().toISOString() })
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  console.log(`[admin/plan] updated user ${userId} → ${plan} (rows: ${data?.length ?? 0})`)
  return NextResponse.json({ success: true, plan })
}
