'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, Lock } from 'lucide-react'
import { Suspense } from 'react'

function UnlockForm() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await fetch('/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      const redirect = searchParams.get('redirect') || '/'
      router.replace(redirect)
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
      {/* Blurred background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3b0764_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#831843_0%,_transparent_60%)]" />
        <div className="absolute inset-0 backdrop-blur-2xl" />
        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
      </div>

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-black text-xl text-white">Adorable</span>
          </div>

          {/* Lock icon */}
          <div className="flex justify-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <h1 className="text-center text-lg font-bold text-white mb-1">Accès privé</h1>
          <p className="text-center text-sm text-gray-500 mb-6">Entrez le mot de passe pour continuer</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              placeholder="Mot de passe"
              autoFocus
              className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-600 text-sm outline-none transition-all ${
                error
                  ? 'border-red-500/60 focus:border-red-500'
                  : 'border-white/10 focus:border-violet-500/60'
              }`}
            />
            {error && (
              <p className="text-xs text-red-400 text-center">Mot de passe incorrect</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            >
              {loading ? 'Vérification…' : 'Entrer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function UnlockPage() {
  return (
    <Suspense>
      <UnlockForm />
    </Suspense>
  )
}
