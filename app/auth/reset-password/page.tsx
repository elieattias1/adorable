'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Zap } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Minimum 6 caractères'); return }
    if (password !== password2) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.replace('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg text-white">Adorable</span>
        </div>

        <div className="bg-gray-900 border border-white/10 rounded-2xl p-8">
          <h1 className="text-lg font-bold text-white mb-1">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-500 mb-6">Choisis un nouveau mot de passe pour ton compte.</p>

          {done ? (
            <div className="text-center py-4">
              <div className="text-green-400 font-semibold mb-1">✓ Mot de passe mis à jour</div>
              <p className="text-sm text-gray-500">Redirection…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Nouveau mot de passe"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-white placeholder-gray-600 text-sm outline-none transition-all"
              />
              <input
                type="password"
                value={password2}
                onChange={e => { setPassword2(e.target.value); setError('') }}
                placeholder="Confirmer le mot de passe"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-white placeholder-gray-600 text-sm outline-none transition-all"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading || !password || !password2}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold text-sm transition-all"
              >
                {loading ? 'Mise à jour…' : 'Mettre à jour'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
