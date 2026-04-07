'use client'

import { X, RotateCcw, Lock, Clock } from 'lucide-react'

export interface Version {
  id: string
  note: string | null
  created_at: string
}

interface VersionPanelProps {
  versions: Version[]
  isPro: boolean
  onRestore: (versionId: string) => void
  onClose: () => void
  onUpgrade: () => void
}

const FREE_VERSION_LIMIT = 5

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function VersionPanel({ versions, isPro, onRestore, onClose, onUpgrade }: VersionPanelProps) {
  return (
    <div className="absolute inset-y-0 right-0 w-72 bg-gray-900 border-l border-white/8 flex flex-col z-20 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold">Versions</span>
          <span className="text-xs text-gray-600">({versions.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {versions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-600 text-sm">
            Aucune version sauvegardée
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {versions.map((v, i) => {
              const isLocked = !isPro && i >= FREE_VERSION_LIMIT
              return (
                <li key={v.id} className={`px-4 py-3 ${isLocked ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isLocked && <Lock className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                        <p className="text-xs font-medium text-white truncate">
                          {v.note || `Version ${versions.length - i}`}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">{formatDate(v.created_at)}</p>
                    </div>
                    {isLocked ? (
                      <button
                        onClick={onUpgrade}
                        className="flex-shrink-0 text-[10px] px-2 py-1 rounded bg-yellow-900/40 text-yellow-500 border border-yellow-700/40 hover:bg-yellow-900/60 transition-colors"
                      >
                        Pro
                      </button>
                    ) : (
                      <button
                        onClick={() => onRestore(v.id)}
                        className="flex-shrink-0 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restaurer
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Pro upsell if free */}
      {!isPro && versions.length >= FREE_VERSION_LIMIT && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/8">
          <p className="text-xs text-gray-400 mb-2">
            Les versions au-delà de {FREE_VERSION_LIMIT} sont réservées au plan Pro.
          </p>
          <button
            onClick={onUpgrade}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all"
          >
            Passer à Pro
          </button>
        </div>
      )}
    </div>
  )
}
