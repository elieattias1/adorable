'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Zap, Crown, Check, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedTemplate {
  id:             number
  slug:           string
  name:           string
  url:            string
  industry:       string
  site_type:      string
  screenshot_url: string | null
  quality_score:  number | null
  react_code:     string | null
}

// ─── Business type filter pills ──────────────────────────────────────────────
// label → list of `industry` DB values that match this filter

const BUSINESS_FILTERS: { label: string; emoji: string; industries: string[] }[] = [
  { label: 'Tous',         emoji: '',   industries: [] },
  { label: 'Boulangerie',  emoji: '🥐', industries: ['Boulangerie'] },
  { label: 'Café',         emoji: '☕', industries: ['Café', 'Coffee'] },
  { label: 'Restaurant',   emoji: '🍽️', industries: ['Restaurant', 'Food & Beverage', 'Food & Grocery', 'Food'] },
  { label: 'Pâtisserie',   emoji: '🎂', industries: ['Pâtisserie', 'Patisserie'] },
  { label: 'Coiffeur',     emoji: '✂️', industries: ['Salon', 'Beauty & Wellness', 'Wellness', 'Hair'] },
  { label: 'Beauté',       emoji: '💅', industries: ['Beauty', 'Beauty & Wellness', 'Wellness', 'Spa'] },
  { label: 'Shop',         emoji: '🛍️', industries: ['E-commerce', 'Shop', 'Retail'] },
  { label: 'SaaS',         emoji: '💻', industries: ['SaaS', 'Technology', 'Tech'] },
  { label: 'Agence',       emoji: '🏢', industries: ['Agency', 'Agency / Portfolio', 'Design & Creative'] },
  { label: 'Immo',         emoji: '🏠', industries: ['Real Estate', 'Immobilier'] },
  { label: 'Santé',        emoji: '🏥', industries: ['Health & Wellness', 'Healthcare', 'Medical'] },
  { label: 'Éducation',    emoji: '🎓', industries: ['Education'] },
  { label: 'Finance',      emoji: '💰', industries: ['Finance', 'Fintech'] },
  { label: 'Voyage',       emoji: '✈️', industries: ['Travel', 'Hotel', 'Tourism'] },
  { label: 'ONG',          emoji: '🤝', industries: ['Non-profit', 'NGO', 'Association'] },
]

// ─── Modal ────────────────────────────────────────────────────────────────────

interface NewSiteModalProps {
  open: boolean
  onClose: () => void
  onCreateSite: (name: string, type: string, description?: string) => Promise<{ id: string }>
  onPlanLimit: () => void
}

export default function NewSiteModal({ open, onClose, onCreateSite, onPlanLimit }: NewSiteModalProps) {
  const router = useRouter()

  const [name,          setName]         = useState('')
  const [loading,       setLoading]      = useState(false)
  const [error,         setError]        = useState<string | null>(null)
  const [selectedSlug,  setSelectedSlug] = useState<string | null>(null)  // null = scratch
  const [templates,     setTemplates]    = useState<ScrapedTemplate[]>([])
  const [tplLoading,    setTplLoading]   = useState(false)
  const [activeIndustry,setActiveIndustry] = useState<string>('Tous')

  // Fetch templates from Supabase when modal opens
  useEffect(() => {
    if (!open) return
    setTplLoading(true)
    const supabase = createClient()
    supabase
      .from('reference_sites')
      .select('id, slug, name, url, industry, site_type, screenshot_url, quality_score, react_code')
      .not('react_code', 'is', null)
      .not('url', 'is', null)
      .not('has_cookies_wall', 'eq', true)
      .order('quality_score', { ascending: false, nullsFirst: false })
      .limit(200)
      .then(({ data }) => {
        setTemplates((data as ScrapedTemplate[]) ?? [])
        setTplLoading(false)
      })
  }, [open])

  const activeFilter = BUSINESS_FILTERS.find(f => f.label === activeIndustry) ?? BUSINESS_FILTERS[0]
  const filtered = activeFilter.industries.length === 0
    ? templates
    : templates.filter(t => activeFilter.industries.includes(t.industry))
  // Deduplicate by slug
  const seenSlugs = new Set<string>()
  const visible = filtered.filter(t => {
    if (seenSlugs.has(t.slug)) return false
    seenSlugs.add(t.slug)
    return true
  })

  const reset = () => {
    setName(''); setError(null); setSelectedSlug(null); setActiveIndustry('Tous')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    try {
      const tpl = templates.find(t => t.slug === selectedSlug) ?? null

      const VALID_SITE_TYPES = ['business','portfolio','restaurant','shop','blog','saas','landing','bakery','wellness','blank']
      const siteType = tpl?.site_type && VALID_SITE_TYPES.includes(tpl.site_type) ? tpl.site_type : 'business'

      const site = await onCreateSite(name.trim(), siteType)
      reset()
      onClose()
      // If template has react_code → load it directly; otherwise fall back to AI generation
      const dest = tpl?.slug
        ? `/editor/${site.id}?template=${encodeURIComponent(tpl.slug)}`
        : `/editor/${site.id}`
      router.push(dest)
    } catch (err: any) {
      if (err.code === 'PLAN_LIMIT') {
        onClose()
        onPlanLimit()
      } else {
        setError(err.message || 'Une erreur est survenue')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedTpl = templates.find(t => t.slug === selectedSlug) ?? null

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <Dialog.Title className="text-lg font-bold text-gray-950">Nouveau site</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex flex-col gap-5 px-6 pb-4 overflow-y-auto flex-1">

            {/* Name */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Nom du site *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={80}
                placeholder="Ma Boulangerie Dupont"
                className="w-full bg-white border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-3 text-gray-900 outline-none transition-colors text-sm"
                autoFocus
              />
              {/* Quick suggestions */}
              <div className="flex gap-1.5 flex-wrap mt-2">
                {BUSINESS_FILTERS.filter(f => f.emoji).map(f => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => setActiveIndustry(f.label)}
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                      activeIndustry === f.label
                        ? 'bg-violet-50 border-violet-300 text-violet-700 font-medium'
                        : 'bg-gray-100 border-transparent text-gray-500 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template gallery */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-gray-500 font-medium">
                  Choisis un style de référence
                  <span className="text-gray-400 ml-1">— optionnel</span>
                </label>
                {selectedSlug && (
                  <button type="button" onClick={() => setSelectedSlug(null)}
                    className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                    Effacer la sélection
                  </button>
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-2.5">

                {/* From scratch card */}
                {activeIndustry === 'Tous' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSlug(null)}
                    className={`relative aspect-video rounded-xl border-2 overflow-hidden transition-all flex flex-col items-center justify-center gap-2 ${
                      selectedSlug === null
                        ? 'border-violet-500 ring-1 ring-violet-500/30'
                        : 'border-gray-200 hover:border-gray-300'
                    } bg-gradient-to-br from-violet-50 to-white`}
                  >
                    {selectedSlug === null && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <Sparkles className="w-6 h-6 text-violet-400" />
                    <span className="text-xs font-semibold text-gray-900">Depuis zéro</span>
                    <span className="text-[10px] text-gray-400">L'IA décide du style</span>
                  </button>
                )}

                {/* Loading skeletons */}
                {tplLoading && Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-video rounded-xl bg-gray-100 animate-pulse" />
                ))}

                {/* Template cards */}
                {!tplLoading && visible.map(tpl => (
                  <button
                    key={tpl.slug}
                    type="button"
                    onClick={() => setSelectedSlug(tpl.slug)}
                    className={`relative aspect-video rounded-xl border-2 overflow-hidden transition-all group ${
                      selectedSlug === tpl.slug
                        ? 'border-violet-500 ring-1 ring-violet-500/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Live iframe preview — same technique as SiteCard */}
                    <div className="absolute inset-0 bg-gray-100">
                      <iframe
                        src={`${tpl.url}?preview=1`}
                        title={tpl.name}
                        style={{
                          width: `${100 / 0.22}%`,
                          height: `${100 / 0.22}%`,
                          transform: 'scale(0.22)',
                          transformOrigin: 'top left',
                          border: 'none',
                          pointerEvents: 'none',
                          overflow: 'hidden',
                        }}
                      />
                    </div>

                    {/* Name overlay (always visible) */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 py-1.5">
                      <p className="text-[10px] font-semibold text-white leading-tight truncate">{tpl.name}</p>
                      <p className="text-[9px] text-gray-400 truncate">{tpl.industry}</p>
                    </div>

                    {/* Selected checkmark */}
                    {selectedSlug === tpl.slug && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Selection label */}
              {selectedTpl && (
                <p className="mt-2 text-[11px] text-violet-600">
                  Référence : <span className="font-medium">{selectedTpl.name}</span>
                  <span className="text-gray-400 ml-1">— {selectedTpl.url}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Sticky footer — always visible */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Créer et générer
                </>
              )}
            </button>
          </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── Paywall Modal ─────────────────────────────────────────────────────────────
interface PaywallModalProps {
  open: boolean
  onClose: () => void
  onUpgrade: (plan?: string) => void | Promise<void>
}

export function PaywallModal({ open, onClose, onUpgrade }: PaywallModalProps) {
  const [loading, setLoading] = useState<'starter' | 'pro' | null>(null)

  const handleUpgrade = async (plan: 'starter' | 'pro') => {
    setLoading(plan)
    try { await onUpgrade(plan) } finally { setLoading(null) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">

          {/* Header */}
          <div className="relative px-8 pt-8 pb-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/15 to-transparent pointer-events-none" />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-950/50">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <Dialog.Title className="text-xl font-black mb-2 text-gray-950">Passe à la vitesse supérieure</Dialog.Title>
            <p className="text-gray-500 text-sm leading-relaxed">
              Tu as atteint la limite du plan gratuit. Choisis le plan qui te convient.
            </p>
          </div>

          {/* Plans */}
          <div className="px-6 pb-6 grid grid-cols-2 gap-3">

            {/* Starter */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Starter</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-black">6€</span>
                <span className="text-gray-500 text-xs mb-1">/mois</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-4">Sans engagement</p>
              <ul className="flex-1 space-y-2 mb-5">
                {['5 sites', '100 générations / jour', 'Versions illimitées', 'Hébergement Adorable'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <Check className="w-3 h-3 text-gray-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade('starter')}
                disabled={loading !== null}
                className="w-full py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 bg-white text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading === 'starter'
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirection…</>
                  : 'Passer à Starter'
                }
              </button>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-2xl border border-violet-500/60 bg-violet-950/40 p-5">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-gradient-to-r from-violet-600 to-pink-600 px-3 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                Recommandé
              </div>
              <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-black">19€</span>
                <span className="text-gray-500 text-xs mb-1">/mois</span>
              </div>
              <p className="text-[11px] text-green-400 mb-4">7 jours gratuits · sans CB</p>
              <ul className="flex-1 space-y-2 mb-5">
                {['Sites illimités', 'IA illimitée', 'Domaine personnalisé', 'Support prioritaire'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-violet-900">
                    <Check className="w-3 h-3 text-violet-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={loading !== null}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-violet-950/40"
              >
                {loading === 'pro'
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirection…</>
                  : <><Zap className="w-3.5 h-3.5" /> Essai gratuit 7 jours</>
                }
              </button>
            </div>
          </div>

          <button onClick={onClose} className="w-full pb-5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Rester sur le plan gratuit
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
