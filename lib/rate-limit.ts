import { supabaseAdmin } from '@/lib/supabase'
import { isAdminUser } from '@/lib/admin'
import { PLANS } from '@/lib/stripe'

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  limit: number
}> {
  if (isAdminUser(userId)) return { allowed: true, remaining: Infinity, limit: Infinity }

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('plan').eq('id', userId).single()

  const plan = (profile?.plan ?? 'free') as keyof typeof PLANS
  const limits = PLANS[plan] ?? PLANS.free
  const dailyLimit = limits.maxDailyGenerations

  if (dailyLimit === Infinity) return { allowed: true, remaining: Infinity, limit: Infinity }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', since)

  const used      = count ?? 0
  const remaining = Math.max(0, dailyLimit - used)
  const allowed   = used < dailyLimit

  return { allowed, remaining, limit: dailyLimit }
}
