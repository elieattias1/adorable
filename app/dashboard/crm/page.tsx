'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useLeads, type Lead } from '@/hooks/useLeads'
import {
  ArrowLeft, Plus, Upload, Globe, ExternalLink, Trash2, Edit2, X,
  Search, ChevronDown, Loader2, Zap, CheckCircle2, Link2, RefreshCw,
  Phone, Mail, Building2, LayoutTemplate,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:        { label: 'Nouveau',    color: 'bg-blue-500/20 text-blue-300  border-blue-500/30'   },
  contacted:  { label: 'Contacté',   color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  building:   { label: 'En cours',   color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  built:      { label: 'Livré',      color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  closed:     { label: 'Fermé',      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30'   },
} as const

const CMS_COLOR: Record<string, string> = {
  WordPress:  'text-sky-400',
  Wix:        'text-blue-400',
  Squarespace:'text-gray-300',
  Webflow:    'text-indigo-400',
  Shopify:    'text-green-400',
  Jimdo:      'text-orange-400',
  Custom:     'text-gray-500',
  PrestaShop: 'text-rose-400',
}

// ─── Parse CSV helper ─────────────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase())
  return lines.slice(1).map(line => {
    const vals: string[] = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ }
      else if (line[i] === ',' && !inQ) { vals.push(cur); cur = '' }
      else { cur += line[i] }
    }
    vals.push(cur)
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]))
  }).filter(r => Object.values(r).some(v => v))
}

// ─── CSV column mapping ───────────────────────────────────────────────────────
function mapCsvRow(row: Record<string, string>): Partial<Lead> {
  const g = (...keys: string[]) => keys.map(k => row[k]).find(v => v) || undefined
  return {
    business_name: g('name','business_name','nom','business','company') || 'Unknown',
    website_url:   g('website','website_url','url','site','web') || undefined,
    email:         g('email','email_address','courriel') || undefined,
    phone:         g('phone','telephone','téléphone','tel','phone_number') || undefined,
    address:       g('address','adresse') || undefined,
    city:          g('city','ville') || undefined,
    category:      g('category','catégorie','type') || undefined,
    cms:           g('cms') || undefined,
    source:        'csv_import',
  }
}

// ─── Add / Edit lead modal ────────────────────────────────────────────────────
function LeadModal({
  lead, sites, onSave, onClose,
}: {
  lead?: Lead | null
  sites: { id: string; name: string }[]
  onSave: (data: Partial<Lead>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Lead>>(lead ?? { status: 'new' })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Lead, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="font-bold text-base">{lead ? 'Modifier le lead' : 'Ajouter un lead'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Nom du business *</label>
              <input
                required value={form.business_name ?? ''}
                onChange={e => set('business_name', e.target.value)}
                placeholder="Boulangerie Dupont"
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Site web</label>
              <input
                type="url" value={form.website_url ?? ''}
                onChange={e => set('website_url', e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input
                type="email" value={form.email ?? ''}
                onChange={e => set('email', e.target.value)}
                placeholder="contact@example.com"
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Téléphone</label>
              <input
                value={form.phone ?? ''}
                onChange={e => set('phone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Catégorie</label>
              <input
                value={form.category ?? ''}
                onChange={e => set('category', e.target.value)}
                placeholder="Boulangerie"
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ville</label>
              <input
                value={form.city ?? ''}
                onChange={e => set('city', e.target.value)}
                placeholder="Paris"
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Adresse</label>
              <input
                value={form.address ?? ''}
                onChange={e => set('address', e.target.value)}
                placeholder="12 rue de la Paix, 75001 Paris"
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Statut</label>
              <select
                value={form.status ?? 'new'}
                onChange={e => set('status', e.target.value)}
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              >
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Site lié</label>
              <select
                value={form.site_id ?? ''}
                onChange={e => set('site_id', e.target.value)}
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
              >
                <option value="">— aucun —</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <textarea
                value={form.notes ?? ''}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Notes internes…"
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-sm transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm transition-all disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {lead ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Bulk import modal ────────────────────────────────────────────────────────
function BulkImportModal({
  sites, onImport, onClose,
}: {
  sites: { id: string; name: string }[]
  onImport: (leads: Partial<Lead>[]) => Promise<void>
  onClose: () => void
}) {
  const [tab,        setTab]        = useState<'csv' | 'urls'>('csv')
  const [csvText,    setCsvText]    = useState('')
  const [urlsText,   setUrlsText]   = useState('')
  const [preview,    setPreview]    = useState<Partial<Lead>[]>([])
  const [scraping,   setScraping]   = useState(false)
  const [scrapeProgress, setScrapeProgress] = useState('')
  const [importing,  setImporting]  = useState(false)

  const parseCsvPreview = () => {
    const rows = parseCSV(csvText)
    setPreview(rows.map(mapCsvRow))
  }

  const scrapeUrls = async () => {
    const urls = urlsText.split('\n').map(l => l.trim()).filter(l => l.startsWith('http') || l.includes('.'))
    if (!urls.length) return
    setScraping(true)
    setScrapeProgress(`Scraping ${urls.length} URL(s)…`)
    try {
      const res  = await fetch('/api/leads/scrape', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ urls }),
      })
      const data = await res.json()
      const leads: Partial<Lead>[] = (data.results ?? []).map((r: {
        url: string; business_name?: string; page_title?: string
        meta_description?: string; email?: string; phone?: string
        cms?: string; og_image?: string; error?: string
      }) => ({
        business_name:    r.business_name || r.url,
        website_url:      r.url,
        email:            r.email   || undefined,
        phone:            r.phone   || undefined,
        cms:              r.cms     || undefined,
        page_title:       r.page_title || undefined,
        meta_description: r.meta_description || undefined,
        og_image:         r.og_image || undefined,
        source:           'url_scrape',
        status:           'new' as const,
      }))
      setPreview(leads)
      setScrapeProgress(`${leads.length} leads trouvés`)
    } catch {
      setScrapeProgress('Erreur lors du scraping')
    } finally {
      setScraping(false)
    }
  }

  const handleImport = async () => {
    if (!preview.length) return
    setImporting(true)
    try { await onImport(preview) } finally { setImporting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <h2 className="font-bold text-base">Importer des leads</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 flex-shrink-0">
          {(['csv', 'urls'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setPreview([]) }}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t ? 'border-violet-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t === 'csv' ? '📊 CSV / Coller' : '🔗 Scraper des URLs'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === 'csv' && (
            <>
              <p className="text-xs text-gray-500">
                Colle un CSV avec les colonnes : <code className="text-violet-400">name, website, email, phone, city, category</code>.
                Compatible avec les exports Google Maps, PagesJaunes, etc.
              </p>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={8}
                placeholder={'name,website,email,phone,city\nBoulangerie Dupont,https://dupont.fr,contact@dupont.fr,0612345678,Paris'}
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500/60 resize-none"
              />
              <button onClick={parseCsvPreview}
                className="px-4 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-600/30 transition-colors">
                Prévisualiser ({parseCSV(csvText).length} lignes)
              </button>
            </>
          )}

          {tab === 'urls' && (
            <>
              <p className="text-xs text-gray-500">
                Colle une URL par ligne. Le scraper va extraire automatiquement : nom, email, téléphone, CMS.
              </p>
              <textarea
                value={urlsText}
                onChange={e => setUrlsText(e.target.value)}
                rows={8}
                placeholder={'https://boulangerie-dupont.fr\nhttps://salon-marieclaire.com\nhttps://restaurant-laumiere.fr'}
                className="w-full bg-gray-800 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500/60 resize-none"
              />
              <div className="flex items-center gap-3">
                <button onClick={scrapeUrls} disabled={scraping}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-600/30 transition-colors disabled:opacity-50">
                  {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Lancer le scraping
                </button>
                {scrapeProgress && <span className="text-xs text-gray-400">{scrapeProgress}</span>}
              </div>
            </>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{preview.length} leads prêts à importer :</p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-white/8 divide-y divide-white/5">
                {preview.slice(0, 20).map((l, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <span className="font-medium text-white truncate flex-1">{l.business_name}</span>
                    {l.website_url && <span className="text-gray-500 truncate max-w-[160px]">{l.website_url}</span>}
                    {l.email       && <Mail className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                    {l.cms         && <span className={`flex-shrink-0 ${CMS_COLOR[l.cms] ?? 'text-gray-500'}`}>{l.cms}</span>}
                  </div>
                ))}
                {preview.length > 20 && (
                  <div className="px-3 py-2 text-xs text-gray-500">…et {preview.length - 20} autres</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/8 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-sm transition-colors">
            Annuler
          </button>
          <button onClick={handleImport} disabled={!preview.length || importing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm transition-all disabled:opacity-50">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Importer {preview.length > 0 ? `(${preview.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, onChange }: { status: Lead['status']; onChange?: (s: Lead['status']) => void }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CONFIG[status]

  if (!onChange) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
        {cfg.label}
      </span>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${cfg.color}`}>
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-gray-800 border border-white/10 rounded-lg py-1 min-w-[130px] shadow-xl">
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <button key={v} onClick={() => { onChange(v as Lead['status']); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors text-left ${
                  v === status ? 'text-white font-semibold' : 'text-gray-300'
                }`}>
                <span className={`w-2 h-2 rounded-full ${c.color.split(' ')[0]}`} />
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main CRM page ────────────────────────────────────────────────────────────
export default function CRMPage() {
  const router = useRouter()
  const { leads, loading, createLead, updateLead, deleteLead, bulkCreateLeads } = useLeads()

  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('all')
  const [showAddLead,     setShowAddLead]      = useState(false)
  const [editingLead,     setEditingLead]      = useState<Lead | null>(null)
  const [showBulkImport,  setShowBulkImport]   = useState(false)
  const [sites,           setSites]            = useState<{ id: string; name: string }[]>([])
  const [toast,           setToast]            = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deletingId,      setDeletingId]       = useState<string | null>(null)
  const [userEmail,       setUserEmail]        = useState('')

  // Load user & sites
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email ?? '')
    })
    fetch('/api/sites').then(r => r.json()).then(d => setSites(d.sites ?? []))
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Stats
  const stats = useMemo(() => {
    const count = (s: string) => leads.filter(l => l.status === s).length
    return {
      total:       leads.length,
      withWebsite: leads.filter(l => l.website_url).length,
      withEmail:   leads.filter(l => l.email).length,
      new:         count('new'),
      contacted:   count('contacted'),
      building:    count('building'),
      built:       count('built'),
      closed:      count('closed'),
    }
  }, [leads])

  // Filtered leads
  const filtered = useMemo(() => {
    let result = leads
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.business_name.toLowerCase().includes(q) ||
        l.website_url?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q)
      )
    }
    return result
  }, [leads, statusFilter, search])

  const handleSaveLead = async (data: Partial<Lead>) => {
    if (editingLead) {
      await updateLead(editingLead.id, data)
      showToast('Lead mis à jour')
    } else {
      await createLead(data as Lead & { business_name: string })
      showToast('Lead ajouté')
    }
    setShowAddLead(false)
    setEditingLead(null)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteLead(id)
    setDeletingId(null)
    showToast('Lead supprimé')
  }

  const handleBulkImport = async (newLeads: Partial<Lead>[]) => {
    const created = await bulkCreateLeads(newLeads)
    setShowBulkImport(false)
    showToast(`${created} leads importés`)
  }

  const handleStatusChange = async (id: string, status: Lead['status']) => {
    await updateLead(id, { status })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Sites
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-base">CRM Leads</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {userEmail && (
            <span className="text-xs text-gray-500 hidden md:block">{userEmail}</span>
          )}
        </div>
      </nav>

      <main className="flex-1 px-6 md:px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total',     value: stats.total,       color: 'text-white'         },
            { label: 'Nouveaux',  value: stats.new,         color: 'text-blue-400'      },
            { label: 'Contactés', value: stats.contacted,   color: 'text-amber-400'     },
            { label: 'En cours',  value: stats.building,    color: 'text-violet-400'    },
            { label: 'Livrés',    value: stats.built,       color: 'text-green-400'     },
            { label: 'Avec email',value: stats.withEmail,   color: 'text-emerald-400'   },
          ].map(s => (
            <div key={s.label}
              className="bg-gray-900 border border-white/5 rounded-xl px-4 py-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full bg-gray-900 border border-white/8 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-violet-500/60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60 min-w-[140px]"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>

          <button onClick={() => { setEditingLead(null); setShowAddLead(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-950/40 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Ajouter
          </button>

          <button onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/8 hover:bg-white/8 text-sm transition-colors whitespace-nowrap">
            <Upload className="w-4 h-4" /> Importer
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-violet-400" />
            </div>
            <h3 className="font-bold text-lg mb-1">
              {leads.length === 0 ? 'Aucun lead pour l\'instant' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs">
              {leads.length === 0
                ? 'Commence par ajouter des leads manuellement ou en important un CSV.'
                : 'Essaie de modifier tes filtres.'}
            </p>
            {leads.length === 0 && (
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddLead(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Ajouter un lead
                </button>
                <button onClick={() => setShowBulkImport(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/8 text-sm">
                  <Upload className="w-4 h-4" /> Importer CSV
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b border-white/5 text-xs text-gray-500 font-medium">
              <div>Business</div>
              <div>Site web / CMS</div>
              <div>Contact</div>
              <div>Statut</div>
              <div>Site Adorable</div>
              <div />
            </div>

            <div className="divide-y divide-white/5">
              {filtered.map(lead => (
                <div key={lead.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 items-center hover:bg-white/2 transition-colors group">

                  {/* Business name */}
                  <div>
                    <div className="font-medium text-sm text-white leading-tight">{lead.business_name}</div>
                    {lead.city && (
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span>{lead.city}</span>
                        {lead.category && <><span>·</span><span>{lead.category}</span></>}
                      </div>
                    )}
                    {lead.notes && (
                      <div className="text-xs text-gray-600 mt-0.5 truncate max-w-[180px]">{lead.notes}</div>
                    )}
                  </div>

                  {/* Website */}
                  <div>
                    {lead.website_url ? (
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <a href={lead.website_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-violet-400 hover:text-violet-300 truncate max-w-[150px] transition-colors"
                          title={lead.website_url}>
                          {lead.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                    {lead.cms && (
                      <div className={`text-xs mt-0.5 flex items-center gap-1 ${CMS_COLOR[lead.cms] ?? 'text-gray-500'}`}>
                        <LayoutTemplate className="w-3 h-3" />
                        {lead.cms}
                      </div>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="space-y-0.5">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`}
                        className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors truncate max-w-[130px]"
                        title={lead.email}>
                        <Mail className="w-3 h-3 flex-shrink-0 text-green-500" />
                        <span className="truncate">{lead.email}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> —
                      </span>
                    )}
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{lead.phone}</span>
                      </a>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge
                      status={lead.status}
                      onChange={s => handleStatusChange(lead.id, s)}
                    />
                  </div>

                  {/* Linked site */}
                  <div>
                    {lead.sites ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={lead.sites.deployed_url ?? `/editor/${lead.sites.id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors max-w-[120px] truncate"
                          title={lead.sites.name}>
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{lead.sites.name}</span>
                        </a>
                        <a href={`/editor/${lead.sites.id}`}
                          className="text-gray-600 hover:text-gray-300 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingLead(lead)}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-violet-400 transition-colors">
                        <Link2 className="w-3.5 h-3.5" />
                        Lier un site
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingLead(lead)}
                      className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors"
                      title="Modifier">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(lead.id)} disabled={deletingId === lead.id}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      title="Supprimer">
                      {deletingId === lead.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer count */}
            <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-600">
              {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' || search ? ` (filtrés sur ${leads.length})` : ''}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {(showAddLead || editingLead) && (
        <LeadModal
          lead={editingLead}
          sites={sites}
          onSave={handleSaveLead}
          onClose={() => { setShowAddLead(false); setEditingLead(null) }}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          sites={sites}
          onImport={handleBulkImport}
          onClose={() => setShowBulkImport(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-green-950 border border-green-700/50 text-green-300'
            : 'bg-red-950 border border-red-700/50 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
