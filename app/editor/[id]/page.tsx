'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import EditorTopBar from '@/components/editor/EditorTopBar'
import ShopPanel from '@/components/dashboard/ShopPanel'
import CodePreview from '@/components/editor/CodePreview'
import ChatPanel, { type ChatMessage } from '@/components/editor/ChatPanel'
import VersionPanel, { type Version } from '@/components/editor/VersionPanel'
import type { Tables } from '@/types/supabase'
import { Toast, type ToastState } from '@/components/ui/Toast'

type Site = Tables<'sites'>

// ─── Is this React code? (vs legacy JSON schema) ──────────────────────────────
function isReactCode(content: string): boolean {
  if (!content || content.length < 10) return false
  const trimmed = content.trim()
  // Old format was JSON — reject JSON objects/arrays
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return false
  return true
}

// ─── Editor page ───────────────────────────────────────────────────────────────
function EditorPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const siteId       = params.id as string
  const supabase     = createClient()
  const autoSentRef  = useRef(false)

  const [site,          setSite]          = useState<Site | null>(null)
  const [siteCode,      setSiteCode]      = useState<string>('')
  const [messages,      setMessages]      = useState<ChatMessage[]>([])
  const [versions,      setVersions]      = useState<Version[]>([])
  const [isGenerating,  setIsGenerating]  = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingCode, setStreamingCode] = useState('')
  const [currentSteps,  setCurrentSteps]  = useState<import('@/components/editor/ChatPanel').AgentStep[]>([])
  const [isDeploying,   setIsDeploying]   = useState(false)
  const [deployPhase,   setDeployPhase]   = useState<'idle' | 'generating' | 'building' | 'ready' | 'error'>('idle')
  const deployPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showVersions,  setShowVersions]  = useState(false)
  const [showChat,      setShowChat]      = useState(true)
  const [showShop,      setShowShop]      = useState(false)
  const [previewMode,   setPreviewMode]   = useState<'desktop' | 'mobile'>('desktop')
  const [isPro,         setIsPro]         = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [toast,         setToast]         = useState<ToastState>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })

  // ─── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!siteId) return
    loadAll()
  }, [siteId])

  const loadAll = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [siteRes, msgsRes, versRes, profileRes] = await Promise.all([
      supabase.from('sites').select('*').eq('id', siteId).eq('user_id', user.id).single(),
      supabase.from('messages').select('*').eq('site_id', siteId).order('created_at', { ascending: true }).limit(100),
      supabase.from('versions').select('id, note, created_at').eq('site_id', siteId).order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
    ])

    if (siteRes.data) {
      setSite(siteRes.data)
      if (siteRes.data.html && isReactCode(siteRes.data.html)) {
        setSiteCode(siteRes.data.html)
      }
    }
    if (msgsRes.data) setMessages(msgsRes.data as ChatMessage[])
    if (versRes.data) setVersions(versRes.data as Version[])
    if (profileRes.data) setIsPro(profileRes.data.plan !== 'free')

    setLoading(false)
  }

  // ─── Load template code immediately if ?template= param present ─────────────
  useEffect(() => {
    if (loading || autoSentRef.current) return
    const templateSlug = searchParams.get('template')
    if (!templateSlug || !site || site.html) return

    autoSentRef.current = true
    const supabaseClient = createClient()
    supabaseClient
      .from('templates')
      .select('react_code')
      .eq('slug', templateSlug)
      .single()
      .then(({ data }) => {
        if (data?.react_code) {
          // Save to site immediately so it persists
          setSiteCode(data.react_code)
          supabaseClient
            .from('sites')
            .update({ html: data.react_code, updated_at: new Date().toISOString() })
            .eq('id', siteId)
            .then(() => loadAll())
        }
      })
  }, [loading, site])


  // ─── Upload image ─────────────────────────────────────────────────────────
  const uploadImage = async (file: File): Promise<{ url: string; base64: string; mimeType: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('siteId', siteId)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error || 'Upload failed')
    }
    const { url } = await res.json()

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    return { url, base64, mimeType: file.type }
  }

  // ─── Send message (streaming) ─────────────────────────────────────────────
  const handleSend = async (message: string, imageFiles?: File[]) => {
    if (isGenerating) return

    const userMsg: ChatMessage = {
      id:         `tmp-${Date.now()}`,
      role:       'user',
      content:    message,
      imageUrls:  imageFiles?.map(f => URL.createObjectURL(f)),
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsGenerating(true)
    setStreamingText('')
    setStreamingCode('')
    setCurrentSteps([])

    try {
      // Upload all images in parallel
      const uploadedImages = imageFiles && imageFiles.length > 0
        ? await Promise.all(imageFiles.map(f => uploadImage(f)))
        : undefined

      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ siteId, message, images: uploadedImages }),
      })

      if (!res.body) throw new Error('Pas de réponse du serveur')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      let   accumulatedText  = ''
      let   accumulatedSteps: import('@/components/editor/ChatPanel').AgentStep[] = []
      let   generationDone   = false
      let   generationError  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let data: any
          try { data = JSON.parse(line.slice(6)) } catch { continue }

          if (data.error) {
            generationError = data.error
            if (data.upgrade) showToast(data.error, 'error')
            else              showToast(data.error, 'error')
            break
          }

          if (data.chunk) {
            accumulatedText += data.chunk
            setStreamingText(accumulatedText)
          }

          if (data.tool_start) {
            accumulatedSteps = [...accumulatedSteps, data.tool_start]
            setCurrentSteps([...accumulatedSteps])
          }

          // Sequential generation: a new section is starting
          if (data.section_start) {
            accumulatedSteps = [...accumulatedSteps, {
              name:  'write_section',
              icon:  '🔨',
              label: data.section_start.label,
              done:  false,
            }]
            setCurrentSteps([...accumulatedSteps])
          }

          // Section finished — mark the last step as done
          if (data.section_done !== undefined) {
            accumulatedSteps = accumulatedSteps.map((s, i) =>
              i === accumulatedSteps.length - 1 ? { ...s, done: true, icon: data.section_skipped ? '⚠️' : '✓' } : s
            )
            setCurrentSteps([...accumulatedSteps])
          }

          // Live streaming: code being written token by token
          if (data.code_stream) {
            setStreamingCode(data.code_stream)
          }

          // Tool / section finished → clear overlay, update preview
          if (data.code_update) {
            setStreamingCode('')
            setSiteCode(data.code_update)
          }

          if (data.done) {
            generationDone = true
            if (data.code) setSiteCode(data.code)
            if (data.upgrade) showToast('Limite de 5 versions atteinte — passe à Pro pour des versions illimitées', 'error')

            const aiMsg: ChatMessage = {
              id:         `ai-${Date.now()}`,
              role:       'assistant',
              content:    data.ask || data.note || 'Site mis à jour ✓',
              created_at: new Date().toISOString(),
              steps:      accumulatedSteps.length > 0 ? accumulatedSteps : undefined,
            }
            setMessages(prev => [...prev, aiMsg])
          }
        }
      }

      // ── After stream: sync state from DB ────────────────────────────────
      if (generationDone) {
        // Reload versions list
        const { data: newVersions } = await supabase
          .from('versions').select('id, note, created_at')
          .eq('site_id', siteId).order('created_at', { ascending: false }).limit(50)
        if (newVersions) setVersions(newVersions as Version[])

        // Reload site html from DB as source of truth (catches any sync issues)
        const { data: freshSite } = await supabase.from('sites').select('html').eq('id', siteId).single()
        if (freshSite?.html) setSiteCode(freshSite.html)
      }

      if (generationError) {
        // Remove the optimistic user message since generation failed before saving
        setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      }

    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      showToast(err.message || 'Erreur lors de la génération', 'error')
    } finally {
      setIsGenerating(false)
      setStreamingText('')
      setStreamingCode('')
      setCurrentSteps([])
    }
  }

  // ─── Deploy ────────────────────────────────────────────────────────────────
  const handleDeploy = async () => {
    if (isDeploying || !siteCode) return
    setIsDeploying(true)
    setDeployPhase('generating')
    if (deployPollRef.current) clearInterval(deployPollRef.current)

    try {
      const res = await fetch('/api/deploy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ siteId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur de déploiement')
      }
      const { url, deploymentId, building } = await res.json()
      setSite(prev => prev ? { ...prev, deployed_url: url, is_published: true } : prev)

      if (!building) {
        setDeployPhase('ready')
        showToast(`Site déployé ! ${url}`, 'success')
        setIsDeploying(false)
        return
      }

      setDeployPhase('building')
      showToast('Build en cours (~2 min)…', 'success')

      let elapsed = 0
      deployPollRef.current = setInterval(async () => {
        elapsed += 8
        try {
          const statusRes = await fetch(`/api/deploy?deploymentId=${deploymentId}&siteId=${siteId}`)
          const status = await statusRes.json()
          if (status.status === 'ready') {
            clearInterval(deployPollRef.current!)
            setDeployPhase('ready')
            setIsDeploying(false)
            showToast(`✓ Site live ! ${url}`, 'success')
          } else if (status.status === 'error') {
            throw new Error('Build Vercel échoué')
          } else if (elapsed > 600) {
            throw new Error('Timeout: le build prend trop longtemps')
          }
        } catch (err: any) {
          clearInterval(deployPollRef.current!)
          setDeployPhase('error')
          setIsDeploying(false)
          showToast(err.message || 'Erreur build', 'error')
        }
      }, 8000)
    } catch (err: any) {
      setDeployPhase('error')
      setIsDeploying(false)
      showToast(err.message || 'Erreur lors du déploiement', 'error')
    }
  }

  // ─── Restore version ───────────────────────────────────────────────────────
  const handleRestore = async (versionId: string) => {
    try {
      const { data } = await supabase
        .from('versions').select('html, note').eq('id', versionId).single()

      if (!data?.html) return

      setSiteCode(data.html)
      setShowVersions(false)
      showToast(`Version restaurée : ${data.note || ''}`, 'success')

      await supabase.from('sites').update({ html: data.html, updated_at: new Date().toISOString() }).eq('id', siteId)
    } catch {
      showToast('Impossible de restaurer cette version', 'error')
    }
  }

  // ─── Upgrade ───────────────────────────────────────────────────────────────
  const handleUpgrade = async () => {
    const res = await fetch('/api/stripe/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan: 'pro' }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement de l'éditeur…</p>
        </div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Site introuvable</p>
          <a href="/dashboard" className="text-violet-600 text-sm hover:underline">← Retour au dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#fafaf9] flex flex-col overflow-hidden">
      {/* Top bar */}
      <EditorTopBar
        siteName={site.name}
        siteId={siteId}
        versionCount={versions.length}
        previewMode={previewMode}
        onPreviewToggle={() => setPreviewMode(m => m === 'desktop' ? 'mobile' : 'desktop')}
        onShowVersions={() => setShowVersions(v => !v)}
        onDeploy={handleDeploy}
        isDeploying={isDeploying}
        deployPhase={deployPhase}
        deployedUrl={site.deployed_url}
        showChat={showChat}
        onToggleChat={() => setShowChat(v => !v)}
        showShop={showShop}
        onToggleShop={site.type === 'bakery' ? () => setShowShop(v => !v) : undefined}
      />

      {/* Split layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Preview */}
        <div className="flex-1 md:flex-[65] flex flex-col min-h-0 min-w-0">
          <CodePreview
            code={siteCode}
            isGenerating={isGenerating}
            isWaitingForGeneration={isGenerating && !siteCode}
            streamingCode={streamingCode}
            mode={previewMode}
            onError={msg => showToast(msg, 'error')}
          />
        </div>

        {/* Chat panel */}
        <div className={`hidden md:flex flex-col min-h-0 min-w-0 transition-all duration-300 ${showChat ? 'md:flex-[35] max-w-sm' : 'md:w-0 overflow-hidden'}`}>
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onSend={handleSend}
            streamingText={streamingText}
            currentSteps={currentSteps}
            siteType={site?.type}
          />
        </div>

        {/* Shop panel */}
        {showShop && site.type === 'bakery' && (
          <div className="hidden md:flex flex-col min-h-0 min-w-0 md:flex-[35] max-w-sm border-l border-gray-200 bg-white">
            <ShopPanel siteId={siteId} />
          </div>
        )}

        {/* Version panel */}
        {showVersions && (
          <VersionPanel
            versions={versions}
            isPro={isPro}
            onRestore={handleRestore}
            onClose={() => setShowVersions(false)}
            onUpgrade={handleUpgrade}
          />
        )}
      </div>

      {/* Mobile chat */}
      <div className="md:hidden flex-shrink-0 border-t border-gray-200" style={{ height: '40vh' }}>
        <ChatPanel
          messages={messages}
          isGenerating={isGenerating}
          onSend={handleSend}
          streamingText={streamingText}
          currentSteps={currentSteps}
          siteType={site?.type}
        />
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default function EditorPageWrapper() {
  return (
    <Suspense>
      <EditorPage />
    </Suspense>
  )
}
