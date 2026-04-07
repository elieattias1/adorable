import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

// ─── Browser client (use in Client Components) ────────────────────────────────
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ─── Server client (use in Server Components & API routes) ───────────────────
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()                     { return cookieStore.getAll() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[])  {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* Server Component — ignore */ }
        },
      },
    }
  )
}

// ─── Admin client (service role — server only, bypasses RLS) ─────────────────
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin = createSupabaseClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get the current user's profile (server-side) */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

/** Check if user can create more sites */
export async function canCreateSite(userId: string): Promise<boolean> {
  const { isAdminUser } = await import('@/lib/admin')
  if (isAdminUser(userId)) return true

  const { PLANS } = await import('@/lib/stripe')
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('plan').eq('id', userId).single()

  const plan = (profile?.plan ?? 'free') as keyof typeof PLANS
  const limits = PLANS[plan] ?? PLANS.free

  if (limits.maxSites === Infinity) return true

  const { count } = await supabaseAdmin
    .from('sites').select('id', { count: 'exact', head: true }).eq('user_id', userId)

  return (count ?? 0) < limits.maxSites
}

/** Save a new version snapshot */
export async function saveVersion(siteId: string, userId: string, html: string, note: string) {
  const { data, error } = await supabaseAdmin
    .from('versions')
    .insert({ site_id: siteId, user_id: userId, html, note })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Get recent versions for a site (latest first) */
export async function getSiteVersions(siteId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('versions')
    .select('id, note, created_at')   // don't fetch html to save bandwidth
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/** Get messages for a site (oldest first for LLM context) */
export async function getSiteMessages(siteId: string, limit = 40) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('site_id', siteId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}
