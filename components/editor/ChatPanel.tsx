'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Zap, ImagePlus, X, ChevronDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentStep {
  name: string
  icon: string
  label: string
  done?: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string        // legacy single image (from DB history)
  imageUrls?: string[]     // new: multi-image
  created_at: string
  steps?: AgentStep[]
  isThinking?: boolean
  askOptions?: string[]
}

// ─── Context-aware suggestions by site type ───────────────────────────────────

const SUGGESTIONS_BY_TYPE: Record<string, string[]> = {
  restaurant: [
    'Ajoute une carte des vins élaborée',
    'Ajoute un module de réservation en ligne',
    'Ajoute une galerie photos des plats signature',
    'Ajoute une section "Notre Chef" avec portrait',
    'Ajoute les horaires et l\'adresse en footer',
    'Ajoute des témoignages clients avec étoiles',
    'Mets en avant le menu du jour',
    'Ajoute une section événements privés',
  ],
  bakery: [
    'Ajoute une vitrine des viennoiseries du jour',
    'Ajoute les horaires d\'ouverture avec icônes',
    'Ajoute une section "Notre Histoire"',
    'Ajoute un module commande en ligne',
    'Ajoute une galerie du fournil',
    'Améliore le texte du hero avec une accroche poétique',
    'Ajoute les prix sur les produits phares',
    'Ajoute une section livraison ou click & collect',
  ],
  saas: [
    'Ajoute une section pricing avec 3 plans',
    'Ajoute une FAQ avec 6 questions fréquentes',
    'Ajoute des logos de clients en social proof',
    'Ajoute une démo vidéo ou screenshot du produit',
    'Ajoute une section témoignages avec avatars',
    'Améliore le CTA principal avec urgence',
    'Ajoute des métriques clés (utilisateurs, uptime…)',
    'Ajoute une section intégrations ou API',
  ],
  portfolio: [
    'Ajoute une grille de projets avec images',
    'Ajoute une section "À propos" avec photo',
    'Ajoute un formulaire de contact minimal',
    'Ajoute tes compétences techniques',
    'Ajoute des logos clients ou marques avec qui tu as travaillé',
    'Rends le design encore plus minimaliste',
    'Ajoute une section services ou prestations',
    'Ajoute tes réseaux sociaux dans le footer',
  ],
  shop: [
    'Ajoute une bannière promotionnelle en haut',
    'Ajoute une section "Nouveautés"',
    'Ajoute des badges "Bestseller" et "Nouveau"',
    'Ajoute les avis clients avec étoiles',
    'Ajoute une section livraison & retours',
    'Ajoute une newsletter avec réduction',
    'Ajoute une galerie Instagram',
    'Ajoute un système de filtres par catégorie',
  ],
  wellness: [
    'Ajoute une liste de soins avec durées et prix',
    'Ajoute un module de réservation de rendez-vous',
    'Ajoute une section "Nos thérapeutes"',
    'Ajoute des témoignages clients apaisants',
    'Ajoute les horaires et l\'adresse',
    'Ajoute une galerie de l\'espace',
    'Mets le design en mode clair et apaisant',
    'Ajoute une section forfaits et abonnements',
  ],
  default: [
    'Ajoute une section témoignages avec étoiles',
    'Ajoute un formulaire de contact complet',
    'Ajoute une FAQ avec 5 questions',
    'Améliore le texte du hero',
    'Ajoute une section équipe',
    'Change la palette de couleurs',
    'Ajoute des animations plus dynamiques',
    'Rends le footer plus riche',
  ],
}

function getSuggestions(siteType?: string): string[] {
  if (!siteType) return SUGGESTIONS_BY_TYPE.default
  if (SUGGESTIONS_BY_TYPE[siteType]) return SUGGESTIONS_BY_TYPE[siteType]
  // Fuzzy match
  if (siteType.includes('restaurant') || siteType.includes('food') || siteType.includes('cafe')) return SUGGESTIONS_BY_TYPE.restaurant
  if (siteType.includes('bak') || siteType.includes('boulan')) return SUGGESTIONS_BY_TYPE.bakery
  if (siteType.includes('shop') || siteType.includes('store')) return SUGGESTIONS_BY_TYPE.shop
  if (siteType.includes('well') || siteType.includes('spa')) return SUGGESTIONS_BY_TYPE.wellness
  if (siteType.includes('portfolio') || siteType.includes('creative')) return SUGGESTIONS_BY_TYPE.portfolio
  if (siteType.includes('saas') || siteType.includes('tech')) return SUGGESTIONS_BY_TYPE.saas
  return SUGGESTIONS_BY_TYPE.default
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_MB   = 5
const MAX_IMGS = 4

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  messages: ChatMessage[]
  isGenerating: boolean
  onSend: (message: string, imageFiles?: File[]) => void
  streamingText?: string
  currentSteps?: AgentStep[]
  siteType?: string
}

// ─── Agent thinking bubble ────────────────────────────────────────────────────

function ThinkingBubble({ text, steps }: { text: string; steps: AgentStep[] }) {
  return (
    <div className="flex justify-start">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
        <Zap className="w-3 h-3" />
      </div>
      <div className="max-w-[85%] flex flex-col gap-2">
        {/* Thinking text */}
        {text && (
          <div className="text-sm px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-white/8 text-gray-300 leading-relaxed italic">
            {text}
            <span className="inline-block w-1 h-3.5 bg-violet-400 ml-1 animate-pulse rounded-sm" />
          </div>
        )}
        {/* Tool steps */}
        {steps.map((step, i) => (
          <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
            step.done
              ? 'bg-white/5 border border-white/8 text-gray-500'
              : 'bg-violet-950/40 border border-violet-800/30 text-violet-300'
          }`}>
            <span>{step.icon}</span>
            <span className="flex-1">{step.label}</span>
            {!step.done && (
              <div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </div>
        ))}
        {/* Dots if no text yet */}
        {!text && steps.length === 0 && (
          <div className="bg-white/8 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Completed assistant message ──────────────────────────────────────────────

function AssistantMessage({ msg, onSendOption }: { msg: ChatMessage; onSendOption: (opt: string) => void }) {
  const [stepsOpen, setStepsOpen] = useState(false)
  const hasSteps = msg.steps && msg.steps.length > 0

  return (
    <div className="flex justify-start">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
        <Zap className="w-3 h-3" />
      </div>
      <div className="max-w-[85%] flex flex-col gap-1.5">
        {/* Steps disclosure (collapsed by default) */}
        {hasSteps && (
          <button
            onClick={() => setStepsOpen(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-violet-400/70 hover:text-violet-300 transition-colors self-start"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${stepsOpen ? 'rotate-180' : ''}`} />
            {msg.steps!.length} action{msg.steps!.length > 1 ? 's' : ''} effectuée{msg.steps!.length > 1 ? 's' : ''}
          </button>
        )}
        {stepsOpen && hasSteps && (
          <div className="flex flex-col gap-1">
            {msg.steps!.map((step, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-950/30 border border-violet-800/20 text-xs text-violet-400">
                <span>{step.icon}</span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        {msg.content && (
          <div className="text-sm px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-white/8 text-gray-200 leading-relaxed">
            {msg.content}
          </div>
        )}

        {/* Ask options — clickable to send as message */}
        {msg.askOptions && msg.askOptions.length > 0 && onSendOption && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {msg.askOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSendOption(opt)}
                className="text-xs px-3 py-1.5 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-300 hover:bg-violet-800/60 hover:border-violet-600/60 hover:text-white transition-all cursor-pointer"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

export default function ChatPanel({
  messages,
  isGenerating,
  onSend,
  streamingText = '',
  currentSteps = [],
  siteType,
}: ChatPanelProps) {
  const suggestions = getSuggestions(siteType)
  const [input,       setInput]       = useState('')
  const [imageFile,   setImageFile]   = useState<File | null>(null)
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null)
  const [imgError,    setImgError]    = useState<string | null>(null)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating, streamingText, currentSteps])

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_MB * 1024 * 1024) { setImgError(`Image trop grande (max ${MAX_MB} Mo)`); return }
    setImgError(null)
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(null); setPreviewUrl(null); setImgError(null)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const msg = input.trim()
    if ((!msg && !imageFile) || isGenerating) return
    onSend(msg, imageFile ?? undefined)
    setInput('')
    clearImage()
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const handleTextareaInput = () => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
  }

  const canSend = (input.trim().length > 0 || imageFile !== null) && !isGenerating

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-white/8">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-white/8 flex-shrink-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-semibold">Adorable</span>
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-violet-400">
            <div className="w-3.5 h-3.5 border border-violet-500 border-t-transparent rounded-full animate-spin" />
            Réflexion…
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">

        {/* Empty state */}
        {messages.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-4">Décris ce que tu veux modifier…</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.slice(0, 4).map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message history */}
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] flex flex-col gap-1.5 items-end">
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="image jointe" className="rounded-xl max-h-40 object-cover rounded-br-sm" />
                  )}
                  {msg.content && (
                    <div className="text-sm px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-gradient-to-br from-violet-600 to-pink-600 text-white leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <AssistantMessage msg={msg} onSendOption={onSend} />
            )}
          </div>
        ))}

        {/* Live agent thinking (while generating) */}
        {isGenerating && (
          <ThinkingBubble text={streamingText} steps={currentSteps} />
        )}

        {/* Suggestions after conversation */}
        {messages.length >= 2 && !isGenerating && (
          <div className="pt-2">
            <p className="text-[11px] text-gray-600 mb-2">Suggestions :</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 3).map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 border-t border-white/8">
        {previewUrl && (
          <div className="relative inline-flex mb-2 ml-1">
            <img src={previewUrl} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-white/10" />
            <button type="button" onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 border border-white/20 flex items-center justify-center hover:bg-gray-700 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {imgError && <p className="text-xs text-red-400 mb-1.5 ml-1">{imgError}</p>}

        <div className="flex items-end gap-2 bg-white/5 border border-white/10 focus-within:border-violet-500/60 rounded-xl px-3 py-2 transition-colors">
          <input ref={fileInputRef} type="file" accept={ACCEPTED} onChange={handleFileChange} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isGenerating}
            className="flex-shrink-0 text-gray-500 hover:text-gray-300 disabled:opacity-40 transition-colors pb-0.5" title="Joindre une image">
            <ImagePlus className="w-4 h-4" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onInput={handleTextareaInput}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            rows={1}
            maxLength={2000}
            placeholder={isGenerating ? 'L\'agent réfléchit…' : imageFile ? 'Décris ce que tu veux faire avec cette image…' : 'Modifie le site…'}
            className="flex-1 bg-transparent text-white text-sm outline-none resize-none placeholder-gray-600 leading-relaxed"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button type="submit" disabled={!canSend}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-40 flex items-center justify-center transition-all">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 text-center">
          Entrée pour envoyer · Shift+Entrée pour nouvelle ligne
        </p>
      </form>
    </div>
  )
}
