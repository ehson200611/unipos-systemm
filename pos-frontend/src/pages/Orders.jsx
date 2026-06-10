import { useEffect, useState } from 'react'
import { getSales, markPreparing, markReady, markServed, refundSale } from '../api/sales'
import { RefreshCw, Search, ChevronRight } from 'lucide-react'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const STATUS = {
  pending:   { label: 'Интизор',       bg: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  preparing: { label: 'Тайёр мешавад', bg: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  ready:     { label: 'Омода',         bg: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400' },
  served:    { label: 'Дода шуд',      bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  refunded:  { label: 'Баргашт',       bg: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  cancelled: { label: 'Бекор',         bg: 'bg-red-100 text-red-600',       dot: 'bg-red-400' },
}

const PAY = { cash: 'Нақд', card: 'Кард', card_alif: 'Alif', card_dc: 'Корт DC', mixed: 'Омехта' }

export default function Orders() {
  const toast = useToast()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    getSales().then((r) => setSales(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const action = async (fn, id) => {
    try { await fn(id); load() }
    catch (e) { toast(e.response?.data?.detail || 'Хатогӣ', 'error') }
  }

  const all = sales.length
  const served = sales.filter((s) => s.status === 'served').length
  const pending = sales.filter((s) => s.status === 'pending').length

  const TABS = [
    { key: 'all',       label: `Ҳама (${all})` },
    { key: 'pending',   label: `Интизор (${pending})` },
    { key: 'served',    label: 'Дода шуд' },
    { key: 'refunded',  label: 'Баргашт' },
    { key: 'cancelled', label: 'Бекор' },
  ]

  const filtered = sales.filter((s) => {
    const matchTab = tab === 'all' || s.status === tab
    const matchSearch = !search || `#${s.order_number}`.includes(search) || (s.cashier_name || '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Фурӯшиҳо</h1>
          <p className="text-sm text-gray-400">Ҳамаи транзаксияҳо</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-all hover:shadow-sm active:scale-95">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Нав кардан
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {[
          { label: 'Ҳама', value: all, color: 'text-gray-800', bg: 'bg-white border-gray-100' },
          { label: 'Дода шуд', value: served, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Интизор', value: pending, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10 text-sm" placeholder="Ҷустуҷӯ аз рӯи ID ё кассир..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <TableSkeleton rows={6} /> : (
        <div className="space-y-2">
          {filtered.map((sale) => {
            const st = STATUS[sale.status] || STATUS.pending
            return (
              <div key={sale.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all animate-fade-up">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/70 transition-colors"
                  onClick={() => setSelected(selected === sale.id ? null : sale.id)}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="font-bold text-indigo-600 text-sm">#{sale.order_number}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span className={`badge ${st.bg} text-xs`}>{st.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{PAY[sale.payment_method]} · {sale.item_count} дона</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(sale.created_at).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {sale.cashier_name && ` · ${sale.cashier_name}`}
                    </p>
                  </div>
                  <span className="font-bold text-indigo-600 shrink-0 text-sm">{fmt(sale.total_amount)} сомони</span>
                  <ChevronRight size={16} className={`text-gray-300 transition-transform shrink-0 ${selected === sale.id ? 'rotate-90' : ''}`} />
                </button>

                {selected === sale.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 animate-fade-up">
                    <div className="mt-3 space-y-2 mb-3 bg-gray-50 rounded-xl p-3">
                      {(sale.items || []).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.product_name}{item.color ? ` (${item.color})` : ''} × {item.quantity}</span>
                          <span className="font-semibold text-gray-800">{fmt(item.line_total)} сомони</span>
                        </div>
                      ))}
                    </div>
                    {sale.note && <p className="text-sm text-gray-500 italic mb-3">"{sale.note}"</p>}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {sale.status === 'pending' && (
                        <button className="btn-primary text-xs py-2" onClick={() => action(markPreparing, sale.id)}>Тайёр мешавад</button>
                      )}
                      {sale.status === 'preparing' && (
                        <button className="btn-primary text-xs py-2" onClick={() => action(markReady, sale.id)}>Омода</button>
                      )}
                      {sale.status === 'ready' && (
                        <button className="btn-primary text-xs py-2" onClick={() => action(markServed, sale.id)}>Дода шуд</button>
                      )}
                      {!['refunded','cancelled','served'].includes(sale.status) && (
                        <button className="btn-danger text-xs py-2"
                          onClick={() => { if (confirm('Бозгашт?')) action((id) => refundSale(id, {}), sale.id) }}>
                          Бозгашт
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {!filtered.length && (
            <div className="text-center py-16 text-gray-400">
              <p>Фармоиш ёфт нашуд</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
