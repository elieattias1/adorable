'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Search, Mail, BarChart2, Settings, ArrowLeft,
  Globe, Globe2, PenLine, ExternalLink, Copy, Trash2, CheckCircle2,
  Circle, RefreshCw, Eye, MessageSquare, Clock, TrendingUp, Shield,
  AlertTriangle, Loader2, Check, X, Puzzle, ChevronDown, ChevronUp, Zap, Rocket, History, LogOut,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createClient } from '@/lib/supabase-browser'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Site {
  id: string; name: string; type: string; html: string | null
  deployed_url: string | null; is_published: boolean
  view_count: number; created_at: string; updated_at: string
}
interface Submission { id: string; form_name: string; data: Record<string, string> | null; name: string | null; email: string | null; message: string | null; read: boolean | null; read_at: string | null; created_at: string }
interface DashData { site: Site; versionCount: number; submissionCount: number }

const fmt     = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtTime = (d: string) => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Toast({ msg, type, onDismiss }: { msg: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t) }, [onDismiss])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-4 fade-in-0 max-w-sm ${type === 'success' ? 'bg-green-950 border-green-700 text-green-300' : 'bg-red-950 border-red-700 text-red-300'}`}>
      {type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />} {msg}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = 'violet' }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  const c: Record<string, string> = { violet: 'bg-violet-500/10 text-violet-400', green: 'bg-green-500/10 text-green-400', blue: 'bg-blue-500/10 text-blue-400', pink: 'bg-pink-500/10 text-pink-400' }
  return (
    <div className="bg-gray-900 border border-white/8 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c[color]}`}><Icon className="w-3.5 h-3.5" /></div>
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-black">{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Sidebar sections config ───────────────────────────────────────────────────

const SECTIONS = [
  { id: 'overview',      label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'seo',           label: 'SEO',             icon: Search },
  { id: 'forms',         label: 'Formulaires',     icon: Mail },
  { id: 'history',       label: 'Historique',      icon: History },
  { id: 'analytics',     label: 'Analytiques',     icon: BarChart2 },
  { id: 'integrations',  label: 'Intégrations',    icon: Puzzle },
  { id: 'settings',      label: 'Paramètres',      icon: Settings },
]


// ─── Section: Overview ─────────────────────────────────────────────────────────

function OverviewSection({ data, submissions }: { data: DashData; submissions: Submission[] }) {
  const { site, versionCount, submissionCount } = data
  const unread = submissions.filter(s => !s.read_at).length

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${site.is_published ? 'bg-green-950/20 border-green-900/40' : 'bg-gray-900 border-white/8'}`}>
        {site.is_published
          ? <><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /><div><div className="font-semibold text-green-300">En ligne</div><a href={site.deployed_url!} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:text-green-500 transition-colors">{site.deployed_url?.replace('https://', '')}</a></div></>
          : <><Circle className="w-4 h-4 text-gray-600 flex-shrink-0" /><div className="font-semibold text-gray-400">Non publié — cliquez sur "Déployer" pour mettre en ligne</div></>

        }
      </div>

      {/* Preview + stats side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Scaled iframe preview */}
        <div className="xl:col-span-3 bg-gray-900 border border-white/8 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6 bg-gray-950/50">
            <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/50" /></div>
            <div className="flex-1 flex items-center gap-1.5 bg-gray-800/60 rounded-md px-3 py-1 mx-2 text-xs text-gray-500 min-w-0">
              <Globe className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{site.deployed_url || `localhost:3000/s/${site.id}`}</span>
            </div>
            <a href={`/s/${site.id}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>
          </div>
          <div className="relative overflow-hidden" style={{ height: '380px', background: '#0f0f13' }}>
            <iframe
              src={`/s/${site.id}?preview=1`}
              title="Aperçu du site"
              style={{ width: 'calc(100% / 0.41)', height: 'calc(380px / 0.41)', transform: 'scale(0.41)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Eye}           label="Visites"   value={site.view_count}   sub="Total cumulé"                              color="violet" />
            <StatCard icon={MessageSquare} label="Contacts"  value={submissionCount}   sub={`${unread} non lu${unread !== 1 ? 's' : ''}`} color="blue" />
            <StatCard icon={Clock}         label="Versions"  value={versionCount}      sub="Historique"                                color="green" />
            <StatCard icon={TrendingUp}    label="Modifié"   value={fmt(site.updated_at)} sub={`Créé ${fmt(site.created_at)}`}          color="pink" />
          </div>
          {/* Recent messages */}
          {submissions.length > 0 && (
            <div className="bg-gray-900 border border-white/8 rounded-xl overflow-hidden flex-1 min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Derniers messages</span>
                {unread > 0 && <span className="bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unread} nouveau{unread > 1 ? 'x' : ''}</span>}
              </div>
              {submissions.slice(0, 5).map(s => (
                <div key={s.id} className={`flex items-start gap-2.5 px-4 py-3 border-b border-white/4 last:border-0 ${!s.read_at ? 'bg-violet-950/10' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${s.read_at ? 'bg-gray-700' : 'bg-violet-500'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{s.data?.name || s.data?.nom || s.data?.Name || s.name || s.data?.email || s.email || 'Anonyme'}</div>
                    <div className="text-[11px] text-gray-500 truncate">{s.data?.message || s.data?.Message || s.data?.contenu || s.message || Object.values(s.data ?? {}).find(Boolean) || ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Section: SEO ──────────────────────────────────────────────────────────────

function SEOSection({ site, onSave }: { site: Site; onSave: (p: object) => Promise<void> }) {
  const schema = site.html ? (() => { try { return JSON.parse(site.html) } catch { return null } })() : null
  const [title,   setTitle]   = useState<string>(schema?.meta?.seoTitle || schema?.meta?.title || site.name)
  const [desc,    setDesc]    = useState<string>(schema?.meta?.seoDesc  || '')
  const [favicon, setFavicon] = useState<string>(schema?.meta?.favicon  || '')
  const [saving,  setSaving]  = useState(false)
  const save = async () => { setSaving(true); await onSave({ seoTitle: title, seoDesc: desc, favicon }); setSaving(false) }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        <div className="bg-gray-900 border border-white/8 rounded-xl p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Titre SEO</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            <div className="flex justify-between text-[11px] text-gray-600">
              <span>Recommandé : 50–60 caractères</span>
              <span className={title.length > 54 ? 'text-yellow-500' : ''}>{title.length}/60</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Méta-description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={160} rows={4}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none" />
            <div className="flex justify-between text-[11px] text-gray-600">
              <span>Recommandé : 120–160 caractères</span>
              <span className={desc.length > 145 ? 'text-yellow-500' : ''}>{desc.length}/160</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">URL du favicon</label>
            <input value={favicon} onChange={e => setFavicon(e.target.value)} placeholder="https://..."
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
        </button>
      </div>

      {/* Google preview */}
      <div className="space-y-4">
        <div className="bg-gray-900 border border-white/8 rounded-xl p-6">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Aperçu Google</p>
          <div className="bg-white rounded-lg p-4 font-sans">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />
              <span>Votre site · sitebot.vercel.app</span>
            </div>
            <div className="text-[#1a0dab] text-[18px] font-normal leading-tight mb-0.5 hover:underline cursor-pointer">{title || '(Sans titre)'}</div>
            <div className="text-gray-600 text-sm leading-snug line-clamp-2">{desc || '(Aucune description renseignée)'}</div>
          </div>
        </div>
        <div className="bg-gray-900 border border-white/8 rounded-xl p-6">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Aperçu partage social</p>
          <div className="border border-gray-200 rounded-lg overflow-hidden font-sans bg-white">
            <div className="h-24 bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white/50 text-sm">Image OG (1200×630)</div>
            <div className="px-3 py-2.5 border-t border-gray-200">
              <div className="text-[11px] text-gray-500 uppercase mb-0.5">SITEBOT.VERCEL.APP</div>
              <div className="text-sm font-semibold text-gray-900 leading-tight truncate">{title || '(Sans titre)'}</div>
              <div className="text-xs text-gray-500 truncate">{desc || '(Aucune description)'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section: Forms ────────────────────────────────────────────────────────────

function FormsSection({ siteId }: { siteId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/site/${siteId}/submissions`)
    const d = await res.json()
    setSubmissions(d.submissions || [])
    setLoading(false)
  }, [siteId])

  useEffect(() => { load() }, [load])

  const markRead = async (id: string, read: boolean) => {
    const read_at = read ? new Date().toISOString() : null
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, read_at } : s))
    await fetch(`/api/site/${siteId}/submissions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: id, read }) })
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>

  if (!submissions.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-900 border border-white/8 rounded-xl">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Mail className="w-6 h-6 text-gray-600" /></div>
      <h3 className="font-semibold mb-1">Aucun message pour l'instant</h3>
      <p className="text-sm text-gray-500 max-w-xs">Les soumissions de votre formulaire de contact apparaîtront ici.</p>
    </div>
  )

  const unread = submissions.filter(s => !s.read_at).length
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">{submissions.length} message{submissions.length > 1 ? 's' : ''}</span>
          {unread > 0 && <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread} non lu{unread > 1 ? 's' : ''}</span>}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>
      <div className="bg-gray-900 border border-white/8 rounded-xl overflow-hidden divide-y divide-white/5">
        {submissions.map(s => {
          // Support both new (data jsonb) and legacy (name/email/message) formats
          const fields = s.data ?? {
            ...(s.name    ? { nom: s.name }         : {}),
            ...(s.email   ? { email: s.email }       : {}),
            ...(s.message ? { message: s.message }   : {}),
          }
          const displayEmail   = s.data?.email || s.data?.Email || s.data?.mail || s.email
          const displayName    = s.data?.name  || s.data?.nom   || s.data?.Name || s.name || s.data?.email || s.data?.Email || s.email || 'Anonyme'
          const displayPreview = s.data?.message || s.data?.Message || s.data?.contenu || s.message || Object.values(fields)[0] || ''
          return (
            <div key={s.id} className={!s.read_at ? 'bg-violet-950/10' : ''}>
              <button onClick={() => { setExpanded(expanded === s.id ? null : s.id); if (!s.read_at) markRead(s.id, true) }}
                className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/3 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${s.read_at ? 'bg-gray-700' : 'bg-violet-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{displayName}</span>
                    {displayEmail && (
                      <a href={`mailto:${displayEmail}`} onClick={e => e.stopPropagation()} className="text-xs text-violet-400 hover:underline">{displayEmail}</a>
                    )}
                    {s.form_name && s.form_name !== 'contact' && (
                      <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded capitalize">{s.form_name}</span>
                    )}
                  </div>
                  <p className={`text-xs text-gray-400 mt-0.5 ${expanded === s.id ? '' : 'truncate'}`}>{String(displayPreview)}</p>
                </div>
                <span className="text-[10px] text-gray-600 flex-shrink-0">{fmtTime(s.created_at)}</span>
              </button>
              {expanded === s.id && (
                <div className="px-5 pb-4 ml-6">
                  <dl className="bg-gray-800 rounded-lg p-4 space-y-2">
                    {Object.entries(fields).filter(([k]) => k !== '_honeypot').map(([key, val]) => (
                      <div key={key} className="flex gap-3 text-sm">
                        <dt className="text-gray-500 capitalize w-24 flex-shrink-0">{key}</dt>
                        <dd className="text-gray-200 break-words">{String(val)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex items-center gap-3 mt-3">
                    {displayEmail && (
                      <a href={`mailto:${displayEmail}?subject=Re: votre message`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-medium transition-colors">
                        <Mail className="w-3 h-3" /> Répondre
                      </a>
                    )}
                    <button onClick={() => markRead(s.id, !s.read_at)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium transition-colors">
                      {s.read_at ? <><Circle className="w-3 h-3" /> Marquer non lu</> : <><CheckCircle2 className="w-3 h-3" /> Marquer lu</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Section: History ─────────────────────────────────────────────────────────

function HistorySection({ siteId }: { siteId: string }) {
  const [versions, setVersions] = useState<{ id: string; note: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/site/${siteId}/versions`)
    const d = await res.json()
    setVersions(d.versions || [])
    setLoading(false)
  }, [siteId])

  useEffect(() => { load() }, [load])

  const restore = async (versionId: string) => {
    if (!confirm('Restaurer cette version ? La version actuelle sera sauvegardée automatiquement.')) return
    setRestoring(versionId)
    await fetch(`/api/site/${siteId}/versions/${versionId}/restore`, { method: 'POST' })
    setRestoring(null)
    window.location.reload()
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>

  if (!versions.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-900 border border-white/8 rounded-xl">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><History className="w-6 h-6 text-gray-600" /></div>
      <h3 className="font-semibold mb-1">Aucune version sauvegardée</h3>
      <p className="text-sm text-gray-500 max-w-xs">Les versions sont créées automatiquement à chaque modification via l'IA.</p>
    </div>
  )

  return (
    <div className="bg-gray-900 border border-white/8 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {versions.length} version{versions.length > 1 ? 's' : ''} sauvegardée{versions.length > 1 ? 's' : ''}
      </div>
      <div className="divide-y divide-white/5">
        {versions.map((v, i) => (
          <div key={v.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <History className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{v.note || 'Modification'}</div>
              <div className="text-xs text-gray-500">{fmtTime(v.created_at)}</div>
            </div>
            {i === 0 && <span className="text-[10px] font-bold text-green-400 bg-green-950/40 border border-green-900/50 px-2 py-0.5 rounded-full">Actuelle</span>}
            {i > 0 && (
              <button
                onClick={() => restore(v.id)}
                disabled={restoring === v.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-600/20 hover:text-violet-300 text-gray-400 text-xs font-medium transition-all disabled:opacity-50"
              >
                {restoring === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Restaurer
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section: Analytics ────────────────────────────────────────────────────────

function AnalyticsSection({ site }: { site: Site }) {
  const days = Math.max(1, Math.floor((Date.now() - new Date(site.created_at).getTime()) / 86_400_000))
  const avg  = site.view_count > 0 ? (site.view_count / days).toFixed(1) : '0'
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Eye}        label="Vues totales" value={site.view_count} color="violet" />
          <StatCard icon={TrendingUp} label="Moy. / jour"  value={avg}            color="blue" />
        </div>
        {!site.is_published && (
          <div className="flex items-start gap-3 p-4 bg-yellow-950/30 border border-yellow-800/40 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-medium text-yellow-300 mb-0.5">Site non publié</p>
              <p className="text-yellow-700 text-xs">Déployez pour recevoir des visites et suivre vos statistiques.</p></div>
          </div>
        )}
        <div className="bg-gray-900 border border-white/8 rounded-xl p-6 space-y-3">
          {[['URL publique', site.deployed_url || `/s/${site.id}`], ['Créé le', fmt(site.created_at)], ['Dernière modification', fmt(site.updated_at)]].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-sm">
              <span className="text-gray-500">{k}</span><span className="font-medium text-xs truncate max-w-[220px]">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 border border-white/8 rounded-xl p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-violet-400" /><h3 className="font-semibold text-sm">Analytics avancés</h3></div>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">Pour des statistiques détaillées (sources de trafic, pages visitées, comportement), connectez Google Analytics ou Plausible depuis la section <strong className="text-gray-300">Intégrations</strong>.</p>
        <div className="mt-auto p-4 bg-white/3 rounded-xl">
          <p className="text-xs text-gray-600 mb-2">Intégrations analytics disponibles :</p>
          {['📊 Google Analytics 4', '📈 Plausible Analytics', '🏷️ Google Tag Manager', '🔥 Hotjar'].map(s => (
            <div key={s} className="text-xs text-gray-400 py-1 flex items-center gap-2"><Check className="w-3 h-3 text-violet-500" /> {s}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section: Integrations ─────────────────────────────────────────────────────

interface Integration { id: string; name: string; desc: string; category: string; logo: string; fields: { key: string; label: string; placeholder: string; type?: string }[]; docs?: string; howto?: string }

const INTEGRATIONS: Integration[] = [
  { id: 'googleAnalytics', name: 'Google Analytics 4', category: 'Analytics', logo: '📊', desc: 'Suivez visites, sources de trafic et comportements.', fields: [{ key: 'trackingId', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' }], howto: 'Trouvez votre Measurement ID dans Google Analytics → Admin → Data Streams.' },
  { id: 'googleTagManager', name: 'Google Tag Manager', category: 'Analytics', logo: '🏷️', desc: 'Gérez tous vos tags sans modifier le code.', fields: [{ key: 'containerId', label: 'Container ID', placeholder: 'GTM-XXXXXXX' }] },
  { id: 'plausible', name: 'Plausible Analytics', category: 'Analytics', logo: '📈', desc: 'Analytics léger, sans cookies, RGPD-friendly.', fields: [{ key: 'domain', label: 'Domaine', placeholder: 'monsite.fr' }] },
  { id: 'hotjar', name: 'Hotjar', category: 'Analytics', logo: '🔥', desc: 'Heatmaps et enregistrements de sessions.', fields: [{ key: 'siteId', label: 'Site ID', placeholder: '1234567' }] },
  { id: 'stripe', name: 'Stripe', category: 'Paiements', logo: '💳', desc: 'Lien de paiement Stripe sur votre site.', fields: [{ key: 'paymentLink', label: 'Lien de paiement', placeholder: 'https://buy.stripe.com/...' }], docs: 'https://dashboard.stripe.com/payment-links' },
  { id: 'paypal', name: 'PayPal', category: 'Paiements', logo: '🅿️', desc: 'Bouton PayPal pour dons ou paiements simples.', fields: [{ key: 'email', label: 'Email PayPal Business', placeholder: 'contact@entreprise.fr', type: 'email' }] },
  { id: 'calendly', name: 'Calendly', category: 'Réservations', logo: '📅', desc: 'Widget de prise de rendez-vous intégré.', fields: [{ key: 'url', label: 'URL Calendly', placeholder: 'https://calendly.com/votre-nom' }], howto: 'Créez un event type sur Calendly et copiez l\'URL.' },
  { id: 'doctolib', name: 'Doctolib', category: 'Réservations', logo: '🏥', desc: 'Bouton de prise de rendez-vous médical.', fields: [{ key: 'url', label: 'URL Doctolib', placeholder: 'https://www.doctolib.fr/...' }] },
  { id: 'opentable', name: 'OpenTable', category: 'Réservations', logo: '🍽️', desc: 'Widget de réservation de table pour restaurants.', fields: [{ key: 'restaurantId', label: 'Restaurant ID', placeholder: '123456' }], docs: 'https://restaurant.opentable.com' },
  { id: 'acuity', name: 'Acuity Scheduling', category: 'Réservations', logo: '🗓️', desc: 'Planification pour salons, coachs, thérapeutes.', fields: [{ key: 'url', label: 'URL Acuity', placeholder: 'https://app.acuityscheduling.com/...' }] },
  { id: 'mailchimp', name: 'Mailchimp', category: 'Email marketing', logo: '🐒', desc: 'Formulaire d\'inscription à votre newsletter.', fields: [{ key: 'formUrl', label: 'URL du formulaire', placeholder: 'https://us1.list-manage.com/...' }] },
  { id: 'brevo', name: 'Brevo (ex-Sendinblue)', category: 'Email marketing', logo: '📧', desc: 'Email marketing RGPD-friendly, made in France.', fields: [{ key: 'formId', label: 'Form ID Brevo', placeholder: '12345' }] },
  { id: 'whatsapp', name: 'WhatsApp Business', category: 'Chat & Support', logo: '💬', desc: 'Bouton flottant WhatsApp sur votre site.', fields: [{ key: 'phone', label: 'Numéro (avec indicatif)', placeholder: '+33612345678' }], howto: 'Saisissez votre numéro au format international. Le bouton apparaîtra en bas à droite.' },
  { id: 'crisp', name: 'Crisp Chat', category: 'Chat & Support', logo: '💭', desc: 'Chat en direct et chatbot pour vos visiteurs.', fields: [{ key: 'websiteId', label: 'Website ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }], docs: 'https://app.crisp.chat' },
  { id: 'tidio', name: 'Tidio', category: 'Chat & Support', logo: '🤖', desc: 'Chat live et chatbot IA pour convertir vos visiteurs.', fields: [{ key: 'publicKey', label: 'Public Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }] },
  { id: 'instagram', name: 'Instagram', category: 'Réseaux sociaux', logo: '📸', desc: 'Lien Instagram dans votre footer et boutons.', fields: [{ key: 'url', label: 'URL Instagram', placeholder: 'https://instagram.com/votre_compte' }] },
  { id: 'facebook', name: 'Facebook', category: 'Réseaux sociaux', logo: '👍', desc: 'Page Facebook + Pixel de conversion.', fields: [{ key: 'url', label: 'URL de votre page', placeholder: 'https://facebook.com/votre-page' }, { key: 'pixelId', label: 'Pixel ID (optionnel)', placeholder: '1234567890' }] },
  { id: 'linkedin', name: 'LinkedIn', category: 'Réseaux sociaux', logo: '💼', desc: 'Profil ou page LinkedIn pour le B2B.', fields: [{ key: 'url', label: 'URL LinkedIn', placeholder: 'https://linkedin.com/company/...' }] },
  { id: 'googleSheets', name: 'Google Sheets', category: 'Données & CRM', logo: '📋', desc: 'Envoyez vos formulaires vers Google Sheets via Zapier.', fields: [{ key: 'zapierHook', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/...' }], howto: 'Créez un Zap Webhooks → Google Sheets et copiez l\'URL du hook.' },
  { id: 'hubspot', name: 'HubSpot CRM', category: 'Données & CRM', logo: '🧲', desc: 'Sync contacts et formulaires avec HubSpot.', fields: [{ key: 'portalId', label: 'Portal ID', placeholder: '12345678' }] },
  { id: 'googleMaps', name: 'Google Maps', category: 'Données & CRM', logo: '📍', desc: 'Carte interactive avec votre adresse.', fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...' }] },
]

const CATEGORIES = ['Tous', ...new Set(INTEGRATIONS.map(i => i.category))]

function IntegrationCard({ integration, savedValues, onSave }: { integration: Integration; savedValues: Record<string, string>; onSave: (id: string, v: Record<string, string>) => Promise<void> }) {
  const [open,   setOpen]   = useState(false)
  const [values, setValues] = useState<Record<string, string>>(savedValues)
  const [saving, setSaving] = useState(false)
  const isEnabled = Object.values(savedValues).some(v => v?.trim())
  const save = async () => { setSaving(true); await onSave(integration.id, values); setSaving(false); setOpen(false) }

  return (
    <div className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${isEnabled ? 'border-violet-700/40' : 'border-white/8'}`}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/3 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">{integration.logo}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{integration.name}</span>
            {isEnabled && <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-950/40 border border-green-900/50 px-2 py-0.5 rounded-full"><Zap className="w-2.5 h-2.5" /> Actif</span>}
          </div>
          <p className="text-xs text-gray-500 truncate">{integration.desc}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/6 pt-4">
          {integration.howto && <div className="text-xs text-gray-500 bg-white/3 rounded-lg p-3 leading-relaxed">💡 {integration.howto}</div>}
          {integration.fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{f.label}</label>
              <input type={f.type || 'text'} value={values[f.key] || ''} onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-semibold transition-all">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Enregistrer
            </button>
            {integration.docs && (
              <a href={integration.docs} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Docs
              </a>
            )}
            {isEnabled && (
              <button onClick={() => { setValues({}); onSave(integration.id, {}) }}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-950/30 hover:bg-red-950/50 text-red-400 text-xs font-medium transition-colors">
                <X className="w-3.5 h-3.5" /> Désactiver
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function IntegrationsSection({ site, onSave }: { site: Site; onSave: (p: object) => Promise<void> }) {
  const schema = site.html ? (() => { try { return JSON.parse(site.html) } catch { return null } })() : null
  const saved: Record<string, Record<string, string>> = schema?.meta?.integrations || {}
  const [cat, setCat] = useState('Tous')
  const filtered = cat === 'Tous' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === cat)
  const enabledCount = INTEGRATIONS.filter(i => Object.values(saved[i.id] || {}).some(v => v)).length

  const handleSave = async (id: string, values: Record<string, string>) => {
    await onSave({ integrations: { ...saved, [id]: values } })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-400">{enabledCount} intégration{enabledCount !== 1 ? 's' : ''} active{enabledCount !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${cat === c ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {filtered.map(integration => (
          <IntegrationCard key={integration.id} integration={integration} savedValues={saved[integration.id] || {}} onSave={handleSave} />
        ))}
      </div>
    </div>
  )
}

// ─── Custom domain card ────────────────────────────────────────────────────────

function CustomDomainCard({ siteId }: { siteId: string }) {
  const [domain,    setDomain]    = useState('')
  const [current,  setCurrent]   = useState<{ domain: string; verified: boolean; cname?: string } | null>(null)
  const [loading,  setLoading]   = useState(true)
  const [saving,   setSaving]    = useState(false)
  const [checking, setChecking]  = useState(false)
  const [removing, setRemoving]  = useState(false)
  const [error,    setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/site/${siteId}/domain`)
    const d = await res.json()
    setCurrent(d.domain ? d : null)
    setLoading(false)
  }, [siteId])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setError(null); setSaving(true)
    const res = await fetch(`/api/site/${siteId}/domain`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domain.trim().toLowerCase().replace(/^https?:\/\//, '') }),
    })
    if (res.ok) { setDomain(''); await load() }
    else { const d = await res.json(); setError(d.error || 'Erreur') }
    setSaving(false)
  }

  const check = async () => {
    setChecking(true); await load(); setChecking(false)
  }

  const remove = async () => {
    setRemoving(true)
    await fetch(`/api/site/${siteId}/domain`, { method: 'DELETE' })
    setCurrent(null); setRemoving(false)
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 text-sm py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…</div>

  return (
    <div className="space-y-4">
      {current ? (
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${current.verified ? 'bg-green-950/20 border-green-900/40' : 'bg-yellow-950/20 border-yellow-800/40'}`}>
            <Globe2 className={`w-4 h-4 flex-shrink-0 ${current.verified ? 'text-green-400' : 'text-yellow-500'}`} />
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${current.verified ? 'text-green-300' : 'text-yellow-300'}`}>
                {current.verified ? '✓ Actif' : '⏳ En attente DNS'} — {current.domain}
              </div>
              {!current.verified && (
                <div className="text-xs text-yellow-700 mt-0.5">Le DNS peut prendre jusqu'à 48h à se propager</div>
              )}
            </div>
            <button onClick={remove} disabled={removing} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
              {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!current.verified && (
            <div className="bg-gray-800/60 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Instructions DNS</p>
              <p className="text-xs text-gray-500 leading-relaxed">Ajoutez ce CNAME chez votre registrar (Namecheap, OVH, Cloudflare…) :</p>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-300 space-y-1">
                <div><span className="text-gray-500">Type</span>  CNAME</div>
                <div><span className="text-gray-500">Nom </span>  {current.domain}</div>
                <div><span className="text-gray-500">Valeur</span> cname.vercel-dns.com</div>
              </div>
              <button onClick={check} disabled={checking}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Vérifier la propagation
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">Connectez votre domaine (ex: <span className="text-gray-300">monsite.fr</span>) pour remplacer l'URL Vercel par défaut.</p>
          <div className="flex gap-2">
            <input
              value={domain} onChange={e => setDomain(e.target.value)}
              placeholder="monsite.fr"
              className="flex-1 bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button onClick={save} disabled={saving || !domain.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Connecter
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Section: Settings ─────────────────────────────────────────────────────────

function SettingsSection({ site, onSave, onDelete }: { site: Site; onSave: (p: object) => Promise<void>; onDelete: () => void }) {
  const [name, setName] = useState(site.name)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyId = () => { navigator.clipboard.writeText(site.id); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const save = async () => { setSaving(true); await onSave({ name }); setSaving(false) }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-gray-900 border border-white/8 rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-sm">Informations générales</h3>
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Nom du site</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Identifiant unique</label>
            <div className="flex items-center gap-2">
              <input readOnly value={site.id} className="flex-1 bg-gray-800/50 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-gray-500" />
              <button onClick={copyId} className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>
          <button onClick={save} disabled={saving || name === site.name}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
          </button>
        </div>

        {/* Custom domain */}
        <div className="bg-gray-900 border border-white/8 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-sm">Domaine personnalisé</h3>
          </div>
          <CustomDomainCard siteId={site.id} />
        </div>
      </div>

      <div className="bg-gray-900 border border-red-900/40 rounded-xl p-6 space-y-4 self-start">
        <h3 className="font-semibold text-sm text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Zone dangereuse</h3>
        <p className="text-xs text-gray-500 leading-relaxed">La suppression est irréversible — toutes les versions, messages et données associés seront perdus définitivement.</p>
        {!confirm
          ? <button onClick={() => setConfirm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-900 text-red-400 hover:bg-red-950/40 text-sm font-medium transition-all">
              <Trash2 className="w-4 h-4" /> Supprimer ce site
            </button>
          : <div className="space-y-3">
              <p className="text-sm font-medium text-red-300">Cette action est irréversible. Confirmer ?</p>
              <div className="flex gap-2">
                <button onClick={() => { setDeleting(true); onDelete() }} disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Confirmer
                </button>
                <button onClick={() => setConfirm(false)} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">Annuler</button>
              </div>
            </div>
        }
      </div>
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function SiteDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const siteId = params.id as string

  const supabase = createClient()
  const [data,        setData]        = useState<DashData | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading,     setLoading]     = useState(true)
  const [active,      setActive]      = useState('overview')
  const [toast,       setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deploying,   setDeploying]   = useState(false)
  const [userEmail,   setUserEmail]   = useState('')
  const [loggingOut,  setLoggingOut]  = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initials  = userEmail ? userEmail.slice(0, 2).toUpperCase() : '?'
  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })

  // Load data
  const loadData = useCallback(async () => {
    const [dashRes, subRes] = await Promise.all([
      fetch(`/api/site/${siteId}`),
      fetch(`/api/site/${siteId}/submissions`),
    ])
    if (!dashRes.ok) { router.push('/dashboard'); return }
    setData(await dashRes.json())
    const subs = await subRes.json()
    setSubmissions(subs.submissions || [])
    setLoading(false)
  }, [siteId, router])

  useEffect(() => { loadData() }, [loadData])

  // Scroll spy
  useEffect(() => {
    if (!data) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-10% 0px -65% 0px', threshold: 0 }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [data])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSave = async (patch: object) => {
    const res = await fetch(`/api/site/${siteId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
    if (res.ok) { const u = await res.json(); setData(prev => prev ? { ...prev, site: u.site } : prev); showToast('Sauvegardé') }
    else showToast('Erreur lors de la sauvegarde', 'error')
  }

  const handleDeploy = async () => {
    setDeploying(true)
    const res = await fetch('/api/deploy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId }),
    })
    if (res.ok) {
      const { url } = await res.json()
      setData(prev => prev ? { ...prev, site: { ...prev.site, is_published: true, deployed_url: url } } : prev)
      showToast('Site publié et en ligne !')
    } else {
      showToast('Erreur lors du déploiement', 'error')
    }
    setDeploying(false)
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/site/${siteId}`, { method: 'DELETE' })
    if (res.ok) router.push('/dashboard')
    else showToast('Erreur lors de la suppression', 'error')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Chargement…</p>
      </div>
    </div>
  )

  if (!data) return null
  const unreadCount = submissions.filter(s => !s.read_at).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <nav className="border-b border-white/5 px-6 py-3 flex items-center gap-3 sticky top-0 bg-gray-950/95 backdrop-blur z-40">
        <a href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </a>
        <span className="text-gray-700">/</span>
        <span className="text-sm font-semibold truncate max-w-[200px]">{data.site.name}</span>
        <div className="ml-auto flex items-center gap-2">
          {data.site.deployed_url && (
            <a href={data.site.deployed_url} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <Globe className="w-3.5 h-3.5" /> Voir le site
            </a>
          )}
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white text-xs font-semibold transition-all">
            {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            {data.site.is_published ? 'Redéployer' : 'Déployer'}
          </button>
          <a href={`/editor/${siteId}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all">
            <PenLine className="w-3.5 h-3.5" /> Éditer
          </a>

          <div className="w-px h-5 bg-white/10 mx-1" />

          <ThemeToggle />

          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-[11px] font-bold select-none">
            {initials}
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            title="Se déconnecter"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      <div className="flex">
        {/* Left sidebar — sticky scroll spy */}
        <aside className="w-52 flex-shrink-0 border-r border-white/5 sticky top-[53px] h-[calc(100vh-53px)] flex flex-col py-5 px-3 overflow-y-auto">
          <div className="px-2 mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`w-2 h-2 rounded-full ${data.site.is_published ? 'bg-green-400' : 'bg-gray-600'}`} />
              <span className="text-xs text-gray-500">{data.site.is_published ? 'En ligne' : 'Non publié'}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  active === s.id ? 'bg-violet-600/20 text-violet-300' : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}>
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{s.label}</span>
                {s.id === 'forms' && unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-violet-500 text-white text-[10px] font-bold px-1 rounded-full shadow-sm shadow-violet-500/50">{unreadCount}</span>
                )}
              </button>
            ))}
          </nav>

        </aside>

        {/* Scrollable content */}
        <main ref={mainRef} className="flex-1 min-w-0 px-8 py-8 space-y-20">
          <section id="overview">
            <h2 className="text-lg font-black mb-6 scroll-mt-6">Vue d'ensemble</h2>
            <OverviewSection data={data} submissions={submissions} />
          </section>

          <div className="border-t border-white/5" />

          <section id="seo">
            <h2 className="text-lg font-black mb-6">SEO</h2>
            <SEOSection site={data.site} onSave={handleSave} />
          </section>

          <div className="border-t border-white/5" />

          <section id="forms">
            <h2 className="text-lg font-black mb-6">Formulaires</h2>
            <FormsSection siteId={siteId} />
          </section>

          <div className="border-t border-white/5" />

          <section id="history">
            <h2 className="text-lg font-black mb-6">Historique des versions</h2>
            <HistorySection siteId={siteId} />
          </section>

          <div className="border-t border-white/5" />

          <section id="analytics">
            <h2 className="text-lg font-black mb-6">Analytiques</h2>
            <AnalyticsSection site={data.site} />
          </section>

          <div className="border-t border-white/5" />

          <section id="integrations">
            <h2 className="text-lg font-black mb-6">Intégrations</h2>
            <IntegrationsSection site={data.site} onSave={handleSave} />
          </section>

          <div className="border-t border-white/5" />

          <section id="settings" className="pb-20">
            <h2 className="text-lg font-black mb-6">Paramètres</h2>
            <SettingsSection site={data.site} onSave={handleSave} onDelete={handleDelete} />
          </section>
        </main>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
