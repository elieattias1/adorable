'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import EditorTopBar from '@/components/editor/EditorTopBar'
import CodePreview from '@/components/editor/CodePreview'
import ChatPanel, { type ChatMessage } from '@/components/editor/ChatPanel'
import VersionPanel, { type Version } from '@/components/editor/VersionPanel'
import type { Tables } from '@/types/supabase'

type Site = Tables<'sites'>

// ─── Simple toast ──────────────────────────────────────────────────────────────
function Toast({ msg, type, onDismiss }: { msg: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-4 fade-in-0 max-w-sm ${
      type === 'success'
        ? 'bg-green-950 border-green-700 text-green-300'
        : 'bg-red-950 border-red-700 text-red-300'
    }`}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  )
}

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
  const params   = useParams()
  const siteId   = params.id as string
  const supabase = createClient()

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
  const [previewMode,   setPreviewMode]   = useState<'desktop' | 'mobile'>('desktop')
  const [isPro,         setIsPro]         = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

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
  const handleSend = async (message: string, imageFile?: File) => {
    if (isGenerating) return

    let imageData: { url: string; base64: string; mimeType: string } | undefined

    const userMsg: ChatMessage = {
      id:         `tmp-${Date.now()}`,
      role:       'user',
      content:    message,
      imageUrl:   imageFile ? URL.createObjectURL(imageFile) : undefined,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsGenerating(true)
    setStreamingText('')
    setStreamingCode('')
    setCurrentSteps([])

    try {
      if (imageFile) {
        imageData = await uploadImage(imageFile)
      }

      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ siteId, message, image: imageData }),
      })

      if (!res.body) throw new Error('Pas de réponse du serveur')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      let   accumulatedText  = ''
      let   accumulatedSteps: import('@/components/editor/ChatPanel').AgentStep[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.error) {
              if (data.upgrade) showToast(data.error, 'error')
              throw new Error(data.error)
            }

            if (data.chunk) {
              accumulatedText += data.chunk
              setStreamingText(accumulatedText)
            }

            if (data.tool_start) {
              accumulatedSteps = [...accumulatedSteps, data.tool_start]
              setCurrentSteps([...accumulatedSteps])
            }

            // Live streaming: code being written token by token
            if (data.code_stream) {
              setStreamingCode(data.code_stream)
            }

            // Tool finished → clear overlay, update Sandpack
            if (data.code_update) {
              setStreamingCode('')
              setSiteCode(data.code_update)
            }

            if (data.done) {
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

              const { data: newVersions } = await supabase
                .from('versions').select('id, note, created_at')
                .eq('site_id', siteId).order('created_at', { ascending: false }).limit(50)
              if (newVersions) setVersions(newVersions as Version[])
            }
          } catch (parseErr: any) {
            if (parseErr.message && parseErr.message !== 'Unexpected token') throw parseErr
          }
        }
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement de l'éditeur…</p>
        </div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-2">Site introuvable</p>
          <a href="/dashboard" className="text-violet-400 text-sm hover:underline">← Retour au dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
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
      <div className="md:hidden flex-shrink-0 border-t border-white/8" style={{ height: '40vh' }}>
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
