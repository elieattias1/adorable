'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Zap, Crown, Check } from 'lucide-react'
import { TEMPLATES } from '@/lib/templates'

const SITE_TYPES = [
  { id: 'business',   label: 'Business',      emoji: '🏢', desc: 'Site vitrine pro' },
  { id: 'saas',       label: 'SaaS',          emoji: '⚡', desc: 'Landing produit' },
  { id: 'landing',    label: 'Landing',       emoji: '🚀', desc: 'Page de conversion' },
  { id: 'restaurant', label: 'Restaurant',    emoji: '🍽️', desc: 'Menu & réservation' },
  { id: 'bakery',     label: 'Boulangerie',   emoji: '🥐', desc: 'Artisanal & gourmand' },
  { id: 'wellness',   label: 'Bien-être',     emoji: '🌿', desc: 'Spa, yoga, santé' },
  { id: 'shop',       label: 'E-commerce',    emoji: '🛍️', desc: 'Boutique en ligne' },
  { id: 'portfolio',  label: 'Portfolio',     emoji: '🎨', desc: 'Présentation créative' },
  { id: 'blog',       label: 'Blog',          emoji: '✍️', desc: 'Articles & contenu' },
]

const DESCRIPTION_PLACEHOLDERS: Record<string, string> = {
  business:   'Ex : Cabinet de conseil en stratégie digitale, fondé en 2018, 12 collaborateurs, spécialisé PME industrielles.',
  saas:       'Ex : Outil de gestion de projet pour équipes remote. 3 plans : Starter, Pro, Enterprise. Intégration Slack & Notion.',
  landing:    'Ex : Formation en ligne "Photographe Freelance" — 6 semaines, 240 élèves, 97% de satisfaction. Lancement mars 2025.',
  restaurant: 'Ex : Brasserie traditionnelle lyonnaise, ouverte depuis 1962, spécialité quenelles et tablier de sapeur, 80 couverts.',
  bakery:     'Ex : Boulangerie artisanale fondée en 1987, spécialité baguette tradition Label Rouge et croissant AOP Charentes.',
  wellness:   'Ex : Institut de massage thaïlandais et ayurvédique, Paris 11e, 4 thérapeutes, soins 60/90/120 min, sur RDV.',
  shop:       'Ex : Créatrice de bijoux en argent recyclé, pièces uniques, livraison mondiale, 2 000 clientes fidèles.',
  portfolio:  'Ex : Directrice artistique spécialisée packaging luxe & cosmétique. 10 ans d\'expérience, clients : LVMH, L\'Oréal.',
  blog:       'Ex : Blog cuisine végétale & zéro déchet, 2 articles/semaine, newsletter 8 000 abonnés, recettes accessibles.',
}

interface NewSiteModalProps {
  open: boolean
  onClose: () => void
  onCreateSite: (name: string, type: string, description?: string) => Promise<{ id: string }>
  onPlanLimit: () => void
}

export default function NewSiteModal({ open, onClose, onCreateSite, onPlanLimit }: NewSiteModalProps) {
  const router = useRouter()
  const [name,           setName]          = useState('')
  const [type,           setType]          = useState('business')
  const [description,    setDescription]   = useState('')
  const [loading,        setLoading]       = useState(false)
  const [error,          setError]         = useState<string | null>(null)
  const [tab,            setTab]           = useState<'scratch' | 'template'>('scratch')
  const [selectedTpl,    setSelectedTpl]   = useState<string | null>(null)

  const reset = () => {
    setName(''); setType('business'); setDescription(''); setError(null)
    setTab('scratch'); setSelectedTpl(null)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const tpl = tab === 'template' ? TEMPLATES.find(t => t.id === selectedTpl) : null
      const site = await onCreateSite(
        name.trim(),
        tpl ? tpl.id : type,
        tpl ? `[TEMPLATE:${tpl.id}]${description.trim()}` : description.trim() || undefined,
      )
      reset()
      onClose()

      // If template selected, save schema directly via PUT
      if (tpl) {
        fetch('/api/generate', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: site.id,
            name: name.trim(),
            type: tpl.id,
            description: `[TEMPLATE:${tpl.id}]`,
            templateSchema: JSON.stringify(tpl.schema),
          }),
        }).catch(console.error)
        router.push(`/editor/${site.id}`)
      } else {
        const desc = description.trim()
        const initMsg = desc
          ? desc
          : `Crée un site web complet et professionnel pour "${name.trim()}".`
        router.push(`/editor/${site.id}?init=${encodeURIComponent(initMsg)}`)
      }
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

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-bold">Nouveau site</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Tab switcher */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              {([['scratch', 'Depuis zéro'], ['template', 'Depuis un template']] as const).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Template picker */}
            {tab === 'template' && (
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(tpl => (
                  <button key={tpl.id} type="button" onClick={() => setSelectedTpl(tpl.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${selectedTpl === tpl.id ? 'border-violet-500 bg-violet-950/40' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
                    <span className="text-2xl">{tpl.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{tpl.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{tpl.desc}</p>
                    </div>
                    {selectedTpl === tpl.id && (
                      <Check className="w-3.5 h-3.5 text-violet-400 ml-auto flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}

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

            {/* Type */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium">Type de site</label>
              <div className="grid grid-cols-3 gap-2">
                {SITE_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                      type === t.id
                        ? 'border-violet-500 bg-violet-950/40 text-white'
                        : 'border-white/8 bg-white/3 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {type === t.id && (
                      <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-violet-600 flex items-center justify-center">
                        <Check className="w-2 h-2" />
                      </div>
                    )}
                    <span className="text-xl">{t.emoji}</span>
                    <span className="text-xs font-semibold leading-tight">{t.label}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                Décris ton activité <span className="text-gray-600 font-normal">— plus c'est précis, meilleur sera le résultat</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={DESCRIPTION_PLACEHOLDERS[type] ?? 'Décris ton activité, tes produits/services, ton histoire…'}
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white outline-none transition-colors text-sm resize-none placeholder-gray-600"
              />
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
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
