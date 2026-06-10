import { useEffect, useState } from 'react'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../api/products'
import { Plus, Edit, Trash2, Search, X, Package } from 'lucide-react'
import { GridSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Modal({ product, categories, onSave, onClose, toast }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price || '',
    cost_price: product?.cost_price || '',
    discount_price: product?.discount_price || '',
    stock_quantity: product?.stock_quantity ?? 0,
    category: product?.category || '',
    description: product?.description || '',
    is_active: product?.is_active ?? true,
    sku: product?.sku || '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) })

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const data = { ...form }
      if (!data.cost_price) delete data.cost_price
      if (!data.discount_price) delete data.discount_price
      if (!data.category) delete data.category
      if (product) await updateProduct(product.id, data)
      else await createProduct(data)
      toast(product ? 'Маҳсулот навсозӣ шуд' : 'Маҳсулоти нав сохта шуд')
      onSave()
    } catch (e) { toast(JSON.stringify(e.response?.data || 'Хатогӣ'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{product ? 'Маҳсулот таҳрир' : 'Маҳсулоти нав'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div><label className="label">Ном *</label><input className="input" required {...f('name')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Нарх фурӯш *</label><input className="input" type="number" step="0.01" required {...f('price')} /></div>
            <div><label className="label">Нарх харид (Опт)</label><input className="input" type="number" step="0.01" {...f('cost_price')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Нарх тахфиф</label><input className="input" type="number" step="0.01" {...f('discount_price')} /></div>
            <div><label className="label">Захира</label><input className="input" type="number" {...f('stock_quantity')} /></div>
          </div>
          <div>
            <label className="label">Категория</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">— интихоб —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">SKU / Код</label><input className="input" {...f('sku')} /></div>
          <div><label className="label">Тавсиф</label><textarea className="input" rows={2} {...f('description')} /></div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span className="text-gray-700">Фаъол</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Бекор</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Сабт...' : 'Сабт кунед'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState(null)
  const [modal, setModal] = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (catFilter) params.category = catFilter
    Promise.all([getProducts(params), getCategories()])
      .then(([p, c]) => {
        setProducts(p.data.results || p.data)
        setCategories(c.data.results || c.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, catFilter])

  const handleDelete = async (id) => {
    if (!confirm('Маҳсулот нест шавад?')) return
    try { await deleteProduct(id); toast('Маҳсулот нест шуд', 'warning'); load() }
    catch (e) { toast(e.response?.data?.detail || 'Хатогӣ', 'error') }
  }

  const filtered = catFilter === null ? products : products.filter((p) => p.category === catFilter)

  return (
    <div className="space-y-4">
      {modal?.type === 'create' && <Modal categories={categories} toast={toast} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <Modal product={modal.product} categories={categories} toast={toast} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}

      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Маҳсулот</h1>
          <p className="text-sm text-gray-400">{products.length} маҳсулот</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ type: 'create' })}>
          <Plus size={16} /> Илова
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 text-sm w-52" placeholder="Ҷустуҷӯ..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setCatFilter(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${catFilter === null ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Ҳама ({products.length})
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCatFilter(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${catFilter === c.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {c.name} ({products.filter((p) => p.category === c.id).length})
          </button>
        ))}
      </div>

      {loading ? <GridSkeleton count={8} /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
          {filtered.map((p) => {
            const profit = p.cost_price ? (Number(p.price) - Number(p.cost_price)).toFixed(2) : null
            return (
              <div key={p.id} className={`animate-fade-up bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group ${!p.is_active ? 'opacity-60' : 'border-gray-100 hover:border-indigo-100'}`}>
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <Package size={36} className="text-gray-300" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">{p.name}</p>
                  <p className="text-base font-bold text-indigo-600">{fmt(p.price)} сомони</p>
                  {p.cost_price && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Опт: {fmt(p.cost_price)}
                      {profit && <span className="text-emerald-600 font-semibold ml-1">+{fmt(profit)}</span>}
                    </p>
                  )}
                  {p.category_name && <p className="text-xs text-gray-400 mt-1 truncate">{p.category_name}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setModal({ type: 'edit', product: p })}
                      className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 py-1.5 rounded-xl transition-all">
                      <Edit size={12} /> Таҳрир
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="flex items-center justify-center gap-1 text-xs bg-red-50 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-xl transition-all border border-red-100 hover:border-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {!filtered.length && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Package size={36} className="mx-auto mb-3 opacity-20" />
              <p>Маҳсулот топилмад</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
