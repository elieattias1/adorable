'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit2, Check, ShoppingBag, Package, Clock, ChefHat, CheckCircle, Bike, XCircle, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { BAKERY_PRODUCTS } from '@/lib/bakery-photos'

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id:          string
  name:        string
  description: string | null
  price:       number  // cents
  category:    string
  photo_url:   string | null
  emoji:       string | null
  active:      boolean
  sort_order:  number
}

type Order = {
  id:             string
  customer_name:  string
  customer_email: string
  customer_phone: string | null
  status:         string
  total_cents:    number
  note:           string | null
  pickup_at:      string | null
  created_at:     string
  order_items:    { name: string; quantity: number; price_cents: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready:     'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  preparing: 'En préparation',
  ready:     'Prêt',
  delivered: 'Récupéré',
  cancelled: 'Annulé',
}

const STATUS_NEXT: Record<string, string | null> = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'delivered',
  delivered: null,
  cancelled: null,
}

const CATEGORY_LABELS: Record<string, string> = {
  pain:         '🥖 Pains',
  viennoiserie: '🥐 Viennoiseries',
  patisserie:   '🎂 Pâtisseries',
  entremet:     '🎂 Entremets / Gâteaux',
  snack:        '🥪 Snacks / Salé',
  boisson:      '☕ Boissons',
  service:      '🛍 Services',
  other:        '🛍 Autres',
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function ShopPanel({ siteId, hideOrders }: { siteId: string; hideOrders?: boolean }) {
  const [tab,            setTab]           = useState<'products' | 'orders'>('products')
  const [products,       setProducts]      = useState<Product[]>([])
  const [orders,         setOrders]        = useState<Order[]>([])
  const [loading,        setLoading]       = useState(true)
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [editingId,      setEditingId]     = useState<string | null>(null)

  useEffect(() => { loadAll() }, [siteId])

  const loadAll = async () => {
    setLoading(true)
    const [productsRes, ordersRes] = await Promise.all([
      fetch(`/api/products?siteId=${siteId}`).then(r => r.json()),
      fetch(`/api/orders?siteId=${siteId}`).then(r => r.json()),
    ])
    setProducts(productsRes.products ?? [])
    setOrders(ordersRes.orders ?? [])
    setLoading(false)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const handleOrderStatus = async (id: string, status: string) => {
    const res  = await fetch('/api/orders', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status }),
    })
    const data = await res.json()
    if (data.order) setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      {!hideOrders && (
        <div className="flex border-b border-gray-200 px-4 pt-3 flex-shrink-0 gap-1">
          {([
            { key: 'products', label: 'Produits',                                                       icon: Package },
            { key: 'orders',   label: `Commandes${activeOrders > 0 ? ` (${activeOrders})` : ''}`,      icon: ShoppingBag },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                tab === key
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'products' ? (
          <ProductsTab
            products={products}
            siteId={siteId}
            onDelete={handleDeleteProduct}
            onRefresh={loadAll}
            showNew={showNewProduct}
            setShowNew={setShowNewProduct}
            editingId={editingId}
            setEditingId={setEditingId}
          />
        ) : (
          <OrdersTab orders={orders} onStatusChange={handleOrderStatus} />
        )}
      </div>
    </div>
  )
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({
  products, siteId, onDelete, onRefresh, showNew, setShowNew, editingId, setEditingId
}: {
  products:     Product[]
  siteId:       string
  onDelete:     (id: string) => void
  onRefresh:    () => void
  showNew:      boolean
  setShowNew:   (v: boolean) => void
  editingId:    string | null
  setEditingId: (v: string | null) => void
}) {
  const grouped = Object.entries(CATEGORY_LABELS).reduce<Record<string, Product[]>>((acc, [cat]) => {
    const items = products.filter(p => p.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const editingProduct = editingId ? products.find(p => p.id === editingId) : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{products.length} produit{products.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {CATEGORY_LABELS[cat]}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {items.map(p => (
              <ProductCard key={p.id} product={p} siteId={siteId} onEdit={() => setEditingId(p.id)} onDelete={() => onDelete(p.id)} onRefresh={onRefresh} />
            ))}
          </div>
        </div>
      ))}

      {products.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun produit — ajoutes-en un !</p>
          <button onClick={() => setShowNew(true)} className="mt-3 text-violet-600 text-xs hover:underline">
            Ajouter un produit
          </button>
        </div>
      )}

      {/* Modals */}
      {showNew && (
        <ProductModal siteId={siteId} onSave={() => { onRefresh(); setShowNew(false) }} onClose={() => setShowNew(false)} />
      )}
      {editingProduct && (
        <ProductModal siteId={siteId} product={editingProduct} onSave={() => { onRefresh(); setEditingId(null) }} onClose={() => setEditingId(null)} />
      )}
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, siteId, onEdit, onDelete, onRefresh }: {
  product:   Product
  siteId:    string
  onEdit:    () => void
  onDelete:  () => void
  onRefresh: () => void
}) {
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const uploadPhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('siteId', siteId)
    const res  = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) {
      await fetch('/api/products', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: product.id, photo_url: data.url }),
      })
      onRefresh()
    }
    setUploading(false)
  }

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${product.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title="Changer la photo"
        className="relative w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden group"
      >
        {product.photo_url ? (
          <img src={product.photo_url} className="w-full h-full object-cover" alt={product.name} />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-lg">
            {product.emoji ?? '🛍'}
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Upload className="w-3.5 h-3.5 text-white" />
          }
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-xs text-gray-500">{(product.price / 100).toFixed(2).replace('.', ',')} €</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({ siteId, product, onSave, onClose }: {
  siteId:   string
  product?: Product
  onSave:   () => void
  onClose:  () => void
}) {
  const [name,        setName]        = useState(product?.name ?? '')
  const [price,       setPrice]       = useState(product ? (product.price / 100).toFixed(2) : '')
  const [category,    setCategory]    = useState(product?.category ?? 'other')
  const [photoUrl,    setPhotoUrl]    = useState(product?.photo_url ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [active,      setActive]      = useState(product?.active ?? true)
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)
  const [uploading,   setUploading]   = useState(false)
  const [dragOver,    setDragOver]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('siteId', siteId)
    const res  = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setPhotoUrl(data.url)
    setUploading(false)
  }

  const fillFromLibrary = (slug: string) => {
    const p = BAKERY_PRODUCTS.find(b => b.slug === slug)
    if (!p) return
    setName(p.name)
    setPrice(p.price.toFixed(2))
    const catMap: Record<string, string> = { entremet: 'patisserie', service: 'other' }
    setCategory(catMap[p.category] ?? p.category)
    setPhotoUrl(p.photos[0] ?? '')
  }

  const handleSave = async () => {
    if (!name.trim() || !price) return
    setSaving(true)
    setSaveError(null)
    const body: Record<string, unknown> = {
      ...(product ? { id: product.id } : { site_id: siteId }),
      name:     name.trim(),
      price:    Math.round(parseFloat(price) * 100),
      category,
      active,
    }
    if (photoUrl.trim())    body.photo_url   = photoUrl.trim()
    if (description.trim()) body.description = description.trim()

    const res  = await fetch('/api/products', {
      method:  product ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setSaveError(data.error ?? "Erreur lors de l'enregistrement"); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Library shortcuts (new product only) */}
          {!product && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Remplir depuis la bibliothèque</p>
              <div className="flex flex-wrap gap-1.5">
                {BAKERY_PRODUCTS.slice(0, 10).map(p => (
                  <button key={p.slug} onClick={() => fillFromLibrary(p.slug)}
                    className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-violet-100 hover:text-violet-700 border border-transparent hover:border-violet-200 text-gray-600 transition-colors">
                    {p.emoji} {p.name.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Photo */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Photo</label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
            {photoUrl ? (
              <div className="relative group w-full h-36 rounded-xl overflow-hidden border border-gray-200">
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white rounded-lg text-xs font-medium text-gray-800 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Changer
                  </button>
                  <button type="button" onClick={() => setPhotoUrl('')}
                    className="p-1.5 bg-white/90 hover:bg-white rounded-lg text-red-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && uploadFile(e.dataTransfer.files[0]) }}
                className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${dragOver ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'}`}
              >
                {uploading
                  ? <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  : <><Upload className="w-5 h-5 text-gray-300" /><span className="text-xs text-gray-400">Cliquer ou déposer une image</span></>
                }
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nom *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Croissant au beurre"
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10" />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Prix (€) *</label>
              <input value={price} onChange={e => setPrice(e.target.value)} placeholder="1.40"
                type="number" step="0.01" min="0.01"
                className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Catégorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 bg-white">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description <span className="font-normal text-gray-400">(optionnel)</span></label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex : Pur beurre AOP, feuilletage maison"
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10" />
          </div>

          {/* Visibility */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className={`relative w-9 h-5 rounded-full transition-colors ${active ? 'bg-violet-600' : 'bg-gray-200'}`}
              onClick={() => setActive(v => !v)}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-700">Visible sur le site</span>
          </label>

          {saveError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">{saveError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim() || !price}
            className="px-5 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders, onStatusChange }: {
  orders:         Order[]
  onStatusChange: (id: string, status: string) => void
}) {
  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const past   = orders.filter(o =>  ['delivered', 'cancelled'].includes(o.status))

  const OrderCard = ({ order }: { order: Order }) => {
    const next = STATUS_NEXT[order.status]
    return (
      <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{order.customer_name}</p>
            <p className="text-xs text-gray-400">{order.customer_email}{order.customer_phone ? ` · ${order.customer_phone}` : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
            <p className="text-sm font-bold text-gray-900">{(order.total_cents / 100).toFixed(2).replace('.', ',')} €</p>
          </div>
        </div>

        <div className="space-y-0.5">
          {order.order_items.map((item, i) => (
            <p key={i} className="text-xs text-gray-600">
              {item.quantity}× {item.name} — {(item.price_cents / 100).toFixed(2).replace('.', ',')} €
            </p>
          ))}
        </div>

        {order.note && (
          <p className="text-xs text-orange-700 bg-orange-50 rounded-lg px-2 py-1">💬 {order.note}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-gray-400">
            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
          {next && (
            <button
              onClick={() => onStatusChange(order.id, next)}
              className="text-[10px] px-2.5 py-1 bg-gray-900 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              → {STATUS_LABELS[next]}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (orders.length === 0) return (
    <div className="text-center py-10 text-gray-400">
      <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">Aucune commande pour l'instant</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">En cours ({active.length})</p>
          {active.map(o => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Terminées ({past.length})</p>
          {past.map(o => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  )
}
