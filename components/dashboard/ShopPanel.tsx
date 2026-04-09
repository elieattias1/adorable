'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, ShoppingBag, Package, Clock, ChefHat, CheckCircle, Bike, XCircle } from 'lucide-react'
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

export default function ShopPanel({ siteId }: { siteId: string }) {
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

      {showNew && (
        <ProductForm siteId={siteId} onSave={onRefresh} onCancel={() => setShowNew(false)} />
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {CATEGORY_LABELS[cat]}
          </p>
          <div className="space-y-2">
            {items.map(p => (
              editingId === p.id ? (
                <ProductForm
                  key={p.id}
                  siteId={siteId}
                  product={p}
                  onSave={() => { onRefresh(); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${p.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  {p.photo_url ? (
                    <img src={p.photo_url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt={p.name} />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      {p.emoji ?? '🛍'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{(p.price / 100).toFixed(2).replace('.', ',')} €</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditingId(p.id)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      ))}

      {products.length === 0 && !showNew && (
        <div className="text-center py-10 text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun produit — ajoutes-en un !</p>
          <button onClick={() => setShowNew(true)} className="mt-3 text-violet-600 text-xs hover:underline">
            Ajouter un produit
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Product Form ─────────────────────────────────────────────────────────────

function ProductForm({ siteId, product, onSave, onCancel }: {
  siteId:    string
  product?:  Product
  onSave:    () => void
  onCancel:  () => void
}) {
  const [name,        setName]        = useState(product?.name ?? '')
  const [price,       setPrice]       = useState(product ? (product.price / 100).toFixed(2) : '')
  const [category,    setCategory]    = useState(product?.category ?? 'other')
  const [photoUrl,    setPhotoUrl]    = useState(product?.photo_url ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [active,      setActive]      = useState(product?.active ?? true)
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)

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
    <div className="border border-violet-200 rounded-xl p-3 bg-violet-50/50 space-y-2.5">
      <p className="text-xs font-semibold text-violet-700">{product ? 'Modifier le produit' : 'Nouveau produit'}</p>

      {!product && (
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Remplir depuis la bibliothèque :</p>
          <div className="flex flex-wrap gap-1">
            {BAKERY_PRODUCTS.slice(0, 8).map(p => (
              <button key={p.slug} onClick={() => fillFromLibrary(p.slug)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 hover:border-violet-300 text-gray-600">
                {p.emoji} {p.name.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du produit *"
        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-violet-400 focus:outline-none" />

      <div className="flex gap-2">
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Prix (ex: 1.40) *"
          type="number" step="0.01" min="0.01"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-violet-400 focus:outline-none" />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-violet-400 focus:outline-none">
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="URL photo (optionnel)"
        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-violet-400 focus:outline-none" />

      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description courte (optionnel)"
        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-violet-400 focus:outline-none" />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
          Visible sur le site
        </label>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 rounded-lg border border-gray-200">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim() || !price}
            className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-1">
            {saving ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
            Enregistrer
          </button>
        </div>
      </div>
      {saveError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">{saveError}</p>
      )}
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
