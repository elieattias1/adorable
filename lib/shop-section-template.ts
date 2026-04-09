/**
 * lib/shop-section-template.ts
 *
 * Returns the React source code for a ShopSection component.
 * This is injected into generated bakery sites when orders are enabled.
 * It's self-contained — no imports beyond react and lucide-react.
 *
 * The SITE_ID and API_URL are templated in at generation time.
 */

export function getShopSectionCode(siteId: string, apiUrl: string): string {
  return `
export function ShopSection() {
  const SITE_ID = '${siteId}'
  const API_URL = '${apiUrl}'

  const [products,    setProducts]    = useState([])
  const [cart,        setCart]        = useState({})       // { productId: quantity }
  const [showCart,    setShowCart]    = useState(false)
  const [customerName,  setCustomerName]  = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note,          setNote]          = useState('')
  const [loading,       setLoading]       = useState(true)
  const [checkingOut,   setCheckingOut]   = useState(false)
  const [error,         setError]         = useState(null)

  const CATEGORY_LABELS = {
    pain: '🥖 Pains', viennoiserie: '🥐 Viennoiseries',
    patisserie: '🎂 Pâtisseries', snack: '🥪 Snacks',
    boisson: '☕ Boissons', other: '🛍 Autres',
  }

  useEffect(() => {
    fetch(API_URL + '/api/products?siteId=' + SITE_ID)
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const categories = [...new Set(products.map(p => p.category))]
  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
    .filter(i => i.product)

  const totalCents = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0)
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0)

  const addToCart = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  const removeFromCart = (id) => setCart(prev => {
    const next = { ...prev, [id]: (prev[id] ?? 0) - 1 }
    if (next[id] <= 0) delete next[id]
    return next
  })

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Merci de renseigner ton nom et ton email.')
      return
    }
    setCheckingOut(true)
    setError(null)
    try {
      const res = await fetch(API_URL + '/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id:        SITE_ID,
          customer_name:  customerName.trim(),
          customer_email: customerEmail.trim(),
          customer_phone: customerPhone.trim() || undefined,
          note:           note.trim() || undefined,
          items: cartItems.map(i => ({ product_id: i.product.id, quantity: i.qty })),
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Erreur lors de la commande.')
      }
    } catch {
      setError('Erreur réseau — réessaie dans quelques instants.')
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </section>
  )

  if (products.length === 0) return null

  return (
    <section id="boutique" className="py-20 bg-[#fffbf5]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-orange-700 text-sm font-semibold tracking-widest uppercase mb-2">Notre boutique</p>
            <h2 className="text-4xl font-bold text-stone-900" style={{fontFamily:"'Playfair Display', serif"}}>Commander en ligne</h2>
            <p className="text-stone-500 mt-2">Commandez et récupérez en boulangerie — paiement sécurisé</p>
          </div>
          {totalItems > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-700 hover:bg-orange-800 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              🛒 Mon panier · {totalItems} article{totalItems > 1 ? 's' : ''} · {(totalCents / 100).toFixed(2).replace('.', ',')}€
            </button>
          )}
        </div>

        {categories.map(cat => (
          <div key={cat} className="mb-10">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">{CATEGORY_LABELS[cat] ?? cat}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.filter(p => p.category === cat).map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {product.photo_url && (
                    <img src={product.photo_url} alt={product.name}
                      className="w-full h-36 object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-stone-900 leading-tight">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{product.description}</p>
                    )}
                    <p className="text-orange-700 font-bold text-sm mt-1.5">{(product.price / 100).toFixed(2).replace('.', ',')}€</p>
                    <div className="flex items-center gap-2 mt-2">
                      {(cart[product.id] ?? 0) > 0 ? (
                        <div className="flex items-center gap-2 w-full justify-between bg-orange-50 rounded-xl px-2 py-1">
                          <button onClick={() => removeFromCart(product.id)}
                            className="w-6 h-6 rounded-full bg-orange-200 text-orange-800 font-bold text-sm hover:bg-orange-300 transition-colors flex items-center justify-center">−</button>
                          <span className="text-sm font-bold text-orange-800">{cart[product.id]}</span>
                          <button onClick={() => addToCart(product.id)}
                            className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-colors flex items-center justify-center">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product.id)}
                          className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition-colors">
                          Ajouter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">Mon panier</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-900 text-xl">✕</button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {cartItems.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3">
                  {product.photo_url && <img src={product.photo_url} className="w-12 h-12 rounded-xl object-cover" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-orange-700">{(product.price / 100).toFixed(2).replace('.', ',')}€ × {qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center">−</button>
                    <span className="text-sm font-bold w-4 text-center">{qty}</span>
                    <button onClick={() => addToCart(product.id)} className="w-7 h-7 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-gray-900 mb-4">
                  <span>Total</span>
                  <span>{(totalCents / 100).toFixed(2).replace('.', ',')}€</span>
                </div>

                <div className="space-y-2 mb-4">
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ton prénom et nom *"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:outline-none" />
                  <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="Ton email *" type="email"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:outline-none" />
                  <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Téléphone (optionnel)" type="tel"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:outline-none" />
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Note pour la boulangerie (optionnel)" rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 focus:outline-none resize-none" />
                </div>

                {error && <p className="text-red-600 text-xs mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || cartItems.length === 0}
                  className="w-full py-3 bg-orange-700 hover:bg-orange-800 text-white rounded-xl font-bold text-sm disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {checkingOut
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Redirection…</>
                    : <>💳 Payer {(totalCents / 100).toFixed(2).replace('.', ',')}€ en ligne</>
                  }
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">Paiement sécurisé par Stripe</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
`.trim()
}
