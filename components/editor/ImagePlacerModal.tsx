'use client'

import { X } from 'lucide-react'
import type { SiteSchema } from '@/types/site-schema'

interface ImagePlacerModalProps {
  imageUrl: string
  schema: SiteSchema
  onPlace: (path: string) => void
  onClose: () => void
}

export default function ImagePlacerModal({ imageUrl, schema, onPlace, onClose }: ImagePlacerModalProps) {
  // Build list of placeable locations from the schema
  const options: { label: string; path: string }[] = []

  // Hero
  const hero = schema.sections.find((s, i) => s.type === 'hero')
  const heroIdx = schema.sections.findIndex(s => s.type === 'hero')
  if (heroIdx !== -1) {
    options.push({ label: '🖼️ Fond du hero', path: `sections.${heroIdx}.image` })
  }

  // Team members
  schema.sections.forEach((s, si) => {
    if (s.type === 'team') {
      s.members.forEach((m, mi) => {
        options.push({ label: `👤 Photo — ${m.name}`, path: `sections.${si}.members.${mi}.image` })
      })
    }
  })

  // Gallery items
  schema.sections.forEach((s, si) => {
    if (s.type === 'gallery') {
      s.items.forEach((item, ii) => {
        options.push({ label: `🖼️ Galerie — ${item.label || `Image ${ii + 1}`}`, path: `sections.${si}.items.${ii}.image` })
      })
      // Also allow adding as new gallery item (handled separately)
    }
  })

  // Features items
  schema.sections.forEach((s, si) => {
    if (s.type === 'features') {
      s.items.forEach((item, ii) => {
        options.push({ label: `⚡ Feature — ${item.title}`, path: `sections.${si}.items.${ii}.image` })
      })
    }
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <p className="text-sm font-semibold">Où placer cette image ?</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image preview */}
        <div className="px-4 pt-3">
          <img src={imageUrl} alt="preview" className="w-full h-28 object-cover rounded-xl border border-white/10" />
        </div>

        {/* Options */}
        <div className="p-4 flex flex-col gap-2 max-h-64 overflow-y-auto">
          {options.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Aucun emplacement disponible.<br/>Décris dans le chat où tu veux l'image.</p>
          )}
          {options.map(opt => (
            <button
              key={opt.path}
              onClick={() => onPlace(opt.path)}
              className="w-full text-left text-sm px-3 py-2.5 rounded-xl bg-white/5 hover:bg-violet-600/20 hover:border-violet-500/50 border border-white/8 transition-all"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
