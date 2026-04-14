'use client'

import { useEffect, useState } from 'react'
import { useSearchParams }     from 'next/navigation'
import { Suspense }            from 'react'
import { CheckCircle, ShoppingBag } from 'lucide-react'

interface Order {
  id:             string
  customer_name:  string
  customer_email: string
  total_cents:    number
  pickup_at:      string | null
  note:           string | null
  status:         string
}

function SuccessContent() {
  const params  = useSearchParams()
  const orderId = params.get('orderId')
  const siteId  = params.get('siteId')

  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) return
    // Poll until order is marked pending (webhook fires async)
    let attempts = 0
    const poll = async () => {
      const res  = await fetch(`/api/order-status?orderId=${orderId}`)
      const data = await res.json()
      if (data.order) setOrder(data.order)
      else if (attempts++ < 10) setTimeout(poll, 1500)
    }
    poll()
  }, [orderId])

  const formatPrice = (cents: number) =>
    (cents / 100).toFixed(2).replace('.', ',') + ' €'

  const formatPickup = (iso: string | null) => {
    if (!iso) return 'Dès que possible'
    return new Date(iso).toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Success card */}
        <div className="bg-white border border-green-200 rounded-2xl p-8 text-center shadow-sm mb-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Commande confirmée !</h1>
          <p className="text-sm text-gray-500 mb-6">
            Merci pour votre commande. Vous recevrez un email de confirmation.
          </p>

          {order ? (
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Commande</span>
                <span className="font-mono font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total payé</span>
                <span className="font-bold text-gray-900">{formatPrice(order.total_cents)}</span>
              </div>
              {order.pickup_at && (
                <div className="flex justify-between items-start text-sm gap-4">
                  <span className="text-gray-500 flex-shrink-0">Retrait prévu</span>
                  <span className="font-semibold text-violet-700 text-right">{formatPickup(order.pickup_at)}</span>
                </div>
              )}
              {order.note && (
                <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  💬 {order.note}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Chargement…
            </div>
          )}
        </div>

        {/* Back to site */}
        {siteId && (
          <div className="text-center">
            <a
              href={`/s/${siteId}`}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Retour à la boutique
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
