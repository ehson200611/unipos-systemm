import { useEffect, useState } from 'react'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, payDebt, createPurchase, getSupplierPurchases } from '../api/suppliers'
import { Truck, Plus, Phone, Trash2, Edit3, X, CreditCard, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '../components/Toast'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function Suppliers() {
  const toast = useToast()
  const { language: lang = 'tg' } = useSettingsStore()
  const [suppliers, setSuppliers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)
  const [selected, setSelected]         = useState(null)
  const [purchases, setPurchases]       = useState([])
  const [form, setForm]                 = useState({ name: '', phone: '', address: '', note: '' })
  const [purchaseForm, setPurchaseForm] = useState({ supplier: '', amount: '', paid: '', description: '' })
  const [payAmount, setPayAmount]       = useState('')
  const [saving, setSaving]             = useState(false)

  const load = () => {
    setLoading(true)
    getSuppliers().then(r => setSuppliers(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openPurchases = async (s) => {
    setSelected(s)
    const r = await getSupplierPurchases(s.id)
    setPurchases(r.data)
    setModal('purchases')
  }

  const handleSaveSupplier = async () => {
    if (!form.name) return toast(t(lang, 'sup_warn_name'), 'warning')
    setSaving(true)
    try {
      if (modal === 'add') { await createSupplier(form); toast(t(lang, 'sup_added'), 'success') }
      else { await updateSupplier(selected.id, form); toast(t(lang, 'sup_updated'), 'success') }
      setModal(null); load()
    } catch (e) { toast(e.response?.data?.detail || t(lang, 'error'), 'error') }
    finally { setSaving(false) }
  }

  const handlePayDebt = async () => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return toast(t(lang, 'sup_warn_amount'), 'warning')
    setSaving(true)
    try {
      await payDebt(selected.id, amount)
      toast(t(lang, 'sup_debt_paid'), 'success'); setModal(null); load()
    } catch (e) { toast(e.response?.data?.detail || t(lang, 'error'), 'error') }
    finally { setSaving(false) }
  }

  const handleCreatePurchase = async () => {
    if (!purchaseForm.supplier || !purchaseForm.amount) return toast(t(lang, 'sup_warn_fields'), 'warning')
    setSaving(true)
    try {
      await createPurchase(purchaseForm)
      toast(t(lang, 'sup_purchase_saved'), 'success'); setModal(null); load()
    } catch (e) { toast(t(lang, 'error'), 'error') }
    finally { setSaving(false) }
  }

  const totalDebt = suppliers.reduce((s, sup) => s + Number(sup.debt || 0), 0)

  return (
    <div className="space-y-5">
      <div className="animate-fade-up flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Truck size={22} className="text-teal-500" /> {t(lang, 'sup_title')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t(lang, 'sup_sub')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPurchaseForm({ supplier: '', amount: '', paid: '', description: '' }); setModal('purchase') }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm bg-teal-500 hover:bg-teal-600 transition-colors">
            <ShoppingCart size={15} /> {t(lang, 'sup_purchase_btn')}
          </button>
          <button onClick={() => { setForm({ name: '', phone: '', address: '', note: '' }); setSelected(null); setModal('add') }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
            <Plus size={15} /> {t(lang, 'sup_add_btn')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="animate-fade-up rounded-2xl p-4 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)', boxShadow: '0 6px 20px rgba(20,184,166,0.3)' }}>
          <Truck size={20} className="text-white/70 mb-2" />
          <p className="text-2xl font-black">{suppliers.length}</p>
          <p className="text-white/70 text-xs">{t(lang, 'sup_stat_total')}</p>
        </div>
        <div className="animate-fade-up rounded-2xl p-4 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', boxShadow: '0 6px 20px rgba(239,68,68,0.3)', animationDelay: '60ms' }}>
          <AlertCircle size={20} className="text-white/70 mb-2" />
          <p className="text-2xl font-black">{fmt(totalDebt)}</p>
          <p className="text-white/70 text-xs">{t(lang, 'sup_stat_debt')}</p>
        </div>
      </div>

      {/* Suppliers list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="w-6 h-6 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin mr-3" />
            {t(lang, 'loading')}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Truck size={40} className="mx-auto mb-3 opacity-20" />
            <p>{t(lang, 'sup_empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {suppliers.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
                  {s.name?.[0]?.toUpperCase() || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  {s.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={11} />{s.phone}</p>}
                </div>
                <div className="text-right shrink-0">
                  {Number(s.debt) > 0 ? (
                    <p className="text-sm font-bold text-red-500">−{fmt(s.debt)} сом</p>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-500 text-sm font-semibold">
                      <CheckCircle size={14} /> {t(lang, 'sup_clean')}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">{s.total_purchases} {t(lang, 'sup_purchases_lbl')}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openPurchases(s)} title={t(lang, 'sup_tt_purchases')}
                    className="w-8 h-8 rounded-xl hover:bg-teal-50 hover:text-teal-600 text-gray-400 flex items-center justify-center transition-colors">
                    <ShoppingCart size={14} />
                  </button>
                  {Number(s.debt) > 0 && (
                    <button onClick={() => { setSelected(s); setPayAmount(''); setModal('pay') }} title={t(lang, 'sup_tt_pay')}
                      className="w-8 h-8 rounded-xl hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors">
                      <CreditCard size={14} />
                    </button>
                  )}
                  <button onClick={() => { setForm({ name: s.name, phone: s.phone, address: s.address, note: s.note }); setSelected(s); setModal('edit') }}
                    title={t(lang, 'sup_tt_edit')}
                    className="w-8 h-8 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 flex items-center justify-center transition-colors">
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit supplier */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? t(lang, 'sup_add_title') : t(lang, 'sup_edit_title')} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {[
              { label: t(lang, 'sup_field_name'),  key: 'name',    placeholder: lang === 'ru' ? 'ООО "Поставка"' : 'ЧМ "Таъминот"' },
              { label: t(lang, 'sup_field_phone'),  key: 'phone',   placeholder: '+992 XX XXX XXXX' },
              { label: t(lang, 'sup_field_addr'),   key: 'address', placeholder: lang === 'ru' ? 'Город, улица' : 'Шаҳр, кӯча' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input" placeholder={placeholder}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <button onClick={handleSaveSupplier} disabled={saving}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
              {saving ? t(lang, 'saving') : t(lang, 'save')}
            </button>
          </div>
        </Modal>
      )}

      {/* Pay debt */}
      {modal === 'pay' && selected && (
        <Modal title={`${t(lang, 'sup_pay_title')} — ${selected.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-red-500 mb-1">{t(lang, 'sup_cur_debt')}</p>
              <p className="text-2xl font-black text-red-600">{fmt(selected.debt)} сомони</p>
            </div>
            <div>
              <label className="label">{t(lang, 'sup_pay_amt')}</label>
              <input className="input" type="number" min="0" placeholder="0.00"
                value={payAmount} onChange={e => setPayAmount(e.target.value)} />
            </div>
            <button onClick={handlePayDebt} disabled={saving}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              {saving ? t(lang, 'saving') : t(lang, 'sup_pay_btn')}
            </button>
          </div>
        </Modal>
      )}

      {/* New purchase */}
      {modal === 'purchase' && (
        <Modal title={t(lang, 'sup_new_purchase')} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">{t(lang, 'sup_field_sup')}</label>
              <select className="input" value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}>
                <option value="">{t(lang, 'sup_select_ph')}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t(lang, 'sup_field_total')}</label>
              <input className="input" type="number" min="0" placeholder="0.00"
                value={purchaseForm.amount} onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">{t(lang, 'sup_field_paid')}</label>
              <input className="input" type="number" min="0" placeholder="0.00"
                value={purchaseForm.paid} onChange={e => setPurchaseForm({ ...purchaseForm, paid: e.target.value })} />
            </div>
            <div>
              <label className="label">{t(lang, 'sup_field_desc')}</label>
              <input className="input" placeholder={t(lang, 'sup_desc_ph')}
                value={purchaseForm.description} onChange={e => setPurchaseForm({ ...purchaseForm, description: e.target.value })} />
            </div>
            <button onClick={handleCreatePurchase} disabled={saving}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
              {saving ? t(lang, 'saving') : t(lang, 'fin_add_ok')}
            </button>
          </div>
        </Modal>
      )}

      {/* Purchase history */}
      {modal === 'purchases' && selected && (
        <Modal title={`${t(lang, 'sup_hist_title')} — ${selected.name}`} onClose={() => setModal(null)}>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {purchases.length === 0 ? (
              <p className="text-center text-gray-400 py-8">{t(lang, 'sup_no_purchase')}</p>
            ) : purchases.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{fmt(p.amount)} сом</p>
                  <p className="text-xs text-gray-400">{p.description || '—'} · {new Date(p.created_at).toLocaleDateString(lang === 'ru' ? 'ru' : 'tg')}</p>
                </div>
                {Number(p.remaining) > 0 && (
                  <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-full">
                    {t(lang, 'sup_remain')}{fmt(p.remaining)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
