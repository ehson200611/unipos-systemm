import { useEffect, useState } from 'react'
import { getFinancial, getExpenses, createExpense, deleteExpense } from '../api/expenses'
import { Wallet, Plus, Trash2, X, TrendingUp, TrendingDown, DollarSign, ChevronDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useToast } from '../components/Toast'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtS = (n) => {
  n = Number(n || 0)
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`
  return n.toLocaleString('ru')
}

const CAT_KEYS = {
  salary: 'cat_salary', rent: 'cat_rent', utilities: 'cat_utilities',
  supplies: 'cat_supplies', equipment: 'cat_equipment', marketing: 'cat_marketing', other: 'cat_other',
}
const CAT_COLORS = {
  salary:'#6366f1', rent:'#f59e0b', utilities:'#06b6d4',
  supplies:'#10b981', equipment:'#8b5cf6', marketing:'#f43f5e', other:'#94a3b8',
}

export default function Finance() {
  const toast = useToast()
  const { language: lang = 'tg' } = useSettingsStore()
  const [data, setData]         = useState(null)
  const [days, setDays]         = useState(30)
  const [showDrop, setShowDrop] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ category: 'other', title: '', amount: '', note: '' })
  const [saving, setSaving]     = useState(false)

  const load = () => {
    setLoading(true)
    getFinancial(days).then(r => setData(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [days])

  const handleSave = async () => {
    if (!form.title || !form.amount) return toast(t(lang, 'fin_warn_fields'), 'warning')
    setSaving(true)
    try {
      await createExpense(form)
      toast(t(lang, 'fin_saved'), 'success')
      setModal(false); load()
    } catch { toast(t(lang, 'error'), 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t(lang, 'fin_del_confirm'))) return
    await deleteExpense(id)
    toast(t(lang, 'fin_deleted'), 'success'); load()
  }

  const revenue  = Number(data?.revenue  || 0)
  const profit   = Number(data?.profit   || 0)
  const expenses = Number(data?.expenses || 0)
  const net      = Number(data?.net_profit || 0)

  const cards = [
    { label: t(lang, 'fin_revenue'),  value: fmtS(revenue),  icon: TrendingUp,  from: '#6366f1', to: '#4f46e5' },
    { label: t(lang, 'fin_profit'),   value: fmtS(profit),   icon: DollarSign,  from: '#10b981', to: '#059669' },
    { label: t(lang, 'fin_expenses'), value: fmtS(expenses), icon: TrendingDown, from: '#ef4444', to: '#dc2626' },
    { label: t(lang, 'fin_net'),      value: fmtS(net),      icon: Wallet,      from: net >= 0 ? '#f59e0b' : '#ef4444', to: net >= 0 ? '#d97706' : '#dc2626' },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={22} className="text-violet-500" /> {t(lang, 'fin_title')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t(lang, 'fin_sub')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setForm({ category: 'other', title: '', amount: '', note: '' }); setModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <Plus size={15} /> {t(lang, 'fin_add_btn')}
          </button>
          <div className="relative">
            <button onClick={() => setShowDrop(!showDrop)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              {days} {t(lang, 'days')} <ChevronDown size={14} className={`transition-transform ${showDrop ? 'rotate-180' : ''}`} />
            </button>
            {showDrop && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 w-28 animate-scale-in overflow-hidden">
                {[7,14,30,60,90].map(d => (
                  <button key={d} onClick={() => { setDays(d); setShowDrop(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium ${days===d ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                    {d} {t(lang, 'days')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {cards.map(({ label, value, icon: Icon, from, to }, i) => (
            <div key={i} className="animate-fade-up rounded-2xl p-5 text-white relative overflow-hidden"
              style={{ animationDelay:`${i*60}ms`, background:`linear-gradient(135deg,${from},${to})`, boxShadow:`0 8px 24px ${from}40` }}>
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20" style={{ background:'rgba(255,255,255,0.4)' }} />
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3"><Icon size={20} /></div>
              <p className="text-white/70 text-xs uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-black">{value} <span className="text-sm font-normal opacity-70">сом</span></p>
            </div>
          ))}
        </div>
      )}

      {/* P&L Chart */}
      {data?.chart?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-gray-800">{t(lang, 'fin_chart_title')}</h2>
              <p className="text-xs text-gray-400">{days} {t(lang, 'fin_chart_sub')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500" />{t(lang, 'fin_legend_rev')}</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" />{t(lang, 'fin_legend_exp')}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.chart} margin={{ top:5, right:10, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}к`} />
              <Tooltip contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', fontSize:12 }} />
              <Area type="monotone" dataKey="revenue"  name={t(lang,'fin_legend_rev')} stroke="#6366f1" strokeWidth={2.5} fill="url(#gRev)" dot={false} />
              <Area type="monotone" dataKey="expenses" name={t(lang,'fin_legend_exp')} stroke="#ef4444" strokeWidth={2}   fill="url(#gExp)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense by category */}
        {data?.by_category?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up">
            <h2 className="font-bold text-gray-800 mb-4">{t(lang, 'fin_by_cat')}</h2>
            <div className="space-y-3">
              {data.by_category.map((c, i) => {
                const max   = data.by_category[0]?.total || 1
                const pct   = Math.round((c.total / max) * 100)
                const color = CAT_COLORS[c.category] || '#94a3b8'
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-sm font-medium text-gray-700">{t(lang, CAT_KEYS[c.category] || 'cat_other')}</span>
                        <span className="text-xs text-gray-400">({c.count})</span>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{fmtS(c.total)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent expenses */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up">
          <h2 className="font-bold text-gray-800 mb-4">{t(lang, 'fin_recent')}</h2>
          {!data?.expense_list?.length ? (
            <div className="text-center py-8 text-gray-400">
              <Wallet size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">{t(lang, 'fin_no_exp')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.expense_list.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${CAT_COLORS[e.category] || '#94a3b8'}20` }}>
                    <span className="text-xs font-bold" style={{ color: CAT_COLORS[e.category] }}>
                      {t(lang, CAT_KEYS[e.category] || 'cat_other')?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400">
                      {t(lang, CAT_KEYS[e.category] || 'cat_other')} · {new Date(e.created_at).toLocaleDateString(lang === 'ru' ? 'ru' : 'tg')}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-red-500 shrink-0">−{fmtS(e.amount)}</p>
                  <button onClick={() => handleDelete(e.id)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-400 text-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add expense modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">{t(lang, 'fin_add_title')}</h2>
              <button onClick={() => setModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">{t(lang, 'fin_field_cat')}</label>
                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(CAT_KEYS).map(([v, key]) => (
                    <option key={v} value={v}>{t(lang, key)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t(lang, 'fin_field_title')}</label>
                <input className="input" placeholder={lang === 'ru' ? 'Описание расхода...' : 'Харҷ тавсифи...'}
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label">{t(lang, 'fin_field_amount')}</label>
                <input className="input" type="number" min="0" placeholder="0.00"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="label">{t(lang, 'fin_field_note')}</label>
                <textarea className="input resize-none" rows={2}
                  value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                {saving ? t(lang, 'saving') : t(lang, 'fin_add_ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
