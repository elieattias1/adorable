'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Globe, Calendar, PenLine, LayoutDashboard, Mail, ExternalLink } from 'lucide-react'
import type { Tables } from '@/types/supabase'

type Site = Tables<'sites'>

const TYPE_COLORS: Record<string, string> = {
  restaurant: 'from-orange-500 to-red-600',
  portfolio:  'from-violet-500 to-purple-700',
  shop:       'from-emerald-400 to-teal-600',
  saas:       'from-blue-500 to-cyan-600',
  blog:       'from-pink-500 to-rose-600',
  business:   'from-indigo-500 to-blue-700',
  landing:    'from-yellow-500 to-orange-600',
  blank:      'from-gray-600 to-gray-700',
}

const TYPE_EMOJIS: Record<string, string> = {
  restaurant: '🍽️',
  portfolio:  '🎨',
  shop:       '🛍️',
  saas:       '⚡',
  blog:       '✍️',
  business:   '🏢',
  landing:    '🚀',
  blank:      '📄',
}

// Scale used for the iframe thumbnail
// Container is ~280px wide, scale 0.25 → site renders at ~1120px viewport
const SCALE = 0.22

interface SiteCardProps {
  site: Site & { unread_submissions?: number }
  onDelete: (id: string) => void
  onViewSubmissions?: (siteId: string) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function isReactCode(html: string | null): boolean {
  if (!html || html.length < 10) return false
  const t = html.trim()
  return !t.startsWith('{') && !t.startsWith('[')
}

export default function SiteCard({ site, onDelete, onViewSubmissions }: SiteCardProps) {
  const router   = useRouter()
  const [deleting,  setDeleting]  = useState(false)
  const [hovering,  setHovering]  = useState(false)
  const [iframeOk,  setIframeOk]  = useState(false)

  const color   = TYPE_COLORS[site.type] ?? TYPE_COLORS.blank
  const emoji   = TYPE_EMOJIS[site.type] ?? '📄'
  const hasCode = isReactCode(site.html)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Supprimer "${site.name}" ?`)) return
    setDeleting(true)
    onDelete(site.id)
  }

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg hover:shadow-gray-200 hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div
        onClick={() => router.push(`/dashboard/sites/${site.id}`)}
        className="h-36 relative overflow-hidden cursor-pointer"
      >
        {/* Gradient fallback — always rendered underneath */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} flex items-center justify-center`}>
          <span className="text-4xl opacity-80">{emoji}</span>
        </div>

        {/* Iframe preview for sites with generated code */}
        {hasCode && (
          <div
            className="absolute inset-0"
            style={{ opacity: iframeOk ? 1 : 0, transition: 'opacity 0.3s ease' }}
          >
            <iframe
              src={`/s/${site.id}?preview=1`}
              title="preview"
              loading="lazy"
              onLoad={() => setIframeOk(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `calc(100% / ${SCALE})`,
                height: `calc(144px / ${SCALE})`,
                transform: `scale(${SCALE})`,
                transformOrigin: 'top left',
                border: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${hovering ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-xs font-semibold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" /> Voir le dashboard
          </span>
        </div>

        {/* Published badge */}
        {site.is_published && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-900/80 backdrop-blur text-green-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <Globe className="w-2.5 h-2.5" />
            En ligne
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div
            onClick={() => router.push(`/editor/${site.id}`)}
            className="min-w-0 cursor-pointer flex-1"
          >
            <h3 className="font-semibold text-sm truncate">{site.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <Calendar className="w-3 h-3" />
                {formatDate(site.updated_at)}
              </span>
              {!!site.unread_submissions && (
                <button
                  onClick={e => { e.stopPropagation(); onViewSubmissions?.(site.id) }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full hover:bg-violet-100 transition-colors"
                >
                  <Mail className="w-2.5 h-2.5" />
                  {site.unread_submissions} nouveau{site.unread_submissions > 1 ? 'x' : ''}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {onViewSubmissions && (
              <button
                onClick={e => { e.stopPropagation(); onViewSubmissions(site.id) }}
                className={`p-1.5 rounded-lg transition-all ${
                  site.unread_submissions
                    ? 'text-violet-600 hover:bg-violet-50 opacity-100'
                    : `text-gray-400 hover:text-violet-600 hover:bg-violet-50 ${hovering ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`
                }`}
                title="Formulaires"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
            )}

            {site.deployed_url && (
              <a
                href={site.deployed_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className={`p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all ${hovering ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                title="Voir le site"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={() => router.push(`/editor/${site.id}`)}
              className={`p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all ${hovering ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              title="Éditer"
            >
              <PenLine className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ${hovering ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              title="Supprimer"
            >
              {deleting
                ? <div className="w-3.5 h-3.5 border border-gray-600 border-t-white/50 rounded-full animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
