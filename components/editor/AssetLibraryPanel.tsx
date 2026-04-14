'use client'

import { useState, useRef } from 'react'
import { Check, Copy, Image, Search, X, Loader2 } from 'lucide-react'
import { BAKERY_PRODUCTS } from '@/lib/bakery-photos'

interface UnsplashResult {
  id: string; url: string; thumb: string; alt: string; user: string
}

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
  const [activeCategory,  setActiveCategory]  = useState<string>('pain')
  const [copiedUrl,       setCopiedUrl]        = useState<string | null>(null)
  const [searchQuery,     setSearchQuery]      = useState('')
  const [searchResults,   setSearchResults]    = useState<UnsplashResult[] | null>(null)
  const [searching,       setSearching]        = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const products = BAKERY_PRODUCTS.filter(p => p.category === activeCategory)

  const runSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/unsplash?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      setSearchResults(data.results ?? [])
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    inputRef.current?.focus()
  }

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

      {/* Unsplash search */}
      <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <form onSubmit={e => { e.preventDefault(); runSearch(searchQuery) }} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher sur Unsplash…"
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400"
          />
          {searchQuery && (
            <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </form>
      </div>

      {/* Category tabs — hidden when searching */}
      {!searchResults && <div className="flex gap-1 px-3 py-2 overflow-x-auto flex-shrink-0 scrollbar-none border-b border-gray-100">
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
      </div>}

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Unsplash results */}
        {searching && (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Recherche…</span>
          </div>
        )}

        {!searching && searchResults && (
          searchResults.length === 0
            ? <p className="text-xs text-gray-400 text-center py-8">Aucun résultat pour « {searchQuery} »</p>
            : <div className="grid grid-cols-2 gap-2">
                {searchResults.map(photo => {
                  const isCopied = copiedUrl === photo.url
                  return (
                    <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={photo.thumb} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-1.5">
                        <button onClick={() => handleCopy(photo.url)} title="Copier l'URL"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-lg shadow hover:bg-gray-50">
                          {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-700" />}
                        </button>
                        {onInsertUrl && (
                          <button onClick={() => onInsertUrl(photo.url)} title="Insérer dans le chat"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-violet-600 rounded-lg shadow hover:bg-violet-500">
                            <Image className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                      {isCopied && <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">Copié !</div>}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] text-white/80 truncate">© {photo.user}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
        )}

        {/* Bakery library — shown when not searching */}
        {!searchResults && !searching && <div className="flex flex-col gap-4">
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
        </div>}
      </div>
    </div>
  )
}
