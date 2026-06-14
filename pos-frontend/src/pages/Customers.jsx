import { useEffect, useState } from 'react'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, addBonus, useBonus } from '../api/customers'
import { Users, Plus, Search, Star, Phone, Trash2, Edit3, X, Gift, TrendingUp, ShoppingBag } from 'lucide-react'
import { useToast } from '../components/Toast'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const EMPTY_FORM = { name: '', phone: '', email: '', note: '' }

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function Customers() {
  const toast = useToast()
  const { language: lang = 'tg' } = useSettingsStore()
  const [customers, setCustomers]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [modal, setModal]             = useState(null)
  const [selected, setSelected]       = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusType, setBonusType]     = useState('add')
  const [saving, setSaving]           = useState(false)

  const load = () => {
    setLoading(true)
    getCustomers({ search }).then(r => setCustomers(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])

  const openAdd   = () => { setForm(EMPTY_FORM); setSelected(null); setModal('add') }
  const openEdit  = (c) => { setForm({ name: c.name, phone: c.phone, email: c.email || '', note: c.note || '' }); setSelected(c); setModal('edit') }
  const openBonus = (c) => { setSelected(c); setBonusAmount(''); setBonusType('add'); setModal('bonus') }

  const handleSave = async () => {
    if (!form.name || !form.phone) return toast(t(lang, 'crm_warn_fields'), 'warning')
    setSaving(true)
    try {
      if (modal === 'add') { await createCustomer(form); toast(t(lang, 'crm_added'), 'success') }
      else { await updateCustomer(selected.id, form); toast(t(lang, 'crm_updated'), 'success') }
      setModal(null); load()
    } catch (e) {
      toast(e.response?.data?.phone?.[0] || e.response?.data?.detail || t(lang, 'error'), 'error')
    } finally { setSaving(false) }
  }

  const handleBonus = async () => {
    const amount = parseFloat(bonusAmount)
    if (!amount || amount <= 0) return toast(t(lang, 'crm_warn_amount'), 'warning')
    setSaving(true)
    try {
      if (bonusType === 'add') await addBonus(selected.id, amount)
      else await useBonus(selected.id, amount)
      toast(bonusType === 'add' ? t(lang, 'crm_bonus_added') : t(lang, 'crm_bonus_used'), 'success')
      setModal(null); load()
    } catch (e) {
      toast(e.response?.data?.detail || t(lang, 'error'), 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async (c) => {
    if (!confirm(`${c.name} ${t(lang, 'crm_del_confirm')}`)) return
    await deleteCustomer(c.id)
    toast(t(lang, 'crm_deleted'), 'success'); load()
  }

  const totalBonus = customers.reduce((s, c) => s + Number(c.bonus_points || 0), 0)
  const totalSpent = customers.reduce((s, c) => s + Number(c.total_spent || 0), 0)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={22} className="text-indigo-500" /> {t(lang, 'crm_title')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t(lang, 'crm_sub')}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
          <Plus size={16} /> {t(lang, 'crm_add_btn')}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {[
          { label: t(lang, 'crm_stat_total'), value: customers.length,          icon: Users,      bg: '#6366f1' },
          { label: t(lang, 'crm_stat_spent'), value: `${fmt(totalSpent)} сом`,  icon: TrendingUp, bg: '#10b981' },
          { label: t(lang, 'crm_stat_bonus'), value: `${fmt(totalBonus)} сом`,  icon: Gift,       bg: '#f59e0b' },
        ].map(({ label, value, icon: Icon, bg }, i) => (
          <div key={i} className="animate-fade-up rounded-2xl p-4 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg,${bg},${bg}cc)`, boxShadow: `0 6px 20px ${bg}40`, animationDelay: `${i*60}ms` }}>
            <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.4)' }} />
            <Icon size={20} className="text-white/80 mb-2" />
            <p className="text-xl font-black">{value}</p>
            <p className="text-white/70 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative animate-fade-up">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input className="input pl-10 w-full" placeholder={t(lang, 'crm_search_ph')}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-3" />
            {t(lang, 'loading')}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p>{t(lang, 'crm_empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t(lang, 'crm_col_name')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t(lang, 'crm_col_phone')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t(lang, 'crm_col_spent')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t(lang, 'crm_col_bonus')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t(lang, 'crm_col_visits')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>
                          {c.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{c.name}</p>
                          {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone size={13} className="text-gray-400" /> {c.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-gray-700">{fmt(c.total_spent)} сом</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs">
                        <Star size={11} fill="currentColor" /> {fmt(c.bonus_points)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-gray-500 font-medium">{c.visit_count}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openBonus(c)} title={t(lang, 'crm_tt_bonus')}
                          className="w-8 h-8 rounded-xl hover:bg-amber-50 hover:text-amber-600 text-gray-400 flex items-center justify-center transition-colors">
                          <Gift size={15} />
                        </button>
                        <button onClick={() => openEdit(c)} title={t(lang, 'crm_tt_edit')}
                          className="w-8 h-8 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 flex items-center justify-center transition-colors">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(c)} title={t(lang, 'crm_tt_delete')}
                          className="w-8 h-8 rounded-xl hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? t(lang, 'crm_add_title') : t(lang, 'crm_edit_title')} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">{t(lang, 'crm_field_name')}</label>
              <input className="input" type="text" placeholder="Аҳмад Раҳимов"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t(lang, 'crm_field_phone')}</label>
              <input className="input" type="tel" placeholder="+992 XX XXX XXXX"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="email@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">{t(lang, 'crm_field_note')}</label>
              <textarea className="input resize-none" rows={2} placeholder={t(lang, 'crm_note_ph')}
                value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>
              {saving ? t(lang, 'saving') : modal === 'add' ? t(lang, 'crm_add_ok') : t(lang, 'save')}
            </button>
          </div>
        </Modal>
      )}

      {/* Bonus modal */}
      {modal === 'bonus' && selected && (
        <Modal title={`${t(lang, 'crm_bonus_title')} — ${selected.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <Star size={24} className="text-amber-500 mx-auto mb-1" fill="currentColor" />
              <p className="text-xs text-amber-600 mb-0.5">{t(lang, 'crm_bonus_cur')}</p>
              <p className="text-2xl font-black text-amber-700">{fmt(selected.bonus_points)} сом</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['add', 'use'].map(tp => (
                <button key={tp} onClick={() => setBonusType(tp)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${bonusType === tp ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  {tp === 'add' ? t(lang, 'crm_bonus_add') : t(lang, 'crm_bonus_use')}
                </button>
              ))}
            </div>
            <div>
              <label className="label">{t(lang, 'crm_bonus_amt')}</label>
              <input className="input" type="number" min="0" placeholder="0.00"
                value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} />
            </div>
            <button onClick={handleBonus} disabled={saving}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: bonusType === 'add' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>
              {saving ? t(lang, 'saving') : bonusType === 'add' ? t(lang, 'crm_bonus_add_ok') : t(lang, 'crm_bonus_use_ok')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
