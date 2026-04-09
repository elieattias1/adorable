'use client'

import { useState } from 'react'
import { Check, Copy, X, Image } from 'lucide-react'
import { BAKERY_PRODUCTS } from '@/lib/bakery-photos'

const CATEGORY_LABELS: Record<string, string> = {
  pain:        '🥖 Pains',
  viennoiserie:'🥐 Viennoiseries',
  patisserie:  '🍰 Pâtisseries',
  entremet:    '🎂 Entremets',
  snack:       '🥪 Snacks',
  boisson:     '☕ Boissons',
  service:     '🎁 Services',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS)

interface AssetLibraryPanelProps {
  /** When provided, clicking a photo inserts its URL at the cursor in the chat */
  onInsertUrl?: (url: string) => void
}

export default function AssetLibraryPanel({ onInsertUrl }: AssetLibraryPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>('pain')
  const [copiedUrl,      setCopiedUrl]       = useState<string | null>(null)

  const products = BAKERY_PRODUCTS.filter(p => p.category === activeCategory)

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <Image className="w-4 h-4 text-violet-500" />
        <h2 className="text-sm font-semibold text-gray-900">Bibliothèque de photos</h2>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto flex-shrink-0 scrollbar-none border-b border-gray-100">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex-shrink-0 ${
              activeCategory === cat
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-4">
          {products.map(product => (
            <div key={product.slug}>
              {/* Product name */}
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                <span>{product.emoji}</span>
                <span>{product.name}</span>
                <span className="text-gray-400 font-normal">— {product.price.toFixed(2).replace('.', ',')} €</span>
              </p>

              {/* Photos */}
              <div className="grid grid-cols-3 gap-1.5">
                {product.photos.map((url, i) => {
                  const isCopied = copiedUrl === url
                  return (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={url}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopy(url)}
                          title="Copier l'URL"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50"
                        >
                          {isCopied
                            ? <Check className="w-3 h-3 text-green-600" />
                            : <Copy className="w-3 h-3 text-gray-700" />
                          }
                        </button>

                        {onInsertUrl && (
                          <button
                            onClick={() => onInsertUrl(url)}
                            title="Insérer dans le chat"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-violet-600 rounded-lg shadow-md hover:bg-violet-500"
                          >
                            <Image className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>

                      {/* Copied badge */}
                      {isCopied && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          Copié !
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Hero photo if different */}
                {product.hero && !product.photos.includes(product.hero) && (() => {
                  const url = product.hero
                  const isCopied = copiedUrl === url
                  return (
                    <div key="hero" className="relative group col-span-3 aspect-[3/1] rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={url}
                        alt={`${product.name} hero`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopy(url)}
                          title="Copier l'URL hero"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-1"
                        >
                          {isCopied
                            ? <Check className="w-3 h-3 text-green-600" />
                            : <Copy className="w-3 h-3 text-gray-700" />
                          }
                          <span className="text-[10px] text-gray-600 font-medium">Hero</span>
                        </button>
                        {onInsertUrl && (
                          <button
                            onClick={() => onInsertUrl(url)}
                            title="Insérer dans le chat"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-violet-600 rounded-lg shadow-md hover:bg-violet-500"
                          >
                            <Image className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                      {isCopied && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          Copié !
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
