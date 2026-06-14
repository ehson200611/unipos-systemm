import { useEffect, useState } from 'react'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, getRecipe, saveRecipe, getIngredients } from '../api/products'
import { Plus, Edit, Trash2, Search, X, Package, FlaskConical, BookOpen, Loader } from 'lucide-react'
import { GridSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Recipe Modal ─────────────────────────────────────────────────────────────

function RecipeModal({ product, onClose }) {
  const toast = useToast()
  const [recipe, setRecipe] = useState([])
  const [allIngredients, setAllIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickedIngId, setPickedIngId] = useState('')
  const [pickedQty, setPickedQty] = useState(1)

  useEffect(() => {
    Promise.all([getRecipe(product.id), getIngredients()])
      .then(([r, i]) => {
        setRecipe(r.data || [])
        setAllIngredients(i.data.results || i.data)
      })
      .finally(() => setLoading(false))
  }, [product.id])

  const addLine = () => {
    if (!pickedIngId || pickedQty < 1) return
    const ing = allIngredients.find((i) => i.id === Number(pickedIngId))
    if (!ing) return
    if (recipe.find((r) => r.ingredient === ing.id)) {
      toast('Ин ингредиент аллакай илова шудааст', 'warning')
      return
    }
    setRecipe([...recipe, { ingredient: ing.id, ingredient_name: ing.name, quantity: Number(pickedQty), unit: ing.sku || 'дона' }])
    setPickedIngId('')
    setPickedQty(1)
  }

  const removeLine = (ingId) => setRecipe(recipe.filter((r) => r.ingredient !== ingId))

  const updateQty = (ingId, val) => setRecipe(recipe.map((r) => r.ingredient === ingId ? { ...r, quantity: Number(val) } : r))

  const submit = async () => {
    setSaving(true)
    try {
      const lines = recipe.map((r) => ({ ingredient_id: r.ingredient, quantity: r.quantity }))
      await saveRecipe(product.id, { lines })
      toast(`"${product.name}" рецепти нигоҳ шуд`, 'success')
      onClose()
    } catch (e) {
      toast(JSON.stringify(e.response?.data || 'Хато'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const availableIngs = allIngredients.filter((i) => !recipe.find((r) => r.ingredient === i.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" /> Рецепти маҳсулот
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              {/* Add ingredient row */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="label">Ингредиент</label>
                  <select className="input" value={pickedIngId} onChange={(e) => setPickedIngId(e.target.value)}>
                    <option value="">— Ингредиентро интихоб кунед —</option>
                    {availableIngs.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.sku || 'дона'})</option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="label">Миқдор</label>
                  <input className="input" type="number" min="1" value={pickedQty}
                    onChange={(e) => setPickedQty(e.target.value)} />
                </div>
                <button onClick={addLine}
                  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1 transition-all shrink-0">
                  <Plus size={15} /> Илова
                </button>
              </div>

              {/* Recipe lines */}
              {recipe.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FlaskConical size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Рецепт холист. Ингредиент илова кунед.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipe.map((r) => (
                    <div key={r.ingredient} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                      <FlaskConical size={15} className="text-violet-400 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-gray-700">{r.ingredient_name}</span>
                      <input
                        type="number" min="1"
                        value={r.quantity}
                        onChange={(e) => updateQty(r.ingredient, e.target.value)}
                        className="w-20 text-center border border-gray-200 rounded-lg py-1 text-sm font-bold focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
                      />
                      <span className="text-xs text-gray-400 w-8 text-left">{r.unit}</span>
                      <button onClick={() => removeLine(r.ingredient)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button className="btn-secondary flex-1" onClick={onClose}>Бекор кунед</button>
          <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={submit} disabled={saving}>
            {saving ? <Loader size={14} className="animate-spin" /> : null}
            {saving ? 'Нигоҳ мешавад...' : 'Рецептро сақлаш'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product Modal ─────────────────────────────────────────────────────────────

function Modal({ product, categories, onSave, onClose, toast, lang }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price || '',
    cost_price: product?.cost_price || '',
    discount_price: product?.discount_price || '',
    stock_quantity: product?.stock_quantity ?? 0,
    category: product?.category || '',
    description: product?.description || '',
    is_active: product?.is_active ?? true,
    is_ingredient: product?.is_ingredient ?? false,
    sku: product?.sku || '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form }
      if (!data.cost_price) delete data.cost_price
      if (!data.discount_price) delete data.discount_price
      if (!data.category) delete data.category
      if (product) await updateProduct(product.id, data)
      else await createProduct(data)
      toast(product ? t(lang, 'products_updated') : t(lang, 'products_created'))
      onSave()
    } catch (e) {
      toast(JSON.stringify(e.response?.data || t(lang, 'error')), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{product ? t(lang, 'products_edit_title') : t(lang, 'products_new_title')}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div><label className="label">{t(lang, 'products_name')}</label><input className="input" required {...f('name')} /></div>

          {!form.is_ingredient && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">{t(lang, 'products_sell_price')}</label><input className="input" type="number" step="0.01" required {...f('price')} /></div>
              <div><label className="label">{t(lang, 'products_cost_price')}</label><input className="input" type="number" step="0.01" {...f('cost_price')} /></div>
            </div>
          )}

          {form.is_ingredient && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Воҳиди ченак (SKU)</label>
                <select className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}>
                  <option value="гр">гр — грамм</option>
                  <option value="кг">кг — килограмм</option>
                  <option value="мл">мл — миллилитр</option>
                  <option value="л">л — литр</option>
                  <option value="дона">дона — штука</option>
                </select>
              </div>
              <div><label className="label">Захира (миқдор)</label><input className="input" type="number" {...f('stock_quantity')} /></div>
            </div>
          )}

          {!form.is_ingredient && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{t(lang, 'products_discount')}</label><input className="input" type="number" step="0.01" {...f('discount_price')} /></div>
                <div><label className="label">{t(lang, 'products_stock')}</label><input className="input" type="number" {...f('stock_quantity')} /></div>
              </div>
              <div>
                <label className="label">{t(lang, 'products_category')}</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">{t(lang, 'products_select_cat')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div><label className="label">{t(lang, 'products_description')}</label><textarea className="input" rows={2} {...f('description')} /></div>

          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span className="text-gray-700">{t(lang, 'products_active')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_ingredient}
                onChange={(e) => setForm({ ...form, is_ingredient: e.target.checked })} />
              <span className="text-gray-700 flex items-center gap-1">
                <FlaskConical size={13} className="text-violet-500" /> Ингредиент (анбор)
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>{t(lang, 'products_cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? t(lang, 'products_saving') : t(lang, 'products_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Products Page ────────────────────────────────────────────────────────

export default function Products() {
  const toast = useToast()
  const { language: lang = 'tg' } = useSettingsStore()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState(null)
  const [modal, setModal] = useState(null)
  const [recipeProduct, setRecipeProduct] = useState(null)

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
    if (!confirm(t(lang, 'products_del_confirm'))) return
    try {
      await deleteProduct(id)
      toast(t(lang, 'products_deleted'), 'warning')
      load()
    } catch (e) {
      toast(e.response?.data?.detail || t(lang, 'error'), 'error')
    }
  }

  const menuProducts = products.filter((p) => !p.is_ingredient)
  const filtered = catFilter === null ? menuProducts : menuProducts.filter((p) => p.category === catFilter)

  return (
    <div className="space-y-4">
      {modal?.type === 'create' && (
        <Modal categories={categories} toast={toast} lang={lang}
          onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <Modal product={modal.product} categories={categories} toast={toast} lang={lang}
          onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
      )}
      {recipeProduct && (
        <RecipeModal product={recipeProduct} onClose={() => setRecipeProduct(null)} />
      )}

      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t(lang, 'products_title')}</h1>
          <p className="text-sm text-gray-400">{menuProducts.length} {t(lang, 'products_title').toLowerCase()}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ type: 'create' })}>
          <Plus size={16} /> {t(lang, 'products_add')}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="input pl-9 text-sm w-52" placeholder={t(lang, 'search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setCatFilter(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${catFilter === null ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Ҳама ({menuProducts.length})
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCatFilter(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${catFilter === c.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {c.name} ({menuProducts.filter((p) => p.category === c.id).length})
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
                      {t(lang, 'products_opt')}: {fmt(p.cost_price)}
                      {profit && <span className="text-emerald-600 font-semibold ml-1">+{fmt(profit)}</span>}
                    </p>
                  )}
                  {p.category_name && <p className="text-xs text-gray-400 mt-1 truncate">{p.category_name}</p>}
                  <div className="flex gap-1.5 mt-3">
                    <button onClick={() => setModal({ type: 'edit', product: p })}
                      className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 py-1.5 rounded-xl transition-all">
                      <Edit size={12} /> {t(lang, 'edit')}
                    </button>
                    <button onClick={() => setRecipeProduct(p)}
                      className="flex items-center justify-center gap-1 text-xs bg-violet-50 hover:bg-violet-100 text-violet-600 px-2.5 py-1.5 rounded-xl transition-all border border-violet-100"
                      title="Рецептро тағйир диҳед">
                      <BookOpen size={12} />
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="flex items-center justify-center gap-1 text-xs bg-red-50 hover:bg-red-500 text-red-500 hover:text-white px-2.5 py-1.5 rounded-xl transition-all border border-red-100 hover:border-red-500">
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
              <p>{t(lang, 'products_not_found')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
