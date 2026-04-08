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
import { Zap, Plus, LogOut, Crown, Loader2, Settings2, User, CreditCard, Check, Eye, EyeOff, ExternalLink, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { isAdminUserClient } from '@/lib/admin'
import { Toast, type ToastState } from '@/components/ui/Toast'

function UpgradeChecker({ onUpgraded }: { onUpgraded: () => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      onUpgraded()
      router.replace('/dashboard')
    }
  }, [searchParams, router, onUpgraded])
  return null
}

// ─── Plan definitions ──────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: '',
    features: ['1 site', '20 générations IA / jour', 'Sous-domaine Adorable', '5 versions par site'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '6€',
    period: '/mois',
    features: ['5 sites', '100 générations IA / jour', 'Sous-domaine Adorable', 'Versions illimitées'],
    cta: 'Passer à Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '19€',
    period: '/mois',
    features: ['Sites illimités', 'IA illimitée', 'Domaines personnalisés', 'Versions illimitées', 'Support prioritaire'],
    highlighted: true,
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
      <div className="bg-gray-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="font-bold text-base">Mon profil</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Auth section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Compte
            </h3>
            <div className="bg-gray-900 border border-white/8 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                <div className="px-3.5 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-gray-300">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/4 border border-white/8 focus:border-violet-500/60 text-sm outline-none text-white placeholder-gray-600 pr-10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <CreditCard className="w-3.5 h-3.5" /> Abonnement
            </h3>

            {/* Paid user: show current plan + portal CTA */}
            {isPro && !isAdmin && (
              <div className="bg-violet-950/30 border border-violet-700/30 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Plan actuel</p>
                  <p className="font-bold text-sm capitalize">{currentPlan} <span className="text-gray-500 font-normal">— actif</span></p>
                  <p className="text-[11px] text-gray-500 mt-1">Modifie, change ou annule ton abonnement directement via Stripe.</p>
                </div>
                <button
                  onClick={openPortal}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-sm font-semibold transition-all whitespace-nowrap"
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
                        ? 'border-green-600/50 bg-green-950/20'
                        : plan.highlighted
                        ? 'border-violet-600/50 bg-violet-950/20'
                        : 'border-white/8 bg-white/3'
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
                        <li key={f} className="flex items-start gap-1.5 text-xs text-gray-400">
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
                      <div className="w-full py-2 rounded-lg text-xs font-bold text-center text-green-500 bg-green-900/30">
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
                        className="w-full py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-white border border-white/8 hover:border-white/20 transition-all"
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
      const res = await fetch('/api/admin/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) throw new Error('Failed')
      setToast({ msg: `Plan changé → ${plan}`, type: 'success' })
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      setToast({ msg: 'Erreur changement de plan', type: 'error' })
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
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Suspense fallback={null}>
        <UpgradeChecker onUpgraded={() => setToast({ msg: 'Bienvenue sur Pro ! 🎉 Ton abonnement est actif.', type: 'success' })} />
      </Suspense>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg">Adorable</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Plan badge */}
          {profile && !isAdmin && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isPro
                ? 'bg-violet-950/50 border-violet-700/50 text-violet-300'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}>
              {isPro && <Crown className="w-3 h-3" />}
              {isPro ? 'Pro' : 'Gratuit'}
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-amber-950/50 border border-amber-700/40 rounded-lg px-2 py-1">
              <Settings2 className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Admin</span>
            </div>
          )}

          <ThemeToggle />

          {/* Avatar — click to open profile */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-violet-500/60 transition-all"
            title="Mon profil"
          >
            {initials}
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all text-sm"
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
              <div key={i} className="bg-gray-900 rounded-xl overflow-hidden border border-white/5 animate-pulse">
                <div className="h-36 bg-gray-800" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-800 rounded w-1/2" />
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/4 border border-white/8 text-xs text-gray-400 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all">
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
              className="flex flex-col items-center justify-center gap-2 h-[172px] rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/50 text-gray-600 hover:text-violet-400 transition-all group"
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
