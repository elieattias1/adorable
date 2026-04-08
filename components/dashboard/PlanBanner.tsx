'use client'

import { Zap, X } from 'lucide-react'
import { useState } from 'react'

interface PlanBannerProps {
  onUpgrade: () => void
}

export default function PlanBanner({ onUpgrade }: PlanBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="relative flex items-center gap-4 bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200 rounded-xl px-4 py-3 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
        <Zap className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-950">Tu utilises la version gratuite</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Limite : 1 site, 5 versions. Passe à Pro pour des sites illimités, versions illimitées et domaine personnalisé.
        </p>
      </div>
      <button
        onClick={onUpgrade}
        className="flex-shrink-0 px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all"
      >
        Passer à Pro — 12€/mois
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
