import { useEffect, useState } from 'react'
import { getDashboard, getDaily } from '../api/reports'
import {
  TrendingUp, BarChart2, ShoppingCart, Calendar,
  ChevronDown, Download, Users, Trophy, Zap
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { StatSkeleton } from '../components/Skeleton'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (n) => {
  n = Number(n || 0)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('ru')
}

const PAY_COLORS = { cash: '#6366f1', card: '#8b5cf6', card_alif: '#f59e0b', card_dc: '#10b981', mixed: '#f43f5e' }
const TOP_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b']

function StatCard({ icon: Icon, label, value, sub, bgFrom, bgTo, delay = 0 }) {
  return (
    <div className="animate-fade-up relative overflow-hidden rounded-2xl p-5 text-white"
      style={{ animationDelay: `${delay}ms`, background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})`, boxShadow: `0 8px 24px ${bgFrom}40` }}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.4)' }} />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <Icon size={20} className="text-white" />
        </div>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-black tracking-tight">{value}</p>
        {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltipRevenue = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 min-w-[160px]">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs text-gray-500">{p.name}</span>
          </div>
          <span className="text-sm font-bold text-gray-800">{typeof p.value === 'number' && p.value > 100 ? `${fmt(p.value)} сом` : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Reports() {
  const { language: lang = 'tg' } = useSettingsStore()
  const PAY_LABELS = { cash: t(lang, 'pay_cash'), card: t(lang, 'pay_card'), card_alif: t(lang, 'pay_alif'), card_dc: t(lang, 'pay_dc'), mixed: t(lang, 'pay_mixed') }
  const [stats, setStats] = useState(null)
  const [daily, setDaily] = useState([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [showDrop, setShowDrop] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([getDashboard(), getDaily(days)])
      .then(([s, d]) => {
        setStats(s.data)
        setDaily(Array.isArray(d.data) ? d.data : [])
      })
      .finally(() => setLoading(false))
  }, [days])

  const m = stats?.month || {}
  const revenue = Number(m.total || 0)
  const profit = Number(m.profit || 0)
  const count = Number(m.count || 0)
  const avgOrder = count > 0 ? revenue / count : 0

  const chartData = daily.map((d) => ({
    date: d.date?.slice(5) || d.date,
    revenue: Number(d.total || 0),
    profit: Number(d.profit || 0),
    count: Number(d.count || 0),
  }))

  const topProducts = stats?.top_products || []
  const paymentData = (stats?.payment_stats || [])
    .filter((p) => Number(p.total) > 0)
    .map((p) => ({
      name: PAY_LABELS[p.payment_method] || p.payment_method,
      value: Number(p.total),
      color: PAY_COLORS[p.payment_method] || '#94a3b8',
      count: p.count,
    }))

  const handleExport = () => {
    if (!chartData.length) return
    const rows = [
      [t(lang, 'reports_csv_date'), t(lang, 'reports_csv_revenue'), t(lang, 'reports_csv_orders')],
      ...chartData.map((d) => [d.date, d.revenue, d.count]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `hisobot-${days}-ruz.csv`
    a.click()
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t(lang, 'reports_title')}</h1>
          <p className="text-sm text-gray-400">{t(lang, 'reports_sub')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all">
            <Download size={14} className="text-emerald-500" />
            <span className="hidden sm:inline">{t(lang, 'reports_csv_export')}</span>
          </button>
          {/* Day selector */}
          <div className="relative">
            <button onClick={() => setShowDrop(!showDrop)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all">
              <Calendar size={14} className="text-indigo-500" />
              {days} {t(lang, 'reports_days_selector')}
              <ChevronDown size={14} className={`transition-transform ${showDrop ? 'rotate-180' : ''}`} />
            </button>
            {showDrop && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-10 w-32 animate-scale-in">
                {[7, 14, 30, 60, 90].map((d) => (
                  <button key={d} onClick={() => { setDays(d); setShowDrop(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${days === d ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                    {d} {t(lang, 'reports_days_selector')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? <StatSkeleton count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard icon={TrendingUp}   label={t(lang, 'reports_month_revenue')} value={`${fmtShort(revenue)} ${t(lang, 'currency')}`}  sub={`${count} ${t(lang, 'reports_orders_lbl')}`}  bgFrom="#6366f1" bgTo="#4f46e5" delay={0}   />
          <StatCard icon={Zap}          label={t(lang, 'reports_month_profit')}  value={`${fmtShort(profit)} ${t(lang, 'currency')}`}   sub={revenue > 0 ? `${Math.round(profit/revenue*100)}% ${t(lang, 'dash_margin')}` : ''}  bgFrom="#10b981" bgTo="#059669" delay={60}  />
          <StatCard icon={ShoppingCart} label={t(lang, 'reports_total_orders')}  value={String(count)}               sub={`${days} ${t(lang, 'reports_last_n_days')}`}  bgFrom="#8b5cf6" bgTo="#7c3aed" delay={120} />
          <StatCard icon={BarChart2}    label={t(lang, 'reports_avg_order')}     value={`${fmtShort(avgOrder)} ${t(lang, 'currency')}`} sub={t(lang, 'reports_per_order')}  bgFrom="#f59e0b" bgTo="#d97706" delay={180} />
        </div>
      )}

      {/* Revenue & profit area chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-gray-800">{t(lang, 'reports_revenue_profit')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{days} {t(lang, 'reports_last_n_days')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500" /> {t(lang, 'reports_revenue')}</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> {t(lang, 'reports_profit')}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Area type="monotone" dataKey="revenue" name={t(lang, 'reports_revenue')} stroke="#6366f1" strokeWidth={2.5}
                fill="url(#gradRevenue)" dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="profit" name={t(lang, 'reports_profit')} stroke="#10b981" strokeWidth={2}
                fill="url(#gradProfit)" dot={false} activeDot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Orders bar chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <div className="mb-5">
            <h2 className="font-bold text-gray-800">{t(lang, 'reports_daily_orders')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{days} {t(lang, 'reports_last_n_days')}</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Bar dataKey="count" name={t(lang, 'reports_orders_lbl')} fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom row: Top products + Payment methods + Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top products */}
        {topProducts.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Trophy size={17} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-sm">{t(lang, 'reports_top_products')}</h2>
                <p className="text-xs text-gray-400">{t(lang, 'reports_sold_by_qty')}</p>
              </div>
            </div>
            <div className="space-y-3">
              {topProducts.slice(0, 8).map((p, i) => {
                const maxQty = topProducts[0]?.total_qty || 1
                const pct = Math.round((p.total_qty / maxQty) * 100)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                      style={{ background: TOP_COLORS[i] || '#6366f1' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-gray-700 truncate">{p.product_name}</span>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-xs text-gray-400">{p.total_qty} {t(lang, 'dash_pieces')}</span>
                          <span className="text-xs font-bold" style={{ color: TOP_COLORS[i] }}>{fmtShort(p.total_revenue)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: TOP_COLORS[i] || '#6366f1' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Payment methods */}
          {paymentData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '220ms' }}>
              <h2 className="font-bold text-gray-800 text-sm mb-4">{t(lang, 'reports_payment_methods')}</h2>
              <div className="space-y-2.5">
                {paymentData.map((p, i) => {
                  const total = paymentData.reduce((s, x) => s + x.value, 0)
                  const pct = total > 0 ? Math.round((p.value / total) * 100) : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                          <span className="text-xs font-medium text-gray-700">{p.name}</span>
                          <span className="text-xs text-gray-300">({p.count})</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: p.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Employees */}
          {(stats?.cashier_stats || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users size={16} className="text-blue-500" />
                </div>
                <h2 className="font-bold text-gray-800 text-sm">{t(lang, 'reports_employees')}</h2>
              </div>
              <div className="space-y-2">
                {(stats.cashier_stats || []).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{c.count} {t(lang, 'reports_sales_count')}</p>
                    </div>
                    <p className="text-xs font-bold text-indigo-600">{fmtShort(c.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
