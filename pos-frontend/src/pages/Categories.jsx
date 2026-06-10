import { useEffect, useState } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/products'
import { Plus, Edit, Trash2, X, Grid3X3 } from 'lucide-react'
import { GridSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'

const CAT_COLORS = [
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-orange-400 to-amber-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-blue-500',
  'from-green-400 to-emerald-500',
  'from-fuchsia-400 to-pink-500',
  'from-yellow-400 to-orange-500',
  'from-indigo-400 to-blue-500',
]

const ICONS = ['📱', '🎧', '💻', '📷', '⌚', '🔋', '💊', '🛡️', '🖥️', '🎮']

function Modal({ category, onSave, onClose, toast }) {
  const [name, setName] = useState(category?.name || '')
  const [saving, setSaving] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (category) await updateCategory(category.id, { name })
      else await createCategory({ name })
      toast(category ? 'Категория навсозӣ шуд' : 'Категорияи нав сохта шуд')
      onSave()
    } catch (e) { toast(e.response?.data?.name?.[0] || 'Хатогӣ', 'error') }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{category ? 'Категория таҳрир' : 'Категорияи нав'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="label">Ном *</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="масалан: iPhone" />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Бекор</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Сабт...' : 'Сабт кунед'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Categories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = () => {
    setLoading(true)
    getCategories().then((r) => setCategories(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Категория нест шавад?')) return
    try { await deleteCategory(id); toast('Категория нест шуд', 'warning'); load() }
    catch (e) { toast(e.response?.data?.detail || 'Хатогӣ', 'error') }
  }

  return (
    <div className="space-y-4">
      {modal?.type === 'create' && <Modal toast={toast} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <Modal category={modal.category} toast={toast} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}

      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Категорияҳо</h1>
          <p className="text-sm text-gray-400">{categories.length} категория</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ type: 'create' })}>
          <Plus size={16} /> Илова
        </button>
      </div>

      {loading ? <GridSkeleton count={8} /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
          {categories.map((c, i) => (
            <div key={c.id} className="animate-fade-up bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${CAT_COLORS[i % CAT_COLORS.length]} rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {ICONS[i % ICONS.length]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.product_count || 0} маҳсулот</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ type: 'edit', category: c })}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 py-2 rounded-xl transition-all">
                  <Edit size={12} /> Таҳрир
                </button>
                <button onClick={() => handleDelete(c.id)}
                  className="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-100 hover:border-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {!categories.length && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Grid3X3 size={36} className="mx-auto mb-3 opacity-20" />
              <p>Категория топилмад</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
