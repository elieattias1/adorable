'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Package, Clock, CheckCircle, ChefHat, Bike, XCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id:          string
  name:        string
  quantity:    number
  price_cents: number
  photo_url:   string | null
}

interface Order {
  id:             string
  customer_name:  string
  customer_email: string
  customer_phone: string | null
  status:         string
  total_cents:    number
  note:           string | null
  pickup_at:      string | null
  created_at:     string
  items?:         OrderItem[]
}

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:   { label: 'En attente',   color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   icon: Clock },
  preparing: { label: 'En prépa',     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: ChefHat },
  ready:     { label: 'Prêt',         color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: CheckCircle },
  delivered: { label: 'Récupéré',     color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     icon: Bike },
  cancelled: { label: 'Annulé',       color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       icon: XCircle },
}

const STATUS_NEXT: Record<string, OrderStatus | null> = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'delivered',
  delivered: null,
  cancelled: null,
}

const STATUS_NEXT_LABEL: Record<string, string> = {
  pending:   '→ En préparation',
  preparing: '→ Prêt à récupérer',
  ready:     '→ Récupéré',
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, status: OrderStatus) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const cfg      = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const nextStep = STATUS_NEXT[order.status]
  const Icon     = cfg.icon

  const handleAdvance = async () => {
    if (!nextStep) return
    setUpdating(true)
    await onStatusChange(order.id, nextStep)
    setUpdating(false)
  }

  return (
    <div className={`border rounded-xl overflow-hidden ${cfg.bg}`}>
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900 truncate">{order.customer_name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(order.created_at)}
            {order.pickup_at && <span className="ml-2 text-orange-600 font-medium">Retrait {formatDate(order.pickup_at)}</span>}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-bold text-sm text-gray-900">{formatPrice(order.total_cents)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-current/10 bg-white px-4 py-3 space-y-3">
          {/* Contact */}
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>{order.customer_email}</p>
            {order.customer_phone && <p>{order.customer_phone}</p>}
            {order.note && (
              <p className="text-amber-700 font-medium mt-1">💬 {order.note}</p>
            )}
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-1">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}× {item.name}</span>
                  <span className="text-gray-500">{formatPrice(item.price_cents * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100">
                <span>Total</span>
                <span>{formatPrice(order.total_cents)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {nextStep && (
              <button
                onClick={handleAdvance}
                disabled={updating}
                className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {updating ? '…' : STATUS_NEXT_LABEL[order.status]}
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button
                onClick={() => onStatusChange(order.id, 'cancelled')}
                disabled={updating}
                className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function OrdersPanel({ siteId }: { siteId: string }) {
  const [orders,       setOrders]       = useState<Order[]>([])
  const [loading,      setLoading]      = useState(true)
  const [activeStatus, setActiveStatus] = useState<string>('active')

  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [siteId])

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const visible = activeStatus === 'active'
    ? orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
    : activeStatus === 'all'
    ? orders
    : orders.filter(o => o.status === activeStatus)

  const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'active',    label: `En cours${activeCount ? ` (${activeCount})` : ''}` },
            { key: 'all',       label: 'Toutes' },
            { key: 'pending',   label: 'En attente' },
            { key: 'preparing', label: 'En prépa' },
            { key: 'ready',     label: 'Prêtes' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveStatus(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeStatus === f.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Chargement…</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
          <Package className="w-8 h-8" />
          <p className="text-sm">Aucune commande</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(order => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
