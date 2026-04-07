'use client'

import { useEffect, useState } from 'react'
import SiteRenderer from '@/components/renderer/SiteRenderer'
import type { SiteSchema } from '@/types/site-schema'
import { parseSchema } from '@/types/site-schema'

export default function PreviewPage() {
  const [schema,   setSchema]   = useState<SiteSchema | null>(null)
  const [siteId,   setSiteId]   = useState<string | undefined>()
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SITE_SCHEMA') {
        const parsed = parseSchema(JSON.stringify(event.data.schema))
        if (parsed) setSchema(parsed)
        if (event.data.siteId)   setSiteId(event.data.siteId)
        if (event.data.editMode !== undefined) setEditMode(event.data.editMode)
      }
      if (event.data?.type === 'EDIT_MODE') {
        setEditMode(event.data.editMode)
      }
    }
    window.addEventListener('message', handleMessage)
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*')
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (!schema) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0f13', color: '#666', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ margin: 0 }}>Prêt à afficher…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  return <SiteRenderer schema={schema} siteId={siteId} editable={editMode} />
}
