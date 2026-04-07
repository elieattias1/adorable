'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import MarqueeSection from '@/components/MarqueeSection'
import Link from 'next/link'
import { Zap } from 'lucide-react'

// ─── Auth form ─────────────────────────────────────────────────────────────────
type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const [mode,     setMode]     = useState<Mode>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [sent,     setSent]     = useState(false)

  const supabase = createClient()
  const router   = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        })
        if (error) throw error
        setSent(true)
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        })
        if (error) throw error
        fetch('/api/auth/welcome', { method: 'POST' }).catch(() => {})
        setSent(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center px-6 md:px-12 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg">Adorable</span>
        </Link>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Auth form */}
        <div className="w-full md:w-[440px] flex-shrink-0 flex flex-col justify-center px-8 py-12">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-2">
                {mode === 'login' ? 'Bienvenue 👋' : mode === 'signup' ? 'Crée ton compte' : 'Mot de passe oublié'}
              </h1>
              <p className="text-gray-400 text-sm">
                {mode === 'login'
                  ? 'Connecte-toi pour accéder à tes sites.'
                  : mode === 'signup'
                  ? 'Un site offert, sans CB.'
                  : 'On t\'envoie un lien pour réinitialiser ton mot de passe.'}
              </p>
            </div>

            {sent ? (
              <div className="bg-green-950/50 border border-green-700 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">📬</div>
                <h3 className="font-bold mb-1">Vérifie tes emails !</h3>
                <p className="text-sm text-gray-400">
                  {mode === 'forgot'
                    ? <>Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.</>
                    : <>Un lien de confirmation t'a été envoyé à <strong>{email}</strong>.</>}
                </p>
                {mode === 'forgot' && (
                  <button onClick={() => { setSent(false); setMode('login') }} className="mt-4 text-xs text-violet-400 hover:underline">
                    Retour à la connexion
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Google SSO — hidden in forgot mode */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  style={{ display: mode === 'forgot' ? 'none' : undefined }}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuer avec Google
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500">ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="toi@exemple.com"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white outline-none transition-colors text-sm"
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Mot de passe</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white outline-none transition-colors text-sm"
                    />
                  </div>
                )}

                {error && (
                  <div className="bg-red-950/60 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : mode === 'forgot' ? 'Envoyer le lien' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                </button>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  {mode === 'login' ? (
                    <button type="button" onClick={() => { setError(null); setSent(false); setMode('forgot') }} className="hover:text-white transition-colors">
                      Mot de passe oublié ?
                    </button>
                  ) : <span />}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="hover:text-white transition-colors"
                  >
                    {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà inscrit ? Se connecter'}
                  </button>
                </div>
              </form>
            )}

            <p className="text-center text-xs text-gray-600 mt-6">
              En continuant, tu acceptes nos{' '}
              <a href="/terms" className="text-gray-400 hover:underline">CGU</a>
              {' '}et notre{' '}
              <a href="/privacy" className="text-gray-400 hover:underline">Politique de confidentialité</a>.
            </p>
          </div>
        </div>

        {/* Right: Marquee showcase (desktop only) */}
        <div className="hidden md:flex flex-1 flex-col justify-center border-l border-white/5 overflow-hidden relative bg-gray-950">
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gray-950 to-transparent z-10 pointer-events-none" />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-950 to-transparent z-10 pointer-events-none" />

          <MarqueeSection />

          {/* Center overlay text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
            <div className="bg-gray-950/70 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/8 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Propulsé par l'IA</p>
              <h2 className="text-2xl font-black mb-1">
                Décris. <span className="gradient-text">Adorable construit.</span>
              </h2>
              <p className="text-xs text-gray-500">Restaurant, portfolio, SaaS, boutique…</p>
              <div className="flex gap-6 mt-5 pt-4 border-t border-white/8 justify-center">
                {[['< 1 min', 'pour créer'], ['∞', 'modifs'], ['0€', 'pour commencer']].map(([v, l]) => (
                  <div key={v} className="text-center">
                    <div className="text-base font-black gradient-text">{v}</div>
                    <div className="text-[10px] text-gray-500">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
