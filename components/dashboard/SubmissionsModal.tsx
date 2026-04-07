'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Mail, Inbox, CheckCheck } from 'lucide-react'

interface Submission {
  id: string
  form_name: string
  data: Record<string, string> | null
  // legacy fixed columns
  name?: string | null
  email?: string | null
  message?: string | null
  read_at: string | null
  created_at: string
}

interface SubmissionsModalProps {
  siteId: string | null
  siteName: string
  open: boolean
  onClose: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SubmissionsModal({ siteId, siteName, open, onClose }: SubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    if (!open || !siteId) return
    setLoading(true)
    fetch(`/api/site/${siteId}/submissions`)
      .then(r => r.json())
      .then(d => setSubmissions(d.submissions ?? []))
      .finally(() => setLoading(false))
  }, [open, siteId])

  const markAllRead = async () => {
    if (!siteId) return
    // Mark each unread submission via PATCH
    const unread = submissions.filter(s => !s.read_at)
    await Promise.all(unread.map(s =>
      fetch(`/api/site/${siteId}/submissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: s.id, read: true }),
      })
    ))
    setSubmissions(prev => prev.map(s => ({ ...s, read_at: s.read_at ?? new Date().toISOString() })))
  }

  const unreadCount = submissions.filter(s => !s.read_at).length

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[80vh] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in fade-in-0 zoom-in-95">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
            <div>
              <Dialog.Title className="text-sm font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-400" />
                Messages — {siteName}
              </Dialog.Title>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/8 transition-all"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Tout marquer lu
                </button>
              )}
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="w-10 h-10 text-gray-700 mb-3" />
                <p className="text-sm text-gray-500 font-medium">Aucun message pour l'instant</p>
                <p className="text-xs text-gray-600 mt-1">Les soumissions de formulaire apparaîtront ici</p>
              </div>
            ) : (
              submissions.map(sub => (
                <div
                  key={sub.id}
                  className={`rounded-xl border p-4 transition-all ${
                    !sub.read_at
                      ? 'border-violet-700/40 bg-violet-950/20'
                      : 'border-white/8 bg-white/3'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {!sub.read_at && (
                        <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-gray-400 capitalize">{sub.form_name}</span>
                    </div>
                    <span className="text-[11px] text-gray-600">{formatDate(sub.created_at)}</span>
                  </div>

                  <dl className="space-y-1.5">
                    {Object.entries(sub.data ?? {
                      ...(sub.name    ? { nom: sub.name }       : {}),
                      ...(sub.email   ? { email: sub.email }    : {}),
                      ...(sub.message ? { message: sub.message }: {}),
                    })
                      .filter(([k]) => k !== '_honeypot')
                      .map(([key, val]) => (
                        <div key={key} className="flex gap-3 text-xs">
                          <dt className="text-gray-500 capitalize flex-shrink-0 w-20 truncate">{key}</dt>
                          <dd className="text-gray-200 break-words min-w-0">{String(val)}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
