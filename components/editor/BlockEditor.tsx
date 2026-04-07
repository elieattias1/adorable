'use client'

import { useEffect, useRef, useState } from 'react'
import {
  GripVertical, ChevronDown, Eye, EyeOff, Trash2,
  Type, Image as ImageIcon, Check, Loader2,
} from 'lucide-react'
import {
  parseBlocks, reconstructCode, applyTextEdit, applyImageEdit,
  type Block,
} from '@/lib/blockParser'

// ─── Unsplash quick-pick ──────────────────────────────────────────────────────
const UNSPLASH_SUGGESTIONS = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
  'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80',
]

// ─── Block card ───────────────────────────────────────────────────────────────
function BlockCard({
  block,
  index,
  expanded,
  onToggleExpand,
  onToggleHide,
  onDelete,
  onTextChange,
  onImageChange,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: {
  block: Block
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onToggleHide: () => void
  onDelete: () => void
  onTextChange: (textId: string, value: string) => void
  onImageChange: (imageId: string, url: string) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
  isDragOver: boolean
}) {
  const [imagePickerFor, setImagePickerFor] = useState<string | null>(null)
  const [customUrl, setCustomUrl] = useState('')

  return (
    <div
      className={`rounded-xl border transition-all ${
        isDragOver
          ? 'border-violet-500/60 bg-violet-950/30'
          : block.hidden
          ? 'border-white/5 bg-white/2 opacity-50'
          : 'border-white/8 bg-white/3'
      }`}
      onDragOver={e => onDragOver(e, index)}
      onDrop={e => onDrop(e, index)}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <div
          draggable
          onDragStart={e => onDragStart(e, index)}
          className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Label */}
        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <span className={`text-xs font-semibold truncate ${block.hidden ? 'text-gray-600' : 'text-gray-200'}`}>
            {block.label}
          </span>
          {(block.texts.length > 0 || block.images.length > 0) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {block.texts.length > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-gray-600">
                  <Type className="w-2.5 h-2.5" />{block.texts.length}
                </span>
              )}
              {block.images.length > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-gray-600">
                  <ImageIcon className="w-2.5 h-2.5" />{block.images.length}
                </span>
              )}
            </div>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-600 flex-shrink-0 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleHide}
            className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors"
            title={block.hidden ? 'Afficher' : 'Masquer'}
          >
            {block.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-gray-700 hover:text-red-400 transition-colors"
            title="Supprimer ce bloc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && !block.hidden && (block.texts.length > 0 || block.images.length > 0) && (
        <div className="border-t border-white/6 px-3 py-3 space-y-4">

          {/* Text fields */}
          {block.texts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Type className="w-3 h-3" /> Textes
              </p>
              {block.texts.map(text => (
                <div key={text.id}>
                  <input
                    type="text"
                    value={text.value}
                    onChange={e => onTextChange(text.id, e.target.value)}
                    className="w-full bg-white/5 border border-white/8 focus:border-violet-500/60 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors placeholder-gray-600"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Image fields */}
          {block.images.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Images
              </p>
              {block.images.map(img => (
                <div key={img.id} className="space-y-2">
                  {/* Current image preview */}
                  <div className="relative w-full h-16 rounded-lg overflow-hidden bg-white/5 border border-white/8">
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <button
                      onClick={() => setImagePickerFor(imagePickerFor === img.id ? null : img.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity text-[10px] font-semibold text-white"
                    >
                      Changer →
                    </button>
                  </div>

                  {/* Image picker */}
                  {imagePickerFor === img.id && (
                    <div className="space-y-2">
                      {/* URL input */}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customUrl}
                          onChange={e => setCustomUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-white/5 border border-white/8 focus:border-violet-500/60 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-colors placeholder-gray-600"
                        />
                        <button
                          onClick={() => {
                            if (customUrl.trim()) {
                              onImageChange(img.id, customUrl.trim())
                              setImagePickerFor(null)
                              setCustomUrl('')
                            }
                          }}
                          className="px-2 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Quick picks */}
                      <div className="grid grid-cols-3 gap-1">
                        {UNSPLASH_SUGGESTIONS.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              onImageChange(img.id, url)
                              setImagePickerFor(null)
                            }}
                            className="h-10 rounded-md overflow-hidden border border-white/8 hover:border-violet-500/60 transition-colors"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Block Editor ─────────────────────────────────────────────────────────────
interface BlockEditorProps {
  code: string
  onApply: (newCode: string) => Promise<void>
}

export default function BlockEditor({ code, onApply }: BlockEditorProps) {
  const [blocks,    setBlocks]    = useState<Block[]>([])
  const [preamble,  setPreamble]  = useState('')
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set())
  const [applying,  setApplying]  = useState(false)
  const [dirty,     setDirty]     = useState(false)
  const dragIndex = useRef<number | null>(null)

  // Parse on mount or when code changes externally
  useEffect(() => {
    if (!code) return
    const { preamble: pre, blocks: parsed } = parseBlocks(code)
    setPreamble(pre)
    setBlocks(parsed)
    setDirty(false)
    // Auto-expand first real content block
    if (parsed.length > 0) {
      setExpanded(new Set([parsed[0].id]))
    }
  }, [code])

  const updateBlock = (id: string, updater: (b: Block) => Block) => {
    setBlocks(prev => prev.map(b => b.id === id ? updater(b) : b))
    setDirty(true)
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Drag & drop
  const handleDragStart = (_e: React.DragEvent, index: number) => {
    dragIndex.current = index
  }

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault()
  }

  const handleDrop = (_e: React.DragEvent, dropIndex: number) => {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return
    const next = [...blocks]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(dropIndex, 0, moved)
    setBlocks(next)
    dragIndex.current = null
    setDirty(true)
  }

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragOverWithIndex = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDropWithIndex = (e: React.DragEvent, index: number) => {
    handleDrop(e, index)
    setDragOverIndex(null)
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      const newCode = reconstructCode(preamble, blocks)
      await onApply(newCode)
      setDirty(false)
    } finally {
      setApplying(false)
    }
  }

  if (!blocks.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-sm">
        Aucun bloc détecté
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
        <div>
          <p className="text-sm font-bold">Blocs</p>
          <p className="text-[11px] text-gray-500">{blocks.length} section{blocks.length > 1 ? 's' : ''} · glisser pour réordonner</p>
        </div>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 min-h-0">
        {blocks.map((block, index) => (
          <BlockCard
            key={block.id}
            block={block}
            index={index}
            expanded={expanded.has(block.id)}
            onToggleExpand={() => toggleExpand(block.id)}
            onToggleHide={() => updateBlock(block.id, b => ({ ...b, hidden: !b.hidden }))}
            onDelete={() => {
              setBlocks(prev => prev.filter(b => b.id !== block.id))
              setDirty(true)
            }}
            onTextChange={(textId, value) =>
              updateBlock(block.id, b => applyTextEdit(b, textId, value))
            }
            onImageChange={(imageId, url) =>
              updateBlock(block.id, b => applyImageEdit(b, imageId, url))
            }
            onDragStart={handleDragStart}
            onDragOver={handleDragOverWithIndex}
            onDrop={handleDropWithIndex}
            isDragOver={dragOverIndex === index}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-white/8">
        <button
          onClick={handleApply}
          disabled={!dirty || applying}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white disabled:cursor-not-allowed"
        >
          {applying ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Application…</>
          ) : (
            'Appliquer les modifications'
          )}
        </button>
        {!dirty && (
          <p className="text-center text-[10px] text-gray-600 mt-1.5">Modifie un bloc pour activer</p>
        )}
      </div>
    </div>
  )
}
