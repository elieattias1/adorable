'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'
import type { SiteSchema } from '@/types/site-schema'
import type { FieldPatch } from '@/lib/schema-patch'

interface PreviewPaneProps {
  schema: SiteSchema | null
  siteId: string
  mode: 'desktop' | 'mobile'
  isGenerating: boolean
  editMode: boolean
  onFieldUpdate: (patch: FieldPatch) => void
}

export default function PreviewPane({ schema, siteId, mode, isGenerating, editMode, onFieldUpdate }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)

  // Listen for messages from iframe (PREVIEW_READY + FIELD_UPDATE)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_READY') {
        setReady(true)
      }
      if (event.data?.type === 'FIELD_UPDATE') {
        onFieldUpdate({ path: event.data.path, value: event.data.value })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onFieldUpdate])

  // Push schema whenever it changes (and iframe is ready)
  useEffect(() => {
    if (!ready || !schema || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'SITE_SCHEMA', schema, siteId, editMode }, '*')
  }, [schema, ready])

  // Push edit mode changes without requiring a full schema re-send
  useEffect(() => {
    if (!ready || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'EDIT_MODE', editMode }, '*')
  }, [editMode, ready])

  // Also push when iframe becomes ready (catches initial load)
  const handleIframeLoad = () => {
    setReady(false) // will be re-set when PREVIEW_READY fires
  }

  return (
    <div className="flex-1 bg-gray-950 flex items-center justify-center overflow-hidden relative min-h-0">
      {isGenerating && (
        <div className="absolute inset-0 z-10 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Adorable génère…</p>
          </div>
        </div>
      )}

      {schema ? (
        <div className={`h-full transition-all duration-300 ${mode === 'mobile' ? 'w-[375px] shadow-2xl shadow-black/50' : 'w-full'}`}>
          {mode === 'mobile' && (
            <div className="h-full border-x border-white/10 overflow-hidden">
              <iframe
                ref={iframeRef}
                src="/preview"
                onLoad={handleIframeLoad}
                className="w-full h-full border-0"
                title="Aperçu du site"
              />
            </div>
          )}
          {mode === 'desktop' && (
            <iframe
              ref={iframeRef}
              src="/preview"
              onLoad={handleIframeLoad}
              className="w-full h-full border-0"
              title="Aperçu du site"
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Globe className="w-7 h-7 text-gray-600" />
          </div>
          <div>
            <p className="text-gray-400 font-medium">Aucun aperçu pour l'instant</p>
            <p className="text-gray-600 text-sm mt-1">Envoie un message pour générer ton site</p>
          </div>
        </div>
      )}
    </div>
  )
}
