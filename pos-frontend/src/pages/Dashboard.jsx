import { useEffect, useState, useRef } from 'react'
import { getDashboard, getDaily } from '../api/reports'
import {
  ShoppingCart, TrendingUp, Calendar, CreditCard, Trophy,
  RefreshCw, AlertCircle, CheckCircle2, Users, ArrowUp, ArrowDown,
  Zap, Clock
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
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

function useCountUp(target, running) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    if (!running || !target) { setVal(target || 0); return }
    let start = null
    const duration = 1000
    const animate = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(target * ease)
      if (p < 1) raf.current = requestAnimationFrame(animate)
      else setVal(target)
    }
    raf.current = requestAnimationFrame(animate)
    return () => raf.current && cancelAnimationFrame(raf.current)
  }, [target, running])
  return val
}

function useClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function getGreeting(lang) {
  const h = new Date().getHours()
  if (h < 6)  return { text: t(lang, 'dash_greeting_night'),   emoji: '🌙' }
  if (h < 12) return { text: t(lang, 'dash_greeting_morning'), emoji: '🌅' }
  if (h < 17) return { text: t(lang, 'dash_greeting_day'),     emoji: '☀️' }
  if (h < 21) return { text: t(lang, 'dash_greeting_evening'), emoji: '🌆' }
  return { text: t(lang, 'dash_greeting_late'), emoji: '🌙' }
}

function StatCard({ icon: Icon, label, value, sub, change, color, bgFrom, bgTo, delay = 0 }) {
  const isUp = change > 0
  return (
    <div
      className="animate-fade-up relative overflow-hidden rounded-2xl p-5 text-white"
      style={{
        animationDelay: `${delay}ms`,
        background: `linear-gradient(135deg, ${bgFrom} 0%, ${bgTo} 100%)`,
        boxShadow: `0 8px 24px ${bgFrom}40`,
      }}
    >
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.3)' }} />
      <div className="absolute -right-1 -bottom-5 w-16 h-16 rounded-full opacity-10"
        style={{ background: 'rgba(255,255,255,0.5)' }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon size={20} className="text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isUp ? 'bg-white/20' : 'bg-black/20'}`}>
              {isUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-black tracking-tight">{value}</p>
        {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-indigo-600">{fmt(payload[0]?.value)} сомони</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [daily, setDaily] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const clock = useClock()

  const settings = useSettingsStore()
  const { language: lang = 'tg' } = settings
  const PAY_LABELS = { cash: t(lang, 'pay_cash'), card: t(lang, 'pay_card'), card_alif: t(lang, 'pay_alif'), card_dc: t(lang, 'pay_dc'), mixed: t(lang, 'pay_mixed') }
  const greeting = getGreeting(lang)
  const employees = settings.employees || []
  const totalSalaries = employees.reduce((s, e) => s + Number(e.salary || 0), 0)
  const dailyTarget = totalSalaries > 0 ? totalSalaries / 30 : 0

  const load = () => {
    setLoading(true)
    Promise.all([getDashboard(), getDaily(14)])
      .then(([s, d]) => {
        setStats(s.data)
        setDaily(Array.isArray(d.data) ? d.data : [])
        setLastUpdated(new Date())
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const stats_t = stats?.today || {}
  const m = stats?.month || {}

  const todayRevenue  = Number(stats_t.total  || 0)
  const todayProfit   = Number(stats_t.profit || 0)
  const monthRevenue  = Number(m.total  || 0)
  const monthProfit   = Number(m.profit || 0)

  const profitPct = todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 0
  const monthPct  = monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0

  const animTodayRev    = useCountUp(todayRevenue,  !loading)
  const animTodayProfit = useCountUp(todayProfit,   !loading)
  const animMonthRev    = useCountUp(monthRevenue,  !loading)
  const animMonthProfit = useCountUp(monthProfit,   !loading)

  const paymentData = (stats?.payment_stats || [])
    .filter((p) => Number(p.total) > 0)
    .map((p) => ({
      name: PAY_LABELS[p.payment_method] || p.payment_method,
      value: Number(p.total),
      color: PAY_COLORS[p.payment_method] || '#94a3b8',
      count: p.count,
    }))

  const chartData = daily.map((d) => ({
    date:  d.date?.slice(5) || d.date,
    total: Number(d.total || 0),
  }))

  const topProducts = stats?.top_products || []
  const TOP_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b']

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{greeting.emoji}</span>
            <h1 className="text-xl font-bold text-gray-800">{greeting.text}!</h1>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
            <Clock size={11} />
            {clock.toLocaleDateString('tg', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            <span className="font-mono font-semibold text-gray-600">
              {clock.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {lastUpdated && <span className="text-gray-300">· {t(lang, 'dash_updated')}: {lastUpdated.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-all hover:shadow-sm hover:border-indigo-200 active:scale-95">
          <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-500' : ''} />
          <span className="hidden sm:inline">{t(lang, 'dash_refresh')}</span>
        </button>
      </div>

      {/* Stat cards */}
      {loading ? <StatSkeleton count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard
            icon={ShoppingCart}
            label={t(lang, 'dash_today_sales')}
            value={`${fmtShort(animTodayRev)} ${t(lang, 'dash_som')}`}
            sub={`${stats_t.count || 0} ${t(lang, 'dash_today_orders')}`}
            bgFrom="#6366f1" bgTo="#4f46e5"
            delay={0}
          />
          <StatCard
            icon={TrendingUp}
            label={t(lang, 'dash_today_profit')}
            value={`${fmtShort(animTodayProfit)} ${t(lang, 'dash_som')}`}
            sub={`${profitPct}% ${t(lang, 'dash_margin')}`}
            bgFrom="#10b981" bgTo="#059669"
            delay={60}
          />
          <StatCard
            icon={Calendar}
            label={t(lang, 'dash_month_sales')}
            value={`${fmtShort(animMonthRev)} ${t(lang, 'dash_som')}`}
            sub={`${m.count || 0} ${t(lang, 'dash_today_orders')}`}
            bgFrom="#8b5cf6" bgTo="#7c3aed"
            delay={120}
          />
          <StatCard
            icon={CreditCard}
            label={t(lang, 'dash_month_profit')}
            value={`${fmtShort(animMonthProfit)} ${t(lang, 'dash_som')}`}
            sub={`${monthPct}% ${t(lang, 'dash_margin')}`}
            bgFrom="#f59e0b" bgTo="#d97706"
            delay={180}
          />
        </div>
      )}

      {/* Expense coverage card */}
      {totalSalaries > 0 && !loading && (() => {
        const pct = dailyTarget > 0 ? Math.min(Math.round((todayProfit / dailyTarget) * 100), 100) : 0
        const covered = todayProfit >= dailyTarget
        const shortfall = todayProfit - dailyTarget
        return (
          <div className="animate-fade-up rounded-2xl p-5 border"
            style={{
              animationDelay: '220ms',
              background: covered ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fff7ed, #fef3c7)',
              borderColor: covered ? '#bbf7d0' : '#fde68a',
            }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {covered
                  ? <CheckCircle2 size={22} className="text-emerald-500" />
                  : <AlertCircle size={22} className="text-amber-500" />}
                <div>
                  <p className={`font-bold text-sm ${covered ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {covered ? t(lang, 'dash_expenses_covered') : t(lang, 'dash_expenses_not')}
                  </p>
                  <p className={`text-xs ${covered ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {t(lang, 'dash_from_profit')}
                  </p>
                </div>
              </div>
              <div className={`text-3xl font-black ${covered ? 'text-emerald-600' : 'text-amber-600'}`}>
                {pct}%
              </div>
            </div>

            <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background: covered
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #f59e0b, #d97706)',
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t(lang, 'dash_today_profit_lbl'), value: `${fmt(todayProfit)} ${t(lang, 'dash_som')}`, color: covered ? '#059669' : '#d97706' },
                { label: t(lang, 'dash_daily_target'), value: `${fmt(dailyTarget)} ${t(lang, 'dash_som')}`, color: '#6b7280' },
                { label: shortfall >= 0 ? t(lang, 'dash_surplus') : t(lang, 'dash_shortfall'), value: `${shortfall >= 0 ? '+' : ''}${fmt(shortfall)} ${t(lang, 'dash_som')}`, color: shortfall >= 0 ? '#059669' : '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/60 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue trend */}
        {chartData.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-800">{t(lang, 'dash_14day_revenue')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{t(lang, 'dash_sales_dynamics')}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
                <Zap size={12} />
                {t(lang, 'dash_realtime')}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#colorRevenue)" dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment methods */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <h2 className="font-bold text-gray-800 mb-0.5">{t(lang, 'dash_payment_methods')}</h2>
          <p className="text-xs text-gray-400 mb-4">{t(lang, 'dash_today')}</p>
          {paymentData.length > 0 ? (
            <>
              <PieChart width={170} height={130} style={{ margin: '0 auto' }}>
                <Pie data={paymentData} cx={85} cy={65} innerRadius={38} outerRadius={60}
                  dataKey="value" paddingAngle={3}>
                  {paymentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${fmt(v)} сом`} />
              </PieChart>
              <div className="space-y-2 mt-3">
                {paymentData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-xs text-gray-600">{p.name}</span>
                      <span className="text-xs text-gray-300">({p.count})</span>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{fmt(p.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-300">
              <CreditCard size={32} className="mx-auto mb-2" />
              <p className="text-sm">{t(lang, 'dash_no_payments')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Top products + Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Trophy size={17} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-sm">{t(lang, 'dash_top_products')}</h2>
              <p className="text-xs text-gray-400">{t(lang, 'dash_last_30')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {topProducts.slice(0, 6).map((p, i) => {
              const maxQty = topProducts[0]?.total_qty || 1
              const pct = Math.round((p.total_qty / maxQty) * 100)
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: TOP_COLORS[i] || '#6366f1' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate">{p.product_name}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
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
            {!topProducts.length && (
              <div className="text-center py-8 text-gray-300">
                <Trophy size={28} className="mx-auto mb-2" />
                <p className="text-sm">{t(lang, 'dash_no_data')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Employees today */}
        {(stats?.cashier_stats || []).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-up" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users size={17} className="text-blue-500" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-sm">{t(lang, 'dash_employees_today')}</h2>
                <p className="text-xs text-gray-400">{t(lang, 'dash_sales_by_emp')}</p>
              </div>
            </div>
            <div className="space-y-2">
              {(stats.cashier_stats || []).map((c, i) => {
                const maxTotal = (stats.cashier_stats[0]?.total) || 1
                const pct = Math.round((c.total / maxTotal) * 100)
                return (
                  <div key={i} className="p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, #6366f1, #3b82f6)` }}>
                        {c.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.count} {t(lang, 'dash_orders_count')}</p>
                      </div>
                      <p className="text-sm font-bold text-indigo-600">{fmtShort(c.total)} {t(lang, 'dash_som')}</p>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
