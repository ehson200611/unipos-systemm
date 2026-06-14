import { useEffect, useState } from 'react'
import { getIngredients, createProduct, addStock } from '../api/products'
import { createWriteOff } from '../api/modifiers'
import { FlaskConical, Search, Package, Plus, Loader, AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeleton'
import useSettingsStore from '../store/useSettingsStore'

const UNITS = [
  { value: 'гр',   label: 'гр — грамм' },
  { value: 'кг',   label: 'кг — килограмм' },
  { value: 'мл',   label: 'мл — миллилитр' },
  { value: 'л',    label: 'л — литр' },
  { value: 'дона', label: 'дона — штука' },
]

function WriteOffModal({ ingredient, onClose, onDone }) {
  const toast = useToast()
  const REASONS = [
    { value: 'spoiled',  label: 'Вайрон шуд' },
    { value: 'expired',  label: 'Мӯҳлат гузашт' },
    { value: 'training', label: 'Санҷиш / омӯзиш' },
    { value: 'other',    label: 'Дигар' },
  ]
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState('spoiled')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const unit = ingredient.sku || 'дона'

  const submit = async () => {
    if (qty < 1) return
    setSaving(true)
    try {
      await createWriteOff({ product: ingredient.id, quantity: Number(qty), reason, note })
      toast(`${ingredient.name} — ${qty} ${unit} аз анбор хориҷ шуд`, 'success')
      onDone()
    } catch (e) {
      toast(e.response?.data?.detail || 'Хато', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-800 flex items-center gap-2">
            <Trash2 size={16} className="text-red-500" /> Хориҷ аз анбор
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-red-50 rounded-xl px-4 py-3">
            <p className="font-bold text-gray-800">{ingredient.name}</p>
            <p className="text-sm text-gray-500">
              Дар анбор: <strong>{ingredient.stock_quantity} {unit}</strong>
            </p>
          </div>
          <div>
            <label className="label">Миқдор ({unit}) *</label>
            <input className="input" type="number" min="1" max={ingredient.stock_quantity}
              value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <label className="label">Сабаб *</label>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Тавзеҳ (ихтиёрӣ)</label>
            <input className="input" placeholder="Тавзеҳи иловагӣ..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button onClick={submit} disabled={saving}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition-all">
            {saving ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {saving ? 'Нигоҳ мешавад...' : 'Аз анбор хориҷ кунед'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddStockModal({ ingredient, onClose, onDone }) {
  const toast = useToast()
  const [qty, setQty] = useState(100)
  const [saving, setSaving] = useState(false)
  const unit = ingredient.sku || 'дона'

  const submit = async () => {
    if (qty < 1) return
    setSaving(true)
    try {
      await addStock(ingredient.id, { quantity: Number(qty) })
      toast(`${ingredient.name} — +${qty} ${unit} ба анбор илова шуд`, 'success')
      onDone()
    } catch (e) {
      toast(e.response?.data?.detail || 'Хато', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-800 flex items-center gap-2">
            <Plus size={16} className="text-emerald-500" /> Қабул ба анбор
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-emerald-50 rounded-xl px-4 py-3">
            <p className="font-bold text-gray-800">{ingredient.name}</p>
            <p className="text-sm text-gray-500">
              Ҳоло дар анбор: <strong>{ingredient.stock_quantity} {unit}</strong>
            </p>
          </div>
          <div>
            <label className="label">Миқдор ({unit}) *</label>
            <input className="input" type="number" min="1" value={qty}
              onChange={(e) => setQty(e.target.value)} />
          </div>
          <button onClick={submit} disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 transition-all">
            {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? 'Нигоҳ мешавад...' : 'Ба анбор илова кунед'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NewIngredientModal({ onClose, onDone }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', unit: 'гр', stock_quantity: 0 })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createProduct({
        name: form.name,
        price: 1,
        sku: form.unit,
        stock_quantity: Number(form.stock_quantity),
        is_ingredient: true,
        is_active: true,
      })
      toast(`${form.name} анборга илова шуд`, 'success')
      onDone()
    } catch (e) {
      toast(JSON.stringify(e.response?.data || 'Хато'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-800 flex items-center gap-2">
            <FlaskConical size={16} className="text-violet-500" /> Ингредиенти нав
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="label">Номи ингредиент *</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Масалан: Шир, Шираи Тут, Тапиока..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Воҳиди ченак</label>
              <select className="input" value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Захираи аввалӣ</label>
              <input className="input" type="number" min="0" value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Бекор кунед</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader size={14} className="animate-spin" /> : null}
              {saving ? 'Нигоҳ мешавад...' : 'Илова кунед'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Warehouse() {
  const { language: lang = 'tg' } = useSettingsStore()
  const [ingredients, setIngredients] = useState([])
  const [writeOffTarget, setWriteOffTarget] = useState(null)
  const [addStockTarget, setAddStockTarget] = useState(null)
  const [showNewIng, setShowNewIng] = useState(false)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getIngredients()
      .then((r) => setIngredients(r.data.results || r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = ingredients.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchStock = stockFilter === 'all'
      || (stockFilter === 'instock' && p.stock_quantity > 5)
      || (stockFilter === 'low' && p.stock_quantity > 0 && p.stock_quantity <= 5)
      || (stockFilter === 'empty' && p.stock_quantity === 0)
    return matchSearch && matchStock
  })

  const total   = ingredients.length
  const instock = ingredients.filter((p) => p.stock_quantity > 5).length
  const low     = ingredients.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length
  const empty   = ingredients.filter((p) => p.stock_quantity === 0).length

  const stockColor = (qty) => {
    if (qty > 5)  return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700', label: 'Кофист' }
    if (qty > 0)  return { bar: 'bg-amber-500',   text: 'text-amber-700',   badge: 'bg-amber-50 text-amber-700',   label: 'Кам мондааст' }
    return               { bar: 'bg-red-500',     text: 'text-red-600',     badge: 'bg-red-50 text-red-600',       label: 'Тамом шуд' }
  }

  return (
    <>
      {writeOffTarget && (
        <WriteOffModal ingredient={writeOffTarget}
          onClose={() => setWriteOffTarget(null)}
          onDone={() => { setWriteOffTarget(null); load() }} />
      )}
      {addStockTarget && (
        <AddStockModal ingredient={addStockTarget}
          onClose={() => setAddStockTarget(null)}
          onDone={() => { setAddStockTarget(null); load() }} />
      )}
      {showNewIng && (
        <NewIngredientModal
          onClose={() => setShowNewIng(false)}
          onDone={() => { setShowNewIng(false); load() }} />
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Анбори ингредиентҳо</h1>
            <p className="text-sm text-gray-400">Ингредиентҳои Bubble Tea-ро идора кунед</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowNewIng(true)}>
            <Plus size={16} /> Ингредиенти нав
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
          {[
            { label: 'Ҳама ингредиентҳо', value: total,   gradient: 'from-violet-500 to-purple-600', key: 'all',     icon: Package },
            { label: 'Кофист',             value: instock, gradient: 'from-emerald-500 to-green-600', key: 'instock', icon: CheckCircle },
            { label: 'Кам мондааст',       value: low,     gradient: 'from-amber-500 to-orange-500',  key: 'low',     icon: AlertTriangle },
            { label: 'Тамом шуд',          value: empty,   gradient: 'from-red-500 to-rose-500',      key: 'empty',   icon: Trash2 },
          ].map(({ label, value, gradient, key, icon: Icon }) => (
            <button key={key} onClick={() => setStockFilter(key)}
              className={`animate-fade-up text-left p-4 rounded-2xl border-2 transition-all duration-200 ${stockFilter === key ? 'border-violet-400 bg-violet-50 shadow-md' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon size={17} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-10 w-full sm:w-72"
              placeholder="Ингредиентро ҷустуҷӯ кунед..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Ingredient list */}
        {loading ? <TableSkeleton rows={6} /> : (
          <div className="space-y-2 animate-fade-up" style={{ animationDelay: '180ms' }}>
            {filtered.map((ing) => {
              const sc = stockColor(ing.stock_quantity)
              const maxQty = Math.max(...ingredients.map((x) => x.stock_quantity), 1)
              const pct = Math.min((ing.stock_quantity / maxQty) * 100, 100)
              const unit = ing.sku || 'дона'
              return (
                <div key={ing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all animate-fade-up">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-11 h-11 bg-gradient-to-br from-violet-100 to-purple-50 rounded-xl flex items-center justify-center shrink-0">
                      <FlaskConical size={18} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{ing.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-32">
                          <div className={`h-full ${sc.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${sc.text}`}>{ing.stock_quantity} {unit}</span>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${sc.badge}`}>
                      {sc.label}
                    </div>
                    <button
                      onClick={() => setAddStockTarget(ing)}
                      title="Ба анбор илова кунед"
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all shrink-0">
                      <Plus size={15} />
                    </button>
                    <button
                      onClick={() => setWriteOffTarget(ing)}
                      title="Аз анбор хориҷ кунед"
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
            {!filtered.length && (
              <div className="text-center py-16 text-gray-400">
                <FlaskConical size={36} className="mx-auto mb-3 opacity-20" />
                <p className="mb-4">Ингредиент топилмад</p>
                <button className="btn-primary text-sm inline-flex items-center gap-2" onClick={() => setShowNewIng(true)}>
                  <Plus size={14} /> Ингредиенти нав илова кунед
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
