import { useEffect, useState } from 'react'
import { getProducts, getCategories, getColors, addColorStock, addStock, getColorStocks } from '../api/products'
import { createWriteOff } from '../api/modifiers'
import { Warehouse as WHIcon, Search, ChevronDown, ChevronUp, Package, Plus, Loader, TrendingUp, AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeleton'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

function WriteOffModal({ product, onClose, onDone, lang }) {
  const toast = useToast()
  const REASONS = [
    { value: 'spoiled', label: t(lang, 'wo_reason_spoiled') },
    { value: 'broken',  label: t(lang, 'wo_reason_broken') },
    { value: 'expired', label: t(lang, 'wo_reason_expired') },
    { value: 'training',label: t(lang, 'wo_reason_training') },
    { value: 'other',   label: t(lang, 'wo_reason_other') },
  ]
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState('spoiled')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (qty < 1) return
    setSaving(true)
    try {
      await createWriteOff({ product: product.id, quantity: Number(qty), reason, note })
      toast(`${product.name} — ${qty} ${t(lang, 'wo_done_toast')}`, 'success')
      onDone()
    } catch (e) { toast(e.response?.data?.detail || t(lang, 'error'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-800 flex items-center gap-2">
            <Trash2 size={16} className="text-red-500" /> {t(lang, 'wo_title')}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-red-50 rounded-xl px-4 py-3">
            <p className="font-bold text-gray-800">{product.name}</p>
            <p className="text-sm text-gray-500">{t(lang, 'wo_in_stock')}: <strong>{product.stock_quantity}</strong> {t(lang, 'warehouse_pieces')}</p>
          </div>
          <div>
            <label className="label">{t(lang, 'wo_qty')}</label>
            <input className="input" type="number" min="1" max={product.stock_quantity}
              value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <label className="label">{t(lang, 'wo_reason')}</label>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t(lang, 'wo_note')}</label>
            <input className="input" placeholder={t(lang, 'wo_note_ph')}
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button onClick={submit} disabled={saving}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition-all">
            {saving ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {saving ? t(lang, 'wo_saving') : t(lang, 'wo_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Warehouse() {
  const toast = useToast()
  const { language: lang = 'tg' } = useSettingsStore()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [writeOffTarget, setWriteOffTarget] = useState(null)
  const [colors, setColors] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState(null)
  const [stockFilter, setStockFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [colorStocks, setColorStocks] = useState({})
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ productId: null, productName: '', color: '', qty: 1 })
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getProducts(), getCategories(), getColors()])
      .then(([p, c, cl]) => {
        setProducts(p.data.results || p.data)
        setCategories(c.data.results || c.data)
        setColors(cl.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (productSearch.length > 1) {
      getProducts({ search: productSearch }).then((r) => setSearchResults(r.data.results || r.data))
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [productSearch])

  const loadColorStocks = async (id) => {
    if (colorStocks[id]) return
    const r = await getColorStocks(id)
    setColorStocks((prev) => ({ ...prev, [id]: r.data }))
  }

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    loadColorStocks(id)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.productId) return
    setSaving(true)
    try {
      if (form.color) await addColorStock(form.productId, { color: form.color, quantity: Number(form.qty) })
      else await addStock(form.productId, { quantity: Number(form.qty) })
      toast(`${form.productName} — ${form.qty} ${t(lang, 'warehouse_added_toast')}`)
      setForm({ productId: null, productName: '', color: '', qty: 1 })
      setProductSearch('')
      load()
    } catch (e) { toast(e.response?.data?.detail || t(lang, 'error'), 'error') }
    finally { setSaving(false) }
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || p.category === catFilter
    const matchStock = stockFilter === 'all'
      || (stockFilter === 'instock' && p.stock_quantity > 0)
      || (stockFilter === 'low' && p.stock_quantity > 0 && p.stock_quantity <= 3)
      || (stockFilter === 'empty' && p.stock_quantity === 0)
    return matchSearch && matchCat && matchStock
  })

  const total   = products.length
  const inStock = products.filter((p) => p.stock_quantity > 3).length
  const low     = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 3).length
  const empty   = products.filter((p) => p.stock_quantity === 0).length

  const stockColor = (qty) => {
    if (qty > 3)  return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' }
    if (qty > 0)  return { bar: 'bg-amber-500',   text: 'text-amber-700',   badge: 'bg-amber-50 text-amber-700' }
    return               { bar: 'bg-red-500',     text: 'text-red-600',     badge: 'bg-red-50 text-red-600' }
  }

  return (
    <>
    {writeOffTarget && (
      <WriteOffModal
        product={writeOffTarget}
        lang={lang}
        onClose={() => setWriteOffTarget(null)}
        onDone={() => { setWriteOffTarget(null); load() }}
      />
    )}
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t(lang, 'warehouse_title')}</h1>
          <p className="text-sm text-gray-400">{t(lang, 'warehouse_sub')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up stagger" style={{ animationDelay: '60ms' }}>
        {[
          { label: t(lang, 'warehouse_all'),     value: total,   icon: Package,       gradient: 'from-slate-500 to-gray-600',    active: stockFilter === 'all',     key: 'all' },
          { label: t(lang, 'warehouse_instock'),value: inStock,  icon: CheckCircle,   gradient: 'from-emerald-500 to-green-600', active: stockFilter === 'instock',  key: 'instock' },
          { label: t(lang, 'warehouse_low'),    value: low,      icon: AlertTriangle, gradient: 'from-amber-500 to-orange-500',  active: stockFilter === 'low',      key: 'low' },
          { label: t(lang, 'warehouse_empty'),  value: empty,    icon: TrendingUp,    gradient: 'from-red-500 to-rose-500',      active: stockFilter === 'empty',    key: 'empty' },
        ].map(({ label, value, icon: Icon, gradient, active, key }) => (
          <button key={key} onClick={() => setStockFilter(key)}
            className={`animate-fade-up text-left p-4 rounded-2xl border-2 transition-all duration-200 ${active ? 'border-indigo-400 bg-indigo-50 shadow-md' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon size={17} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="relative z-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <h2 className="font-bold text-gray-700 mb-5 flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Plus size={14} className="text-indigo-600" />
          </div>
          {t(lang, 'warehouse_add_title')}
        </h2>
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <label className="label">{t(lang, 'warehouse_product_lbl')}</label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-10"
                  placeholder={t(lang, 'search')}
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setForm({ ...form, productId: null, productName: '' }) }}
                  onBlur={() => setTimeout(() => setShowResults(false), 150)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  autoComplete="off"
                />
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-[999] bg-white border border-gray-200 rounded-2xl shadow-2xl mt-1 max-h-56 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button type="button" key={p.id}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-gray-50 last:border-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setForm({ ...form, productId: p.id, productName: p.name, color: '' }); setProductSearch(p.name); setShowResults(false) }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.productId && (
                <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <CheckCircle size={11} /> {t(lang, 'warehouse_selected')}
                </p>
              )}
            </div>

            <div>
              <label className="label">{t(lang, 'warehouse_color_lbl')}</label>
              <select className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                <option value="">{t(lang, 'warehouse_select_color')}</option>
                {colors.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="label">{t(lang, 'warehouse_qty_lbl')}</label>
              <input className="input" type="number" min="1" value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving || !form.productId}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? t(lang, 'warehouse_saving') : t(lang, 'warehouse_save_btn')}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '180ms' }}>
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10 w-52" placeholder={t(lang, 'search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${catFilter === c.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Product list */}
      {loading ? <TableSkeleton rows={6} /> : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const sc = stockColor(p.stock_quantity)
            const maxStock = Math.max(...products.map(x => x.stock_quantity), 1)
            const pct = Math.min((p.stock_quantity / maxStock) * 100, 100)
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all animate-fade-up">
                <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleExpand(p.id)}>
                  {p.image ? (
                    <img src={p.image} className="w-11 h-11 rounded-xl object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-11 h-11 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center shrink-0">
                      <Package size={18} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-24">
                        <div className={`h-full ${sc.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${sc.text}`}>{p.stock_quantity} {t(lang, 'warehouse_pieces')}</span>
                    </div>
                  </div>
                  <div className={`badge ${sc.badge} text-xs font-semibold shrink-0 mr-1`}>
                    {p.stock_quantity > 3 ? t(lang, 'warehouse_stock_badge_ok') : p.stock_quantity > 0 ? t(lang, 'warehouse_stock_badge_low') : t(lang, 'warehouse_stock_badge_out')}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setWriteOffTarget(p) }}
                    title="Хориҷ аз анбор"
                    className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                  {expanded === p.id
                    ? <ChevronUp size={16} className="text-gray-300 shrink-0" />
                    : <ChevronDown size={16} className="text-gray-300 shrink-0" />}
                </button>

                {expanded === p.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 animate-fade-up">
                    {(colorStocks[p.id] || []).length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                        {(colorStocks[p.id] || []).map((cs) => {
                          const csc = stockColor(cs.quantity)
                          return (
                            <div key={cs.color} className={`rounded-xl p-2.5 text-center border ${csc.badge} border-current/20`}>
                              <p className="text-xs font-medium truncate">{cs.color_label}</p>
                              <p className={`text-lg font-bold mt-0.5 ${csc.text}`}>{cs.quantity}</p>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-3 text-center">{t(lang, 'warehouse_no_colors')}: {p.stock_quantity} {t(lang, 'warehouse_pieces')}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {!filtered.length && (
            <div className="text-center py-16 text-gray-400">
              <WHIcon size={36} className="mx-auto mb-3 opacity-20" />
              <p>{t(lang, 'warehouse_not_found')}</p>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
