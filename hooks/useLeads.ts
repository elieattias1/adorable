import { useState, useEffect, useCallback } from 'react'

export interface Lead {
  id:               string
  user_id:          string
  business_name:    string
  website_url:      string | null
  email:            string | null
  phone:            string | null
  address:          string | null
  category:         string | null
  city:             string | null
  status:           'new' | 'contacted' | 'building' | 'built' | 'closed'
  notes:            string | null
  site_id:          string | null
  cms:              string | null
  page_title:       string | null
  meta_description: string | null
  og_image:         string | null
  source:           string | null
  // Extended Google Maps export columns
  arrondissement:   string | null
  postcode:         string | null
  departement:      string | null
  rating:           number | null
  reviews:          number | null
  opening_hours:    string | null
  instagram:        string | null
  facebook:         string | null
  latitude:         number | null
  longitude:        number | null
  google_maps_url:  string | null
  has_website:      boolean | null
  outreach_status:  string | null
  created_at:       string
  updated_at:       string
  // joined
  sites?: { id: string; name: string; deployed_url: string | null; is_published: boolean } | null
}

export function useLeads() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchLeads = useCallback(async (status?: string) => {
    setLoading(true)
    const url = status && status !== 'all' ? `/api/leads?status=${status}` : '/api/leads'
    const res  = await fetch(url)
    const data = await res.json()
    if (data.error) setError(data.error)
    else setLeads(data.leads || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const createLead = async (lead: Partial<Lead> & { business_name: string }) => {
    const res  = await fetch('/api/leads', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(lead),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    setLeads(prev => [data.lead, ...prev])
    return data.lead as Lead
  }

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const res  = await fetch(`/api/leads/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data.lead } : l))
    return data.lead as Lead
  }

  const deleteLead = async (id: string) => {
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  const bulkCreateLeads = async (leads: Partial<Lead>[]) => {
    const results = await Promise.allSettled(
      leads.map(l => createLead(l as Lead & { business_name: string }))
    )
    const created = results.filter(r => r.status === 'fulfilled').length
    await fetchLeads()
    return created
  }

  return { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead, bulkCreateLeads }
}
