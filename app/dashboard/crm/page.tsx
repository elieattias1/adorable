'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { isAdminUserClient } from '@/lib/admin'
import { useLeads, type Lead } from '@/hooks/useLeads'
import {
  ArrowLeft, Plus, Upload, Globe, Trash2, Edit2, X,
  Search, ChevronDown, Loader2, CheckCircle2, RefreshCw,
  Phone, Mail, Building2, MapPin,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const LeadsMap = dynamic(() => import('@/components/crm/LeadsMap'), { ssr: false, loading: () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
  </div>
) })

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:        { label: 'Nouveau',    color: 'bg-blue-50 text-blue-700 border-blue-200'       },
  contacted:  { label: 'Contacté',   color: 'bg-amber-50 text-amber-700 border-amber-200'    },
  building:   { label: 'En cours',   color: 'bg-violet-50 text-violet-700 border-violet-200' },
  built:      { label: 'Livré',      color: 'bg-green-50 text-green-700 border-green-200'    },
  closed:     { label: 'Fermé',      color: 'bg-gray-100 text-gray-500 border-gray-200'      },
} as const

const CMS_COLOR: Record<string, string> = {
  WordPress:  'text-sky-600',
  Wix:        'text-blue-600',
  Squarespace:'text-gray-600',
  Webflow:    'text-indigo-600',
  Shopify:    'text-green-600',
  Jimdo:      'text-orange-600',
  Custom:     'text-gray-500',
  PrestaShop: 'text-rose-600',
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

// ─── Extract lat/lng from a Google Maps URL ───────────────────────────────────
// Handles the !3d{lat}!4d{lng} format used in Google Maps data URLs
function extractCoordsFromMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null
  // !3d{lat}!4d{lng}  — most common in /data= URLs
  const m = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  // /@{lat},{lng},{zoom}
  const m2 = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) }
  return null
}

// ─── CSV column mapping ───────────────────────────────────────────────────────
function mapCsvRow(row: Record<string, string>): Partial<Lead> {
  const g  = (...keys: string[]) => keys.map(k => row[k]).find(v => v) || undefined
  const gn = (...keys: string[]) => { const v = g(...keys); return v ? parseFloat(v) || undefined : undefined }
  const gb = (...keys: string[]) => { const v = g(...keys); return v ? v === 'true' || v === '1' || v === 'yes' : undefined }

  const mapsUrl = g('google_maps_url', 'maps_url', 'google_maps')

  // Prefer explicit lat/lng columns; fall back to extracting from google_maps_url
  let lat = gn('latitude', 'lat')
  let lng = gn('longitude', 'lng', 'lon')
  if ((lat == null || lng == null) && mapsUrl) {
    const coords = extractCoordsFromMapsUrl(mapsUrl)
    if (coords) { lat = coords.lat; lng = coords.lng }
  }

  return {
    business_name:   g('name','business_name','nom','business','company') || 'Unknown',
    website_url:     g('website','website_url','url','site','web') || undefined,
    email:           g('email','email_address','courriel') || undefined,
    phone:           g('phone','telephone','téléphone','tel','phone_number') || undefined,
    address:         g('address','adresse') || undefined,
    city:            g('city','ville') || undefined,
    category:        g('category','catégorie','type') || undefined,
    cms:             g('cms') || undefined,
    arrondissement:  g('arrondissement') || undefined,
    postcode:        g('postcode','postal_code','code_postal','zip') || undefined,
    departement:     g('departement','département') || undefined,
    rating:          gn('rating','note'),
    reviews:         gn('reviews','avis') ? Math.round(gn('reviews','avis')!) : undefined,
    opening_hours:   g('opening_hours','horaires') || undefined,
    instagram:       g('instagram') || undefined,
    facebook:        g('facebook') || undefined,
    latitude:        lat,
    longitude:       lng,
    google_maps_url: mapsUrl,
    has_website:     gb('has_website'),
    outreach_status: g('outreach_status') || undefined,
    source:          g('source') || 'csv_import',
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
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-base">{lead ? 'Modifier le lead' : 'Ajouter un lead'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
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
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Site web</label>
              <input
                type="url" value={form.website_url ?? ''}
                onChange={e => set('website_url', e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input
                type="email" value={form.email ?? ''}
                onChange={e => set('email', e.target.value)}
                placeholder="contact@example.com"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Téléphone</label>
              <input
                value={form.phone ?? ''}
                onChange={e => set('phone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Catégorie</label>
              <input
                value={form.category ?? ''}
                onChange={e => set('category', e.target.value)}
                placeholder="Boulangerie"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ville</label>
              <input
                value={form.city ?? ''}
                onChange={e => set('city', e.target.value)}
                placeholder="Paris"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Adresse</label>
              <input
                value={form.address ?? ''}
                onChange={e => set('address', e.target.value)}
                placeholder="12 rue de la Paix, 75001 Paris"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Statut</label>
              <select
                value={form.status ?? 'new'}
                onChange={e => set('status', e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
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
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
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
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100 text-sm transition-colors text-gray-900">
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
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="font-bold text-base">Importer des leads</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {(['csv', 'urls'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setPreview([]) }}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t ? 'border-violet-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
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
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 resize-none"
              />
              <button onClick={parseCsvPreview}
                className="px-4 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-sm hover:bg-violet-100 transition-colors">
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
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 resize-none"
              />
              <div className="flex items-center gap-3">
                <button onClick={scrapeUrls} disabled={scraping}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-sm hover:bg-violet-100 transition-colors disabled:opacity-50">
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
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {preview.slice(0, 20).map((l, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <span className="font-medium text-gray-900 truncate flex-1">{l.business_name}</span>
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

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors">
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
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg py-1 min-w-[130px] shadow-xl">
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <button key={v} onClick={() => { onChange(v as Lead['status']); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-left ${
                  v === status ? 'text-gray-900 font-semibold' : 'text-gray-600'
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

// ─── Has/No toggle for boolean column filters ─────────────────────────────────
function HasToggle({ value, onChange }: {
  value: 'all' | 'yes' | 'no'
  onChange: (v: 'all' | 'yes' | 'no') => void
}) {
  const next = value === 'all' ? 'yes' : value === 'yes' ? 'no' : 'all'
  return (
    <button onClick={() => onChange(next)}
      className={`h-6 px-2 rounded text-[10px] font-semibold border transition-colors w-full ${
        value === 'all' ? 'bg-transparent border-gray-200 text-gray-400'
        : value === 'yes' ? 'bg-green-50 border-green-300 text-green-700'
        : 'bg-red-50 border-red-300 text-red-600'
      }`}>
      {value === 'all' ? 'Tous' : value === 'yes' ? '✓ Oui' : '✗ Non'}
    </button>
  )
}

// ─── Dropdown filter for text columns (multi-select) ─────────────────────────
function ColFilterDropdown({ value, onChange, options, placeholder }: {
  value: string[]
  onChange: (v: string[]) => void
  options: string[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const visible = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  const label = value.length === 0 ? placeholder
    : value.length === 1 ? value[0]
    : `${value.length} sélectionnés`

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`col-filter flex items-center justify-between gap-1 w-full text-left ${
          value.length ? 'border-violet-400 bg-violet-50 text-violet-700' : ''
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => { setOpen(false); setSearch('') }} />
          <div className="absolute top-full left-0 z-30 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <div className="p-1.5 border-b border-gray-100">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full text-[11px] px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-violet-400 bg-white text-gray-800"
              />
            </div>
            <div className="max-h-[150px] overflow-y-auto">
              {value.length > 0 && (
                <button
                  onClick={() => onChange([])}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-gray-400 hover:bg-gray-50 border-b border-gray-100"
                >
                  — Tout effacer ({value.length})
                </button>
              )}
              {visible.length === 0 ? (
                <div className="px-3 py-2.5 text-[11px] text-gray-400 text-center">Aucun résultat</div>
              ) : (
                visible.map(opt => {
                  const checked = value.includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(opt)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 text-left ${
                        checked ? 'text-violet-700 bg-violet-50' : 'text-gray-700'
                      }`}
                      title={opt}
                    >
                      <span className={`w-3 h-3 flex-shrink-0 rounded border flex items-center justify-center ${
                        checked ? 'bg-violet-600 border-violet-600' : 'border-gray-300'
                      }`}>
                        {checked && <span className="text-white text-[8px] leading-none">✓</span>}
                      </span>
                      <span className="truncate">{opt}</span>
                    </button>
                  )
                })
              )}
            </div>
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
  const [selected,        setSelected]         = useState<Set<string>>(new Set())
  const [bulkDeleting,    setBulkDeleting]     = useState(false)
  const [mapOpen,         setMapOpen]          = useState(true)
  const [mapLead,         setMapLead]          = useState<Lead | null>(null)
  const [colFilters, setColFilters] = useState({
    business:       [] as string[],
    category:       [] as string[],
    address:        [] as string[],
    arrondissement: [] as string[],
    postcode:       [] as string[],
    phone:          'all' as 'all'|'yes'|'no',
    minRating:      '',
    minReviews:     '',
    email:          'all' as 'all'|'yes'|'no',
    website:        'all' as 'all'|'yes'|'no',
    instagram:      'all' as 'all'|'yes'|'no',
    facebook:       'all' as 'all'|'yes'|'no',
    outreach:       [] as string[],
    maps:           'all' as 'all'|'yes'|'no',
  })
  const setCF = <K extends keyof typeof colFilters>(k: K, v: typeof colFilters[K]) =>
    setColFilters(p => ({ ...p, [k]: v }))
  const hasColFilters = Object.entries(colFilters).some(([, v]) =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v !== '' && v !== 'all' : false
  )

  // Load user & sites — redirect non-admins
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !isAdminUserClient(data.user.id)) {
        router.replace('/dashboard')
        return
      }
      setUserEmail(data.user.email ?? '')
    })
    fetch('/api/sites').then(r => r.json()).then(d => setSites(d.sites ?? []))
  }, [router])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Unique options for dropdown filters (from all leads, not filtered)
  const colOptions = useMemo(() => {
    const uniq = (vals: (string | null | undefined)[]) =>
      [...new Set(vals.filter((v): v is string => !!v))].sort()
    return {
      business:       uniq(leads.map(l => l.business_name)),
      category:       uniq(leads.map(l => l.category)),
      address:        uniq(leads.map(l => l.address)),
      arrondissement: uniq(leads.map(l => l.arrondissement ?? l.city)),
      postcode:       uniq(leads.map(l => l.postcode)),
      outreach:       uniq(leads.map(l => l.outreach_status)),
    }
  }, [leads])

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
    const cf = colFilters
    const inSet = (val: string | null | undefined, set: string[]) =>
      set.length === 0 || set.includes(val ?? '')
    const has = (val: unknown, mode: 'all'|'yes'|'no') =>
      mode === 'all' ? true : mode === 'yes' ? !!val : !val

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
    // Column filters
    if (cf.business.length)       result = result.filter(l => inSet(l.business_name, cf.business))
    if (cf.category.length)       result = result.filter(l => inSet(l.category, cf.category))
    if (cf.address.length)        result = result.filter(l => inSet(l.address, cf.address))
    if (cf.arrondissement.length) result = result.filter(l => inSet(l.arrondissement ?? l.city, cf.arrondissement))
    if (cf.postcode.length)       result = result.filter(l => inSet(l.postcode ?? l.departement, cf.postcode))
    if (cf.outreach.length)       result = result.filter(l => inSet(l.outreach_status, cf.outreach))
    if (cf.minRating)      result = result.filter(l => (l.rating ?? 0) >= parseFloat(cf.minRating))
    if (cf.minReviews)     result = result.filter(l => (l.reviews ?? 0) >= parseInt(cf.minReviews))
    if (cf.phone    !== 'all') result = result.filter(l => has(l.phone, cf.phone))
    if (cf.email    !== 'all') result = result.filter(l => has(l.email, cf.email))
    if (cf.website  !== 'all') result = result.filter(l => has(l.website_url, cf.website))
    if (cf.instagram !== 'all') result = result.filter(l => has(l.instagram, cf.instagram))
    if (cf.facebook !== 'all') result = result.filter(l => has(l.facebook, cf.facebook))
    if (cf.maps     !== 'all') result = result.filter(l => has(l.google_maps_url, cf.maps))
    return result
  }, [leads, statusFilter, search, colFilters])

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

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(l => l.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (!selected.size) return
    setBulkDeleting(true)
    await Promise.all([...selected].map(id => deleteLead(id)))
    showToast(`${selected.size} leads supprimés`)
    setSelected(new Set())
    setBulkDeleting(false)
  }

  const mappableCount = useMemo(() =>
    leads.filter(l =>
      (l.latitude != null && l.longitude != null) ||
      (l.google_maps_url != null && /!3d|@-?\d/.test(l.google_maps_url))
    ).length
  , [leads])

  return (
    <div className="h-screen bg-[#fafaf9] text-gray-900 flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Sites
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gray-950 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-base tracking-tight text-gray-950">CRM Leads</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setMapOpen(p => !p); setMapLead(null) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              mapOpen
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Carte{mappableCount > 0 ? ` (${mappableCount})` : ''}
          </button>
          <ThemeToggle />
          {userEmail && (
            <span className="text-xs text-gray-500 hidden md:block">{userEmail}</span>
          )}
        </div>
      </nav>

      {/* Body: optional side map + main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Map side panel ── */}
        {mapOpen && (
          <div className="w-[400px] flex-shrink-0 border-r border-gray-200 flex flex-col bg-white overflow-hidden">

            {/* Map */}
            <div className="flex-1 p-3 min-h-0">
              <LeadsMap
                leads={filtered}
                selectedId={mapLead?.id ?? null}
                selectedIds={selected}
                onSelect={setMapLead}
              />
            </div>

            {/* Lead detail card */}
            {mapLead ? (
              <div className="border-t border-gray-200 p-4 space-y-3 flex-shrink-0 max-h-64 overflow-y-auto">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{mapLead.business_name}</div>
                    {(mapLead.city || mapLead.category) && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {[mapLead.category, mapLead.city].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setMapLead(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(mapLead.rating != null || mapLead.reviews != null) && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                      ★ {mapLead.rating ?? '—'}
                      {mapLead.reviews != null && <span className="text-gray-400 font-normal">({mapLead.reviews} avis)</span>}
                    </div>
                  )}
                  {mapLead.address && (
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      {mapLead.address}
                    </div>
                  )}
                  {mapLead.opening_hours && (
                    <div className="text-xs text-gray-500">🕐 {mapLead.opening_hours}</div>
                  )}
                  {mapLead.phone && (
                    <a href={`tel:${mapLead.phone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {mapLead.phone}
                    </a>
                  )}
                  {mapLead.email && (
                    <a href={`mailto:${mapLead.email}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{mapLead.email}</span>
                    </a>
                  )}
                  {mapLead.website_url && (
                    <a href={mapLead.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-700 truncate">
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{mapLead.website_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </a>
                  )}
                  {mapLead.google_maps_url && (
                    <a href={mapLead.google_maps_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      Voir sur Google Maps
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <StatusBadge status={mapLead.status} onChange={s => { handleStatusChange(mapLead.id, s); setMapLead(p => p ? { ...p, status: s } : p) }} />
                  <button onClick={() => { setEditingLead(mapLead); setMapLead(null) }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                    <Edit2 className="w-3 h-3" /> Modifier
                  </button>
                </div>

                {mapLead.notes && (
                  <p className="text-xs text-gray-400 italic">{mapLead.notes}</p>
                )}
              </div>
            ) : (
              <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0 space-y-2">
                <p className="text-xs text-gray-400">Clique sur un marqueur pour voir les détails</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.color.split(' ')[0]}`} />
                      <span className="text-[10px] text-gray-500">{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scrollable main content ── */}
        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total',     value: stats.total,       color: 'text-gray-950'      },
            { label: 'Nouveaux',  value: stats.new,         color: 'text-blue-600'      },
            { label: 'Contactés', value: stats.contacted,   color: 'text-amber-600'     },
            { label: 'En cours',  value: stats.building,    color: 'text-violet-600'    },
            { label: 'Livrés',    value: stats.built,       color: 'text-green-600'     },
            { label: 'Avec email',value: stats.withEmail,   color: 'text-emerald-600'   },
          ].map(s => (
            <div key={s.label}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
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
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-violet-500 min-w-[140px]"
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm transition-colors whitespace-nowrap">
            <Upload className="w-4 h-4" /> Importer
          </button>

          {hasColFilters && (
            <button onClick={() => setColFilters({
              business:[],category:[],address:[],arrondissement:[],postcode:[],
              phone:'all',minRating:'',minReviews:'',email:'all',website:'all',
              instagram:'all',facebook:'all',outreach:[],maps:'all',
            })} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-sm font-medium hover:bg-violet-100 transition-colors whitespace-nowrap">
              <X className="w-3.5 h-3.5" /> Reset filtres
            </button>
          )}
        </div>

        {/* Selection action bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-3 bg-violet-50 border border-violet-200 rounded-xl">
            <span className="text-sm text-violet-700 font-medium">
              {selected.size} lead{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-white transition-colors">
                Désélectionner
              </button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50">
                {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Supprimer ({selected.size})
              </button>
            </div>
          </div>
        )}

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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm">
                  <Upload className="w-4 h-4" /> Importer CSV
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              {/* min-w matches col count: checkbox + 15 data cols + actions */}
              <div className="min-w-[1800px]">
                {/* ── Header ── */}
                <div className="grid grid-cols-[auto_180px_110px_140px_120px_150px_160px_90px_80px_110px_90px_90px_120px_120px_110px_110px_auto] gap-x-2 px-4 py-3 border-b border-gray-200 text-xs text-gray-500 font-medium uppercase tracking-wide">
                  <div className="flex items-center">
                    <input type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length }}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer"
                    />
                  </div>
                  <div>Business</div>
                  <div>Catégorie</div>
                  <div>Adresse</div>
                  <div>Arrond.</div>
                  <div>CP / Dépt</div>
                  <div>Téléphone</div>
                  <div>Note</div>
                  <div>Avis</div>
                  <div>Horaires</div>
                  <div>Email</div>
                  <div>Site web</div>
                  <div>Instagram</div>
                  <div>Facebook</div>
                  <div>Statut</div>
                  <div>Maps</div>
                  <div />
                </div>

                {/* ── Filter row ── */}
                <div className="grid grid-cols-[auto_180px_110px_140px_120px_150px_160px_90px_80px_110px_90px_90px_120px_120px_110px_110px_auto] gap-x-2 px-4 py-1.5 border-b border-gray-100 bg-gray-50">
                  <div />
                  <ColFilterDropdown value={colFilters.business} onChange={v => setCF('business', v)}
                    options={colOptions.business} placeholder="Filtrer…" />
                  <ColFilterDropdown value={colFilters.category} onChange={v => setCF('category', v)}
                    options={colOptions.category} placeholder="Filtrer…" />
                  <ColFilterDropdown value={colFilters.address} onChange={v => setCF('address', v)}
                    options={colOptions.address} placeholder="Filtrer…" />
                  <ColFilterDropdown value={colFilters.arrondissement} onChange={v => setCF('arrondissement', v)}
                    options={colOptions.arrondissement} placeholder="Filtrer…" />
                  <ColFilterDropdown value={colFilters.postcode} onChange={v => setCF('postcode', v)}
                    options={colOptions.postcode} placeholder="Filtrer…" />
                  <HasToggle value={colFilters.phone} onChange={v => setCF('phone', v)} />
                  <input type="number" min="0" max="5" step="0.1"
                    value={colFilters.minRating} onChange={e => setCF('minRating', e.target.value)}
                    placeholder="≥ note" className="col-filter" />
                  <input type="number" min="0"
                    value={colFilters.minReviews} onChange={e => setCF('minReviews', e.target.value)}
                    placeholder="≥ avis" className="col-filter" />
                  <div />
                  <HasToggle value={colFilters.email} onChange={v => setCF('email', v)} />
                  <HasToggle value={colFilters.website} onChange={v => setCF('website', v)} />
                  <HasToggle value={colFilters.instagram} onChange={v => setCF('instagram', v)} />
                  <HasToggle value={colFilters.facebook} onChange={v => setCF('facebook', v)} />
                  <ColFilterDropdown value={colFilters.outreach} onChange={v => setCF('outreach', v)}
                    options={colOptions.outreach} placeholder="Filtrer…" />
                  <HasToggle value={colFilters.maps} onChange={v => setCF('maps', v)} />
                  <div />
                </div>

                {/* ── Rows ── */}
                <div className="divide-y divide-gray-100">
                  {filtered.map(lead => (
                    <div key={lead.id}
                      className={`grid grid-cols-[auto_180px_110px_140px_120px_150px_160px_90px_80px_110px_90px_90px_120px_120px_110px_110px_auto] gap-x-2 px-4 py-2.5 items-center transition-colors group text-xs ${
                        selected.has(lead.id) ? 'bg-violet-50' : 'hover:bg-gray-50'
                      }`}>

                      {/* Checkbox */}
                      <div className="flex items-center">
                        <input type="checkbox" checked={selected.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer" />
                      </div>

                      {/* Business */}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{lead.business_name}</div>
                        {lead.notes && <div className="text-gray-400 truncate mt-0.5">{lead.notes}</div>}
                      </div>

                      {/* Category */}
                      <div className="text-gray-600 truncate">{lead.category || <span className="text-gray-300">—</span>}</div>

                      {/* Address */}
                      <div className="text-gray-600 truncate" title={lead.address ?? ''}>{lead.address || <span className="text-gray-300">—</span>}</div>

                      {/* Arrondissement */}
                      <div className="text-gray-600 truncate">{lead.arrondissement || lead.city || <span className="text-gray-300">—</span>}</div>

                      {/* Postcode / Dept */}
                      <div className="text-gray-600 truncate">
                        {lead.postcode && <span>{lead.postcode}</span>}
                        {lead.postcode && lead.departement && <span className="text-gray-400"> · </span>}
                        {lead.departement && <span className="text-gray-500">{lead.departement}</span>}
                        {!lead.postcode && !lead.departement && <span className="text-gray-300">—</span>}
                      </div>

                      {/* Phone */}
                      <div onClick={e => e.stopPropagation()}>
                        {lead.phone
                          ? <a href={`tel:${lead.phone}`} className="text-gray-600 hover:text-gray-900 transition-colors">{lead.phone}</a>
                          : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Rating */}
                      <div>
                        {lead.rating != null
                          ? <span className="text-amber-600 font-medium">★ {lead.rating}</span>
                          : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Reviews */}
                      <div className="text-gray-500">
                        {lead.reviews != null ? lead.reviews.toLocaleString('fr') : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Opening hours */}
                      <div className="text-gray-500 truncate" title={lead.opening_hours ?? ''}>
                        {lead.opening_hours ? lead.opening_hours.split(/lundi|lun\.|mon/i)[0].trim() || lead.opening_hours.slice(0, 20) : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Email */}
                      <div onClick={e => e.stopPropagation()} className="min-w-0">
                        {lead.email
                          ? <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 truncate" title={lead.email}>
                              <Mail className="w-3 h-3 flex-shrink-0 text-green-500" />
                              <span className="truncate">{lead.email}</span>
                            </a>
                          : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Website */}
                      <div onClick={e => e.stopPropagation()} className="min-w-0">
                        {lead.website_url
                          ? <a href={lead.website_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-violet-600 hover:text-violet-700 truncate" title={lead.website_url}>
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{lead.website_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                            </a>
                          : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Instagram */}
                      <div onClick={e => e.stopPropagation()} className="min-w-0">
                        {lead.instagram
                          ? <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-pink-500 hover:text-pink-600 truncate block">
                              {lead.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}
                            </a>
                          : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Facebook */}
                      <div onClick={e => e.stopPropagation()} className="min-w-0">
                        {lead.facebook
                          ? <a href={lead.facebook.startsWith('http') ? lead.facebook : `https://facebook.com/${lead.facebook}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 truncate block">
                              {lead.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, '')}
                            </a>
                          : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Status */}
                      <div onClick={e => e.stopPropagation()}>
                        <StatusBadge status={lead.status} onChange={s => handleStatusChange(lead.id, s)} />
                      </div>

                      {/* Google Maps */}
                      <div onClick={e => e.stopPropagation()}>
                        {lead.google_maps_url
                          ? <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> Maps
                            </a>
                          : <span className="text-gray-300">—</span>}
                      </div>

                      {/* Actions */}
                      <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingLead(lead)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(lead.id)} disabled={deletingId === lead.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                          {deletingId === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
                  {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
                  {statusFilter !== 'all' || search ? ` (filtrés sur ${leads.length})` : ''}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      </div>{/* end flex body */}

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
