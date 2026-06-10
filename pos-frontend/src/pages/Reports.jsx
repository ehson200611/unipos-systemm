import { useEffect, useState } from 'react'
import { getDashboard, getDaily } from '../api/reports'
import { TrendingUp, BarChart2, ShoppingCart, Calendar, ChevronDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { StatSkeleton } from '../components/Skeleton'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Reports() {
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
  const revenue = Number(m.total  || 0)
  const profit  = Number(m.profit || 0)
  const count   = Number(m.count  || 0)
  const perDay  = days > 0 ? revenue / days : 0

  const chartData = daily.map((d) => ({
    date:    d.date?.slice(5) || d.date,
    revenue: Number(d.total || 0),
    count:   Number(d.count || 0),
  }))

  const CARDS = [
    { icon: TrendingUp,   label: 'Даромад',      value: `${fmt(revenue)} сомони`, gradient: 'from-blue-500 to-indigo-600' },
    { icon: BarChart2,    label: 'Фоида',         value: `${fmt(profit)} сомони`,  gradient: 'from-emerald-500 to-green-600' },
    { icon: ShoppingCart, label: 'Фармоишҳо',    value: String(count),             gradient: 'from-violet-500 to-purple-600' },
    { icon: Calendar,     label: 'Рӯзона (ўрт)', value: `${fmt(perDay)} сомони`,  gradient: 'from-orange-500 to-amber-500' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ҳисоботҳо</h1>
          <p className="text-sm text-gray-400">Таҳлили фурӯш</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowDrop(!showDrop)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all">
            {days} рӯз <ChevronDown size={15} className={`transition-transform ${showDrop ? 'rotate-180' : ''}`} />
          </button>
          {showDrop && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-10 w-32 animate-scale-in">
              {[7, 14, 30, 60, 90].map((d) => (
                <button key={d} onClick={() => { setDays(d); setShowDrop(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${days === d ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                  {d} рӯз
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? <StatSkeleton count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {CARDS.map(({ icon: Icon, label, value, gradient }, i) => (
            <div key={i} className="animate-fade-up bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
              <div className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-lg font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <h2 className="font-bold text-gray-800 text-sm mb-0.5">Даромади ҳаррӯза</h2>
        <p className="text-xs text-gray-400 mb-5">{days} рӯзи охир</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }}
                formatter={(v) => [`${fmt(v)} сомони`, 'Даромад']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={false}
                activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-14 text-sm">Ин давра маълумот нест</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '150ms' }}>
        <h2 className="font-bold text-gray-800 text-sm mb-0.5">Фармоишҳои ҳаррӯза</h2>
        <p className="text-xs text-gray-400 mb-5">{days} рӯзи охир</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }}
                formatter={(v) => [v, 'Фармоишҳо']}
              />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} dot={false}
                activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-14 text-sm">Ин давра маълумот нест</p>
        )}
      </div>

      {(stats?.cashier_stats || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
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
