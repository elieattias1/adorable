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
}

// ─── Industry display labels ──────────────────────────────────────────────────

const INDUSTRY_LABELS: Record<string, string> = {
  'Food & Beverage':  'Food',
  'Restaurant':       'Food',
  'E-commerce':       'Shop',
  'SaaS':             'SaaS',
  'Health & Wellness':'Santé',
  'Wellness':         'Santé',
  'Portfolio':        'Portfolio',
  'Agency':           'Agence',
  'Real Estate':      'Immo',
  'Education':        'Éducation',
  'Finance':          'Finance',
  'Technology':       'Tech',
  'Fashion':          'Mode',
  'Travel':           'Voyage',
  'Beauty':           'Beauté',
  'Sports':           'Sport',
  'Photography':      'Photo',
  'Music':            'Musique',
  'Non-profit':       'ONG',
}

function shortIndustry(industry: string): string {
  return INDUSTRY_LABELS[industry] ?? industry.split(' ')[0]
}

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
      .from('templates')
      .select('id, slug, name, url, industry, site_type, screenshot_url')
      .not('screenshot_url', 'is', null)
      .order('id', { ascending: true })
      .limit(120)
      .then(({ data }) => {
        setTemplates((data as ScrapedTemplate[]) ?? [])
        setTplLoading(false)
      })
  }, [open])

  // Derive unique industry filter labels
  const industries = ['Tous', ...Array.from(new Set(templates.map(t => shortIndustry(t.industry))))]

  const visible = activeIndustry === 'Tous'
    ? templates
    : templates.filter(t => shortIndustry(t.industry) === activeIndustry)

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

      const siteType = tpl?.site_type ?? 'business'
      const initMsg  = tpl
        ? `Crée un site web pour "${name.trim()}" en t'inspirant du style visuel de "${tpl.name}" (${tpl.url}). Adapte le contenu à "${name.trim()}" tout en respectant l'esthétique de la référence.`
        : `Crée un site web complet et professionnel pour "${name.trim()}".`

      const site = await onCreateSite(name.trim(), siteType)
      reset()
      onClose()
      router.push(`/editor/${site.id}?init=${encodeURIComponent(initMsg)}`)
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
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-gray-950 border border-white/10 rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <Dialog.Title className="text-lg font-bold">Nouveau site</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pb-6 overflow-y-auto flex-1">

            {/* Name */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Nom du site *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={80}
                placeholder="Mon super site"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white outline-none transition-colors text-sm"
                autoFocus
              />
            </div>

            {/* Template gallery */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-gray-400 font-medium">
                  Choisis un style de référence
                  <span className="text-gray-600 ml-1">— optionnel</span>
                </label>
                {selectedSlug && (
                  <button type="button" onClick={() => setSelectedSlug(null)}
                    className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
                    Effacer la sélection
                  </button>
                )}
              </div>

              {/* Industry filter pills */}
              {templates.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {industries.slice(0, 14).map(ind => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setActiveIndustry(ind)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        activeIndustry === ind
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              )}

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
                        : 'border-white/10 hover:border-white/25'
                    } bg-gradient-to-br from-violet-950/60 to-gray-900`}
                  >
                    {selectedSlug === null && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <Sparkles className="w-6 h-6 text-violet-400" />
                    <span className="text-xs font-semibold text-white">Depuis zéro</span>
                    <span className="text-[10px] text-gray-500">L'IA décide du style</span>
                  </button>
                )}

                {/* Loading skeletons */}
                {tplLoading && Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
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
                        : 'border-white/8 hover:border-white/25'
                    }`}
                  >
                    {/* Screenshot */}
                    {tpl.screenshot_url ? (
                      <img
                        src={tpl.screenshot_url}
                        alt={tpl.name}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-2xl">🌐</span>
                      </div>
                    )}

                    {/* Name overlay (always visible) */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 py-1.5">
                      <p className="text-[10px] font-semibold text-white leading-tight truncate">{tpl.name}</p>
                      <p className="text-[9px] text-gray-400 truncate">{shortIndustry(tpl.industry)}</p>
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
                <p className="mt-2 text-[11px] text-violet-400">
                  Référence : <span className="font-medium">{selectedTpl.name}</span>
                  <span className="text-gray-600 ml-1">— {selectedTpl.url}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-colors"
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
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-gray-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">

          {/* Header */}
          <div className="relative px-8 pt-8 pb-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/15 to-transparent pointer-events-none" />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-950/50">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <Dialog.Title className="text-xl font-black mb-2">Passe à la vitesse supérieure</Dialog.Title>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tu as atteint la limite du plan gratuit. Choisis le plan qui te convient.
            </p>
          </div>

          {/* Plans */}
          <div className="px-6 pb-6 grid grid-cols-2 gap-3">

            {/* Starter */}
            <div className="flex flex-col rounded-2xl border border-white/10 bg-white/3 p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Starter</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-black">6€</span>
                <span className="text-gray-500 text-xs mb-1">/mois</span>
              </div>
              <p className="text-[11px] text-gray-600 mb-4">Sans engagement</p>
              <ul className="flex-1 space-y-2 mb-5">
                {['5 sites', '100 générations / jour', 'Versions illimitées', 'Hébergement Adorable'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                    <Check className="w-3 h-3 text-gray-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade('starter')}
                disabled={loading !== null}
                className="w-full py-2.5 rounded-xl border border-white/15 hover:border-white/30 text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                    <Check className="w-3 h-3 text-violet-400 flex-shrink-0" />{f}
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

          <button onClick={onClose} className="w-full pb-5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Rester sur le plan gratuit
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
