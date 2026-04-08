'use client'

import { ArrowLeft, Globe, Monitor, Smartphone, History, Loader2, ExternalLink, PanelRightClose, PanelRightOpen, Link2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

type DeployPhase = 'idle' | 'generating' | 'building' | 'ready' | 'error'

interface EditorTopBarProps {
  siteName: string
  siteId: string
  versionCount: number
  previewMode: 'desktop' | 'mobile'
  onPreviewToggle: () => void
  onShowVersions: () => void
  onDeploy: () => void
  isDeploying: boolean
  deployPhase?: DeployPhase
  deployedUrl?: string | null
  showChat: boolean
  onToggleChat: () => void
}

export default function EditorTopBar({
  siteName,
  siteId,
  versionCount,
  previewMode,
  onPreviewToggle,
  onShowVersions,
  onDeploy,
  isDeploying,
  deployPhase = 'idle',
  deployedUrl,
  showChat,
  onToggleChat,
}: EditorTopBarProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const copyPublicUrl = async () => {
    const url = deployedUrl ?? `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${siteId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="flex items-center justify-between gap-3 px-4 h-14 border-b border-gray-200 bg-white flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.push(`/dashboard/sites/${siteId}`)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <span className="text-gray-300">/</span>

        <span className="font-semibold text-sm truncate max-w-[160px] text-gray-900">{siteName}</span>
      </div>

      {/* Center: preview toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => previewMode === 'mobile' && onPreviewToggle()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            previewMode === 'desktop'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bureau</span>
        </button>
        <button
          onClick={() => previewMode === 'desktop' && onPreviewToggle()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            previewMode === 'mobile'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mobile</span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Version count */}
        <button
          onClick={onShowVersions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
        >
          <History className="w-3.5 h-3.5" />
          <span>{versionCount} version{versionCount !== 1 ? 's' : ''}</span>
        </button>

        {/* Copy public URL — only when deployed */}
        {deployedUrl && (
          <button
            onClick={copyPublicUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            title="Copier le lien public"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copié !' : 'Lien public'}</span>
          </button>
        )}

        {/* Deployed link */}
        {deployedUrl && (
          <a
            href={deployedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 hover:text-green-300 hover:bg-green-950/30 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voir en ligne</span>
          </a>
        )}

        {/* Toggle chat */}
        <button
          onClick={onToggleChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
          title={showChat ? 'Masquer le chat' : 'Afficher le chat'}
        >
          {showChat
            ? <PanelRightClose className="w-4 h-4" />
            : <PanelRightOpen  className="w-4 h-4" />
          }
        </button>

        <ThemeToggle />

        {/* Deploy button + phase indicator */}
        <div className="flex items-center gap-2">
          {isDeploying && deployPhase !== 'idle' && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {/* Progress steps */}
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${deployPhase === 'generating' ? 'bg-violet-400 animate-pulse' : (deployPhase === 'building' || deployPhase === 'ready') ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span className={deployPhase === 'generating' ? 'text-violet-600' : (deployPhase === 'building' || deployPhase === 'ready') ? 'text-gray-400 line-through' : 'text-gray-400'}>Code</span>
              </div>
              <span className="text-gray-400">→</span>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${deployPhase === 'building' ? 'bg-amber-400 animate-pulse' : deployPhase === 'ready' ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span className={deployPhase === 'building' ? 'text-amber-600' : deployPhase === 'ready' ? 'text-gray-400 line-through' : 'text-gray-400'}>Build</span>
              </div>
              <span className="text-gray-400">→</span>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${deployPhase === 'ready' ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span className={deployPhase === 'ready' ? 'text-green-600' : 'text-gray-400'}>Live</span>
              </div>
              {deployPhase === 'building' && (
                <span className="text-gray-400 text-[10px]">(~2 min)</span>
              )}
            </div>
          )}
          <button
            onClick={onDeploy}
            disabled={isDeploying}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg disabled:opacity-60 text-white text-xs font-semibold transition-all ${
              deployPhase === 'error'
                ? 'bg-red-700 hover:bg-red-600'
                : 'bg-green-700 hover:bg-green-600'
            }`}
          >
            {isDeploying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            {deployPhase === 'generating' ? 'Génération…'
              : deployPhase === 'building' ? 'Build en cours…'
              : deployPhase === 'error' ? 'Réessayer'
              : isDeploying ? 'Déploiement…'
              : 'Déployer'}
          </button>
        </div>
      </div>
    </header>
  )
}
