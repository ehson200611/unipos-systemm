import { useEffect, useState, useRef } from 'react'
import { getDashboard, getDaily } from '../api/reports'
import { ShoppingCart, TrendingUp, Calendar, CreditCard, Trophy, RefreshCw, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { StatSkeleton } from '../components/Skeleton'
import useSettingsStore from '../store/useSettingsStore'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PAY_COLORS = { cash: '#6366f1', card: '#8b5cf6', card_alif: '#f59e0b', card_dc: '#10b981', mixed: '#f43f5e' }
const PAY_LABELS = { cash: 'Нақд', card: 'Кард', card_alif: 'Alif', card_dc: 'Корт DC', mixed: 'Омехта' }

function useCountUp(target, running) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    if (!running || !target) { setVal(target || 0); return }
    let start = null
    const duration = 900
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

function StatCard({ icon: Icon, gradient, label, value, sub, delay = 0 }) {
  return (
    <div className="animate-fade-up bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
      style={{ animationDelay: `${delay}ms` }}>
      <div className={`h-1 w-full ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform shadow-md`}>
            <Icon size={20} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [daily, setDaily] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const settings = useSettingsStore()
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

  const t = stats?.today || {}
  const m = stats?.month || {}

  const todayRevenue  = Number(t.total  || 0)
  const todayProfit   = Number(t.profit || 0)
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
      name:  PAY_LABELS[p.payment_method] || p.payment_method,
      value: Number(p.total),
      color: PAY_COLORS[p.payment_method] || '#94a3b8',
      count: p.count,
    }))

  const chartData = daily.map((d) => ({
    date:  d.date?.slice(5) || d.date,
    total: Number(d.total || 0),
  }))

  const topProducts = stats?.top_products || []
  const COLORS = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Панели идора</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
            {lastUpdated && ` · Нав кардан: ${lastUpdated.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-all hover:shadow-sm active:scale-95">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Нав кардан</span>
        </button>
      </div>

      {loading ? <StatSkeleton count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard icon={ShoppingCart} gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            label="Фурӯши имрӯз"  value={`${fmt(animTodayRev)} сомони`}   sub={`${t.count || 0} амалиёт`} delay={0}   />
          <StatCard icon={TrendingUp}  gradient="bg-gradient-to-br from-emerald-500 to-green-600"
            label="Фоидаи имрӯз"  value={`${fmt(animTodayProfit)} сомони`} sub={`${profitPct}% фоида`}     delay={60}  />
          <StatCard icon={Calendar}    gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            label="Фурӯши моҳ"    value={`${fmt(animMonthRev)} сомони`}    sub={`${m.count || 0} амалиёт`} delay={120} />
          <StatCard icon={CreditCard}  gradient="bg-gradient-to-br from-orange-500 to-amber-500"
            label="Фоидаи моҳ"    value={`${fmt(animMonthProfit)} сомони`} sub={`${monthPct}% фоида`}      delay={180} />
        </div>
      )}

      {/* ── Карта харчоти моҳона ── */}
      {totalSalaries > 0 && !loading && (() => {
        const covered = todayProfit >= dailyTarget
        const pct = dailyTarget > 0 ? Math.min(Math.round((todayProfit / dailyTarget) * 100), 100) : 0
        const shortfall = todayProfit - dailyTarget
        return (
          <div className={`animate-fade-up rounded-2xl border-2 p-5 ${covered ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
            style={{ animationDelay: '220ms' }}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {covered
                  ? <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
                  : <AlertCircle size={22} className="text-red-400 shrink-0" />
                }
                <div>
                  <p className={`font-bold text-sm ${covered ? 'text-emerald-800' : 'text-red-700'}`}>
                    {covered ? 'Харчот пӯшонида шуд ✓' : 'Харчот пӯшонида нашудааст'}
                  </p>
                  <p className={`text-xs mt-0.5 ${covered ? 'text-emerald-600' : 'text-red-500'}`}>
                    Аз рӯи фоидаи соф
                  </p>
                </div>
              </div>
              <div className={`text-2xl font-black ${covered ? 'text-emerald-700' : 'text-red-600'}`}>
                {pct}%
                <span className="text-xs font-normal ml-1 text-gray-400">ичро шуд</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${covered ? 'bg-emerald-500' : 'bg-red-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* 3 figures */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Фоида (имрӯз)',
                  value: `${fmt(todayProfit)} сомони`,
                  color: covered ? 'text-emerald-700' : 'text-blue-600',
                },
                {
                  label: `Ҳадаф (÷30)`,
                  value: `${fmt(dailyTarget)} сомони`,
                  color: 'text-gray-700',
                },
                {
                  label: shortfall >= 0 ? 'Зиёдатӣ' : 'Кам',
                  value: `${shortfall >= 0 ? '+' : ''}${fmt(shortfall)} сомони`,
                  color: shortfall >= 0 ? 'text-emerald-600' : 'text-red-500',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-sm font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Employee list */}
            {employees.length > 0 && (
              <div className="mt-4 border-t border-white/40 pt-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">РАСХОД</p>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {employees.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        {e.name}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mt-1 pt-1 border-t border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      Ҷамъи моҳона
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {employees.map((e, i) => (
                      <p key={i} className="text-xs text-gray-600">{Number(e.salary).toLocaleString()} сомони</p>
                    ))}
                    <p className="text-xs font-bold text-gray-700 mt-1 pt-1 border-t border-gray-200">
                      {totalSalaries.toLocaleString()} сомони/мос
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Trophy size={16} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-sm">Маҳсулоти бехтарин</h2>
              <p className="text-xs text-gray-400">30 рӯзи охир</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {topProducts.slice(0, 6).map((p, i) => {
              const maxQty = topProducts[0]?.total_qty || 1
              const pct = Math.round((p.total_qty / maxQty) * 100)
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate">{p.product_name}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-gray-400">{p.total_qty} дона</span>
                        <span className="text-sm font-bold text-indigo-600">{fmt(p.total_revenue)} сомони</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${COLORS[i] || 'bg-blue-500'} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
            {!topProducts.length && (
              <div className="text-center py-8 text-gray-400">
                <Trophy size={28} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Маълумот йӯқ</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <h2 className="font-bold text-gray-800 text-sm mb-0.5">Усулҳои пардохт</h2>
          <p className="text-xs text-gray-400 mb-4">Имрӯз аз рӯи навъ</p>
          {paymentData.length > 0 ? (
            <>
              <PieChart width={180} height={140} style={{ margin: '0 auto' }}>
                <Pie data={paymentData} cx={90} cy={70} innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={4}>
                  {paymentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${fmt(v)} сомони`} />
              </PieChart>
              <div className="space-y-2 mt-3">
                {paymentData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                      <span className="text-gray-600 text-xs">{p.name} <span className="text-gray-400">({p.count})</span></span>
                    </div>
                    <span className="font-semibold text-gray-800 text-xs">{fmt(p.value)} сомони</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <CreditCard size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Имрӯз пардохт нест</p>
            </div>
          )}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-800 text-sm">Даромад</h2>
              <p className="text-xs text-gray-400">14 рӯзи охир</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
              <ArrowUpRight size={14} />
              Динамика
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }}
                formatter={(v) => [`${fmt(v)} сомони`, 'Даромад']}
              />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={false}
                activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(stats?.cashier_stats || []).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-up" style={{ animationDelay: '250ms' }}>
          <h2 className="font-bold text-gray-800 text-sm mb-4">Кормандон (имрӯз)</h2>
          <div className="space-y-2">
            {(stats.cashier_stats || []).map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.count} фурӯш</p>
                </div>
                <p className="text-sm font-bold text-indigo-600">{fmt(c.total)} сомони</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
