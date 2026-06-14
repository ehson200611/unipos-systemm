import { useEffect, useState } from 'react'
import { getMenu, getMenuCategories } from '../api/products'
import { Search, ChefHat, Zap } from 'lucide-react'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function OnlineMenu() {
  const [categories, setCategories] = useState([])
  const [products, setProducts]     = useState([])
  const [active, setActive]         = useState(null)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    getMenuCategories().then(r => setCategories(r.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (active) params.category = active
    if (search) params.search = search
    getMenu(params).then(r => {
      setProducts(r.data.results || r.data)
      setLoading(false)
    })
  }, [active, search])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0f172a,#1e1b4b)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/10 px-4 py-4"
        style={{ background: 'rgba(15,23,42,0.85)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>
              <ChefHat size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">UNIPOS Меню</h1>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Zap size={10} fill="currentColor" /> Онлайн меню
              </div>
            </div>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              placeholder="Таомро ҷустуҷӯ кунед..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 38px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-4">
          <button onClick={() => setActive(null)}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={!active ? { background: 'linear-gradient(135deg,#6366f1,#3b82f6)', color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
            Ҳамаси
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={active === c.id ? { background: 'linear-gradient(135deg,#6366f1,#3b82f6)', color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => (
              <div key={p.id} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center text-5xl"
                    style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(59,130,246,0.2))' }}>
                    🍽️
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold text-white line-clamp-2 leading-tight mb-2">{p.name}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-black text-indigo-400">{fmt(p.discount_price || p.price)}</p>
                      <p className="text-xs text-white/40 -mt-0.5">сомони</p>
                    </div>
                    {p.discount_price && (
                      <p className="text-xs line-through text-white/30 mb-3">{fmt(p.price)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!products.length && (
              <div className="col-span-2 text-center py-16 text-white/30">
                <p className="text-4xl mb-3">🍽️</p>
                <p>Таом ёфт нашуд</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
