import { useEffect, useState } from 'react'
import { getWorkers, createWorker, updateWorker, deleteWorker, toggleWorker } from '../api/auth'
import { Plus, Edit, Trash2, X, Mail, Phone, TrendingUp, UserX, Search } from 'lucide-react'
import { CardSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'

const ROLES = [
  { value: 'admin',     label: 'Администратор', color: 'bg-violet-100 text-violet-700',   avatar: 'from-violet-400 to-purple-500' },
  { value: 'manager',   label: 'Менеҷер',       color: 'bg-blue-100 text-blue-700',       avatar: 'from-blue-400 to-indigo-500' },
  { value: 'cashier',   label: 'Кассир',        color: 'bg-emerald-100 text-emerald-700', avatar: 'from-emerald-400 to-teal-500' },
  { value: 'chef',      label: 'Ошпаз',         color: 'bg-amber-100 text-amber-700',     avatar: 'from-amber-400 to-orange-500' },
  { value: 'assembler', label: 'Ҷамъкунанда',   color: 'bg-teal-100 text-teal-700',       avatar: 'from-teal-400 to-emerald-500' },
]

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Modal({ worker, onSave, onClose, toast }) {
  const [form, setForm] = useState({
    username: worker?.username || '', first_name: worker?.first_name || '',
    last_name: worker?.last_name || '', phone: worker?.phone || '',
    email: worker?.email || '', role: worker?.role || 'cashier',
    password: '', password2: '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) })

  const submit = async (e) => {
    e.preventDefault()
    if (!worker && form.password !== form.password2) { toast('Паролҳо мувофиқ нестанд', 'error'); return }
    setSaving(true)
    try {
      const data = { ...form }
      if (!data.password) { delete data.password; delete data.password2 }
      if (worker) await updateWorker(worker.id, data)
      else await createWorker(data)
      toast(worker ? 'Корманд навсозӣ шуд' : 'Корманди нав сохта шуд')
      onSave()
    } catch (e) { toast(JSON.stringify(e.response?.data || 'Хатогӣ'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{worker ? 'Корманд таҳрир' : 'Корманди нав'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Ном</label><input className="input" {...f('first_name')} /></div>
            <div><label className="label">Насаб</label><input className="input" {...f('last_name')} /></div>
          </div>
          <div><label className="label">Логин *</label><input className="input" required {...f('username')} /></div>
          <div><label className="label">Эл. почта</label><input className="input" type="email" {...f('email')} /></div>
          <div><label className="label">Телефон</label><input className="input" {...f('phone')} /></div>
          <div>
            <label className="label">Нақш *</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div><label className="label">Парол {worker ? '(агар тағйир диҳед)' : '*'}</label>
            <input className="input" type="password" required={!worker} {...f('password')} /></div>
          {!worker && <div><label className="label">Паролро такрор *</label>
            <input className="input" type="password" required {...f('password2')} /></div>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Бекор</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Сабт...' : 'Сабт кунед'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Workers() {
  const toast = useToast()
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const w = await getWorkers()
      setWorkers(w.data.results || w.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Корманд нест шавад?')) return
    try { await deleteWorker(id); toast('Корманд нест шуд', 'warning'); load() }
    catch (e) { toast(e.response?.data?.detail || 'Хатогӣ', 'error') }
  }

  const handleToggle = async (id) => {
    try { await toggleWorker(id); load() }
    catch (e) { toast(e.response?.data?.detail || 'Хатогӣ', 'error') }
  }

  const filtered = workers.filter((w) => !search || (w.username + (w.full_name || '') + (w.email || '') + (w.phone || '')).toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      {modal?.type === 'create' && <Modal toast={toast} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <Modal worker={modal.worker} toast={toast} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}

      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Кормандон</h1>
          <p className="text-sm text-gray-400">{workers.length} корманд</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ type: 'create' })}>
          <Plus size={16} /> Илова
        </button>
      </div>

      <div className="relative animate-fade-up" style={{ animationDelay: '60ms' }}>
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10 text-sm" placeholder="Ҷустуҷӯи корманд..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <CardSkeleton count={6} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((w) => {
            const initials = ((w.first_name?.[0] || '') + (w.last_name?.[0] || '')).toUpperCase() || w.username?.[0]?.toUpperCase() || '?'
            const role = ROLES.find((r) => r.value === w.role)
            return (
              <div key={w.id} className="animate-fade-up bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${role?.avatar || 'from-gray-400 to-gray-500'} flex items-center justify-center text-lg font-bold text-white shadow-md`}>
                      {initials}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${w.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800">{w.full_name || w.username}</p>
                    <p className="text-xs text-gray-400">@{w.username}</p>
                  </div>
                  <span className={`badge shrink-0 ${role?.color}`}>{role?.label}</span>
                </div>

                <div className="space-y-1.5 mb-4 pl-1">
                  {w.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail size={13} className="shrink-0 text-gray-400" /> <span className="truncate">{w.email}</span>
                    </div>
                  )}
                  {w.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone size={13} className="shrink-0 text-gray-400" /> {w.phone}
                    </div>
                  )}
                  {!w.email && !w.phone && (
                    <p className="text-xs text-gray-300 italic">Маълумот нест</p>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => setModal({ type: 'edit', worker: w })}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 py-2 rounded-xl transition-all">
                    <Edit size={12} /> Таҳрир
                  </button>
                  <button onClick={() => handleToggle(w.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs border py-2 rounded-xl transition-all ${
                      w.is_active ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}>
                    <UserX size={12} /> {w.is_active ? 'Хомӯш' : 'Фаъол'}
                  </button>
                  <button onClick={() => handleDelete(w.id)}
                    className="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-100 hover:border-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
          {!filtered.length && (
            <div className="col-span-full text-center py-16 text-gray-400">Корманд топилмад</div>
          )}
        </div>
      )}
    </div>
  )
}
