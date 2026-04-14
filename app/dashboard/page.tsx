'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useSites, useProfile } from '@/hooks/useSites'
import SiteCard from '@/components/dashboard/SiteCard'
import PlanBanner from '@/components/dashboard/PlanBanner'
import NewSiteModal, { PaywallModal } from '@/components/dashboard/NewSiteModal'
import SubmissionsModal from '@/components/dashboard/SubmissionsModal'
import { Zap, Plus, LogOut, Crown, Loader2, Settings2, User, CreditCard, Check, Eye, EyeOff, ExternalLink, X, Building2, Webhook, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { isAdminUserClient } from '@/lib/admin'
import { Toast, type ToastState } from '@/components/ui/Toast'

function UpgradeChecker({ onUpgraded, onOpenProfile }: { onUpgraded: () => void; onOpenProfile: () => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      onUpgraded()
      router.replace('/dashboard')
    }
    if (searchParams.get('profile') === '1') {
      onOpenProfile()
      router.replace('/dashboard')
    }
  }, [searchParams, router, onUpgraded, onOpenProfile])
  return null
}

// ─── Plan definitions ──────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: '',
    features: ['1 site', '5 générations IA / jour', 'Sous-domaine Adorable'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '49€',
    period: '/mois',
    features: ['5 sites', '100 générations IA / jour', 'Domaine personnalisé', 'Commandes & boutique', 'Versions illimitées'],
    cta: 'Passer à Starter',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '89€',
    period: '/mois',
    features: ['Sites illimités', 'IA illimitée', 'Domaine personnalisé', 'Commandes & boutique', 'Support prioritaire'],
    cta: 'Passer à Pro',
  },
]

// ─── Profile modal ─────────────────────────────────────────────────────────────
function ProfileModal({
  onClose,
  userEmail,
  profile,
  isAdmin,
  startCheckout,
  openPortal,
  switchPlan,
  switchingPlan,
  onToast,
}: {
  onClose: () => void
  userEmail: string
  profile: any
  isAdmin: boolean
  startCheckout: (plan?: string) => Promise<void>
  openPortal: () => Promise<void>
  switchPlan: (plan: 'free' | 'starter' | 'pro') => Promise<void>
  switchingPlan: boolean
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  const supabase = createClient()
  const [newPassword,    setNewPassword]    = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { onToast('Mot de passe trop court (min 6 caractères)', 'error'); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) onToast(error.message, 'error')
    else { onToast('Mot de passe mis à jour', 'success'); setNewPassword('') }
    setSavingPassword(false)
  }

  const currentPlan = profile?.plan ?? 'free'
  const isPro = currentPlan === 'pro' || currentPlan === 'starter'

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-base text-gray-950">Mon profil</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Auth section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Compte
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                <div className="px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700">
                  {userEmail || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Changer le mot de passe</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
                      placeholder="Minimum 6 caractères"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 focus:border-violet-500 text-sm outline-none text-gray-900 placeholder-gray-400 pr-10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    disabled={savingPassword || !newPassword}
                    className="px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Billing section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <CreditCard className="w-3.5 h-3.5" /> Abonnement
            </h3>

            {/* Paid user: show current plan + portal CTA */}
            {isPro && !isAdmin && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Plan actuel</p>
                  <p className="font-bold text-sm capitalize text-gray-900">{currentPlan} <span className="text-gray-500 font-normal">— actif</span></p>
                  <p className="text-[11px] text-gray-500 mt-1">Modifie, change ou annule ton abonnement directement via Stripe.</p>
                </div>
                <button
                  onClick={openPortal}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 transition-all whitespace-nowrap"
                >
                  Gérer <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLANS.map((plan: any) => {
                const isCurrent = currentPlan === plan.id
                // Paid users change plans via portal — only free users use checkout
                const canCheckout = !isAdmin && !isCurrent && plan.cta && currentPlan === 'free'
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border p-4 flex flex-col gap-3 ${
                      isCurrent
                        ? 'border-green-300 bg-green-50'
                        : plan.highlighted
                        ? 'border-violet-300 bg-violet-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-700 text-white whitespace-nowrap">
                        Plan actuel
                      </span>
                    )}
                    {!isCurrent && plan.highlighted && currentPlan === 'free' && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white whitespace-nowrap">
                        Recommandé
                      </span>
                    )}

                    <div>
                      <p className="text-sm font-bold">{plan.name}</p>
                      <p className="text-xl font-black mt-0.5">
                        {plan.price}<span className="text-xs font-normal text-gray-500">{plan.period}</span>
                      </p>
                    </div>

                    <ul className="flex-1 space-y-1.5">
                      {plan.features.map((f: string) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-gray-500">
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isAdmin ? (
                      <button
                        disabled={isCurrent || switchingPlan}
                        onClick={() => switchPlan(plan.id as 'free' | 'pro' | 'starter')}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                          isCurrent ? 'bg-green-900/40 text-green-400 cursor-default' : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        {isCurrent ? 'Actif' : switchingPlan ? '…' : 'Activer (admin)'}
                      </button>
                    ) : isCurrent ? (
                      <div className="w-full py-2 rounded-lg text-xs font-bold text-center text-green-700 bg-green-100">
                        Plan actuel
                      </div>
                    ) : canCheckout ? (
                      <button
                        onClick={() => startCheckout(plan.id)}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                          plan.highlighted
                            ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white'
                            : 'bg-white/8 hover:bg-white/12 text-white'
                        }`}
                      >
                        {plan.cta}
                      </button>
                    ) : !isAdmin && !isCurrent && isPro ? (
                      <button
                        onClick={openPortal}
                        className="w-full py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        Changer via Stripe
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter()
  const supabase = createClient()

  const { sites, loading, createSite, deleteSite } = useSites()
  const { profile, startCheckout, openPortal }      = useProfile()

  const [showProfile,   setShowProfile]   = useState(false)
  const [showNewSite,   setShowNewSite]   = useState(false)
  const [showPaywall,   setShowPaywall]   = useState(false)
  const [submissionsSite, setSubmissionsSite] = useState<{ id: string; name: string } | null>(null)
  const [toast,         setToast]         = useState<ToastState>(null)
  const [userEmail,     setUserEmail]     = useState<string>('')
  const [userId,        setUserId]        = useState<string>('')
  const [loggingOut,    setLoggingOut]    = useState(false)
  const [switchingPlan, setSwitchingPlan] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
      if (user?.id)    setUserId(user.id)
    })
  }, [])

  const isAdmin = userId ? isAdminUserClient(userId) : false

  const switchPlan = async (plan: 'free' | 'starter' | 'pro') => {
    setSwitchingPlan(true)
    try {
      const res  = await fetch('/api/admin/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setToast({ msg: `Plan changé → ${plan}`, type: 'success' })
      setTimeout(() => window.location.reload(), 1000)
    } catch (e: any) {
      setToast({ msg: `Erreur: ${e.message}`, type: 'error' })
    } finally {
      setSwitchingPlan(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '?'
  const isPro    = profile?.plan === 'pro' || profile?.plan === 'starter'

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 flex flex-col">
      <Suspense fallback={null}>
        <UpgradeChecker
          onUpgraded={() => setToast({ msg: 'Bienvenue sur Pro ! 🎉 Ton abonnement est actif.', type: 'success' })}
          onOpenProfile={() => setShowProfile(true)}
        />
      </Suspense>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gray-950 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-gray-950">adorable</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Plan badge */}
          {profile && !isAdmin && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isPro
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}>
              {isPro && <Crown className="w-3 h-3" />}
              {isPro ? 'Pro' : 'Gratuit'}
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
              <Settings2 className="w-3 h-3 text-amber-600" />
              <span className="text-xs font-semibold text-amber-600">Admin</span>
            </div>
          )}

          {isAdmin && (
            <a href="/dashboard/crm"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all text-sm"
              title="CRM Leads">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">CRM</span>
            </a>
          )}

          <ThemeToggle />

          {/* Avatar — click to open profile */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-violet-500/60 transition-all"
            title="Mon profil"
          >
            {initials}
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all text-sm"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 px-6 md:px-8 py-8 max-w-6xl mx-auto w-full">
        {profile && !isPro && !isAdmin && (
          <PlanBanner onUpgrade={startCheckout} />
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Mes sites</h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">
                {sites.length === 0
                  ? 'Aucun site pour l\'instant'
                  : `${sites.length} site${sites.length > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowNewSite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-950/40"
          >
            <Plus className="w-4 h-4" /> Nouveau site
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse">
                <div className="h-36 bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 border border-violet-500/20 flex items-center justify-center mb-6">
              <Zap className="w-9 h-9 text-violet-400" />
            </div>
            <h2 className="text-2xl font-black mb-2">Bienvenue sur Adorable !</h2>
            <p className="text-gray-500 text-sm mb-2 max-w-sm leading-relaxed">
              Décris ton projet en quelques mots — Adorable génère un site complet en quelques secondes grâce à l'IA.
            </p>
            <p className="text-gray-600 text-xs mb-8">Restaurant, portfolio, boutique, SaaS, blog…</p>
            <button
              onClick={() => setShowNewSite(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-950/40"
            >
              <Plus className="w-4 h-4" /> Créer mon premier site
            </button>
            <div className="flex gap-3 mt-10 flex-wrap justify-center">
              {[['🍽️','Restaurant'],['🎨','Portfolio'],['🛍️','Boutique'],['⚡','SaaS'],['✍️','Blog'],['🏢','Business']].map(([e,l]) => (
                <button key={l} onClick={() => setShowNewSite(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-500 hover:text-gray-900 hover:border-violet-400 hover:bg-violet-50 transition-all">
                  <span>{e}</span> {l}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sites.map(site => (
              <SiteCard
                key={site.id}
                site={site}
                onDelete={async (id) => {
                  await deleteSite(id)
                  setToast({ msg: 'Site supprimé', type: 'success' })
                }}
                onViewSubmissions={id => setSubmissionsSite({ id, name: site.name })}
              />
            ))}
            <button
              onClick={() => setShowNewSite(true)}
              className="flex flex-col items-center justify-center gap-2 h-[172px] rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-400 text-gray-400 hover:text-violet-500 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Nouveau site</span>
            </button>
          </div>
        )}
      </main>

      {/* Profile modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          userEmail={userEmail}
          profile={profile}
          isAdmin={isAdmin}
          startCheckout={startCheckout}
          openPortal={openPortal}
          switchPlan={switchPlan}
          switchingPlan={switchingPlan}
          onToast={(msg, type) => setToast({ msg, type })}
        />
      )}

      <SubmissionsModal
        siteId={submissionsSite?.id ?? null}
        siteName={submissionsSite?.name ?? ''}
        open={!!submissionsSite}
        onClose={() => setSubmissionsSite(null)}
      />

      <NewSiteModal
        open={showNewSite}
        onClose={() => setShowNewSite(false)}
        onCreateSite={createSite}
        onPlanLimit={() => setShowPaywall(true)}
      />
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={startCheckout}
      />

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
