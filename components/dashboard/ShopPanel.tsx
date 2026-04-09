'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, ShoppingBag, CreditCard, Package, ExternalLink, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'
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
  read_at:        string | null
  order_items:    { name: string; quantity: number; price_cents: number }[]
}

type ConnectStatus = {
  connected:     boolean
  onboarded:     boolean
  ordersEnabled: boolean
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  paid:      'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready:     'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  paid:      'Payée',
  preparing: 'En préparation',
  ready:     'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const CATEGORY_LABELS: Record<string, string> = {
  pain:        '🥖 Pains',
  viennoiserie: '🥐 Viennoiseries',
  patisserie:  '🎂 Pâtisseries',
  entremet:    '🎂 Entremets / Gâteaux',
  snack:       '🥪 Snacks / Salé',
  boisson:     '☕ Boissons',
  service:     '🛍 Services / Commandes',
  other:       '🛍 Autres',
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface ShopPanelProps {
  siteId: string
}

type Tab = 'products' | 'orders' | 'setup'

export default function ShopPanel({ siteId }: ShopPanelProps) {
  const [tab,           setTab]           = useState<Tab>('products')
  const [products,      setProducts]      = useState<Product[]>([])
  const [orders,        setOrders]        = useState<Order[]>([])
  const [connect,       setConnect]       = useState<ConnectStatus | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [connectLoading, setConnectLoading] = useState(false)
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [editingId,     setEditingId]     = useState<string | null>(null)

  useEffect(() => { loadAll() }, [siteId])

  const loadAll = async () => {
    setLoading(true)
    const [productsRes, ordersRes, connectRes] = await Promise.all([
      fetch(`/api/products?siteId=${siteId}`).then(r => r.json()),
      fetch(`/api/orders?siteId=${siteId}`).then(r => r.json()),
      fetch('/api/stripe/connect').then(r => r.json()),
    ])
    setProducts(productsRes.products ?? [])
    setOrders(ordersRes.orders ?? [])
    setConnect(connectRes)
    setLoading(false)
  }

  const handleConnectStripe = async () => {
    setConnectLoading(true)
    const res = await fetch('/api/stripe/connect', { method: 'POST' })
    const { url, alreadyOnboarded } = await res.json()
    if (alreadyOnboarded) { await loadAll(); setConnectLoading(false); return }
    if (url) window.open(url, '_blank')
    setConnectLoading(false)
  }

  const handleToggleOrders = async () => {
    if (!connect) return
    const res = await fetch('/api/stripe/connect', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordersEnabled: !connect.ordersEnabled }),
    })
    const data = await res.json()
    if (!data.error) setConnect(prev => prev ? { ...prev, ordersEnabled: data.ordersEnabled } : prev)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const handleOrderStatus = async (id: string, status: string) => {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const data = await res.json()
    if (data.order) setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const unreadOrders = orders.filter(o => !o.read_at && o.status === 'paid').length

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4 pt-3 flex-shrink-0 gap-1">
        {([
          { key: 'products', label: 'Produits', icon: Package },
          { key: 'orders',   label: `Commandes${unreadOrders > 0 ? ` (${unreadOrders})` : ''}`, icon: ShoppingBag },
          { key: 'setup',    label: 'Configuration', icon: CreditCard },
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
        ) : (
          <>
            {tab === 'products' && (
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
            )}
            {tab === 'orders' && (
              <OrdersTab orders={orders} onStatusChange={handleOrderStatus} />
            )}
            {tab === 'setup' && (
              <SetupTab
                connect={connect}
                onConnect={handleConnectStripe}
                onToggleOrders={handleToggleOrders}
                connectLoading={connectLoading}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({
  products, siteId, onDelete, onRefresh, showNew, setShowNew, editingId, setEditingId
}: {
  products: Product[]
  siteId: string
  onDelete: (id: string) => void
  onRefresh: () => void
  showNew: boolean
  setShowNew: (v: boolean) => void
  editingId: string | null
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
        <ProductForm
          siteId={siteId}
          onSave={onRefresh}
          onCancel={() => setShowNew(false)}
        />
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
                    <img src={p.photo_url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      {p.emoji ?? '🛍'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{(p.price / 100).toFixed(2).replace('.', ',')}€</p>
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

function ProductForm({
  siteId, product, onSave, onCancel
}: {
  siteId: string
  product?: Product
  onSave: () => void
  onCancel: () => void
}) {
  const [name,        setName]        = useState(product?.name ?? '')
  const [price,       setPrice]       = useState(product ? (product.price / 100).toFixed(2) : '')
  const [category,    setCategory]    = useState(product?.category ?? 'other')
  const [photoUrl,    setPhotoUrl]    = useState(product?.photo_url ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [active,      setActive]      = useState(product?.active ?? true)
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)

  // Quick-fill from library
  const fillFromLibrary = (slug: string) => {
    const p = BAKERY_PRODUCTS.find(b => b.slug === slug)
    if (!p) return
    setName(p.name)
    setPrice((p.price).toFixed(2))
    // Map library categories to valid API categories
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
      method: product ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setSaveError(data.error ?? 'Erreur lors de l\'enregistrement')
      return
    }
    onSave()
  }

  return (
    <div className="border border-violet-200 rounded-xl p-3 bg-violet-50/50 space-y-2.5">
      <p className="text-xs font-semibold text-violet-700">{product ? 'Modifier le produit' : 'Nouveau produit'}</p>

      {/* Quick-fill from library */}
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

function OrdersTab({ orders, onStatusChange }: { orders: Order[], onStatusChange: (id: string, status: string) => void }) {
  const NEXT_STATUS: Record<string, string | null> = {
    paid:      'preparing',
    preparing: 'ready',
    ready:     'delivered',
    delivered: null,
    cancelled: null,
    pending:   null,
  }

  return (
    <div className="space-y-3">
      {orders.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucune commande pour l'instant</p>
        </div>
      )}
      {orders.map(order => (
        <div key={order.id} className="border border-gray-200 rounded-xl p-3 bg-white">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.customer_name}</p>
              <p className="text-xs text-gray-500">{order.customer_email}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100'}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
              <p className="text-sm font-bold text-gray-900">{(order.total_cents / 100).toFixed(2).replace('.', ',')}€</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-0.5 mb-2">
            {order.order_items.map((item, i) => (
              <p key={i} className="text-xs text-gray-600">
                {item.quantity}× {item.name} — {(item.price_cents / 100).toFixed(2).replace('.', ',')}€
              </p>
            ))}
          </div>

          {order.note && (
            <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1 mb-2">Note : {order.note}</p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
            {NEXT_STATUS[order.status] && (
              <button
                onClick={() => onStatusChange(order.id, NEXT_STATUS[order.status]!)}
                className="text-[10px] px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium"
              >
                → {STATUS_LABELS[NEXT_STATUS[order.status]!]}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Setup Tab ────────────────────────────────────────────────────────────────

function SetupTab({
  connect, onConnect, onToggleOrders, connectLoading
}: {
  connect: ConnectStatus | null
  onConnect: () => void
  onToggleOrders: () => void
  connectLoading: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Stripe Connect status */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-gray-700" />
          <p className="text-sm font-semibold text-gray-900">Paiements Stripe</p>
        </div>

        {connect?.onboarded ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-medium">Compte Stripe connecté — tes clients peuvent payer en ligne</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">Commandes en ligne</p>
                <p className="text-[10px] text-gray-400">Affiche le bouton "Commander" sur ton site</p>
              </div>
              <button onClick={onToggleOrders}
                className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  connect.ordersEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {connect.ordersEnabled
                  ? <><ToggleRight className="w-4 h-4" /> Activé</>
                  : <><ToggleLeft className="w-4 h-4" /> Désactivé</>
                }
              </button>
            </div>
          </div>
        ) : connect?.connected ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs">Configuration Stripe en cours — finalise ton inscription pour activer les paiements.</p>
            </div>
            <button onClick={onConnect} disabled={connectLoading}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {connectLoading
                ? <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                : <ExternalLink className="w-3.5 h-3.5" />}
              Reprendre l'inscription Stripe
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Connecte ton compte bancaire via Stripe pour recevoir les paiements directement. La configuration prend environ <strong>5 minutes</strong> — tu as juste besoin de ton IBAN.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Comment ça marche</p>
              <p className="text-xs text-gray-600">1. Clique ci-dessous → formulaire Stripe sécurisé</p>
              <p className="text-xs text-gray-600">2. Saisis ton nom, IBAN, et une pièce d'identité</p>
              <p className="text-xs text-gray-600">3. Reviens ici → les paiements sont activés</p>
              <p className="text-xs text-gray-400 mt-1">Adorable prend une commission de 5% par commande. Stripe prend 1,5% + 0,25€.</p>
            </div>
            <button onClick={onConnect} disabled={connectLoading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {connectLoading
                ? <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                : <CreditCard className="w-4 h-4" />}
              Connecter mon compte bancaire
            </button>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="border border-blue-100 rounded-xl p-3 bg-blue-50">
        <p className="text-[11px] text-blue-700 leading-relaxed">
          <strong>Tes virements :</strong> Stripe verse automatiquement l'argent sur ton compte bancaire chaque lundi. Tu peux suivre tes paiements directement depuis ton tableau de bord Stripe.
        </p>
      </div>
    </div>
  )
}
