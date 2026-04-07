import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Tables } from '@/types/supabase'

type Site = Tables<'sites'>

export function useSites() {
  const [sites,   setSites]   = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchSites = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sites')
    const data = await res.json()
    if (data.error) setError(data.error)
    else setSites(data.sites || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSites() }, [fetchSites])

  const createSite = async (name: string, type: string, description?: string) => {
    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, description }),
    })
    const data = await res.json()
    if (data.error) {
      if (data.code === 'PLAN_LIMIT') throw Object.assign(new Error(data.error), { code: 'PLAN_LIMIT' })
      throw new Error(data.error)
    }
    await fetchSites()
    return data.site as Site
  }

  const deleteSite = async (id: string) => {
    await fetch(`/api/sites?id=${id}`, { method: 'DELETE' })
    setSites(prev => prev.filter(s => s.id !== id))
  }

  return { sites, loading, error, createSite, deleteSite, refetch: fetchSites }
}

// ─── useProfile ───────────────────────────────────────────────────────────────
export function useProfile() {
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  const startCheckout = async (plan?: any) => {
    const planId = typeof plan === 'string' ? plan : 'pro'
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
    })
    const { url } = await res.json()
    if (url) window.open(url, '_blank')
  }

  const openPortal = async () => {
    const res = await fetch('/api/stripe/checkout', { method: 'PUT' })
    const { url } = await res.json()
    if (url) window.open(url, '_blank')
  }

  return { profile, startCheckout, openPortal }
}
