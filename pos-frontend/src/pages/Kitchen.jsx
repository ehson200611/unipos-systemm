import { useEffect, useState, useCallback } from 'react'
import { getSales, markPreparing, markReady, markServed } from '../api/sales'
import { ChefHat, Clock, CheckCircle, RefreshCw, Utensils, Bell, Table2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

const fmt = (s) => {
  const d = new Date(s)
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

export default function Kitchen() {
  const toast = useToast()
  const { language: lang = 'tg' } = useSettingsStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [updating, setUpdating] = useState(null)
  const [tick, setTick] = useState(0)

  const elapsed = (s) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 60000)
    return diff < 1 ? t(lang, 'kitchen_elapsed_now') : `${diff} ${t(lang, 'kitchen_elapsed_min')}`
  }

  const getStatusConfig = () => ({
    pending:   { label: t(lang, 'kitchen_status_new'),     color: 'bg-amber-50 border-amber-300',   badge: 'bg-amber-500',   text: 'text-amber-700',   next: 'preparing', nextLabel: t(lang, 'kitchen_act_start') },
    preparing: { label: t(lang, 'kitchen_status_cooking'), color: 'bg-blue-50 border-blue-300',    badge: 'bg-blue-500',    text: 'text-blue-700',    next: 'ready',     nextLabel: t(lang, 'kitchen_act_ready') },
    ready:     { label: t(lang, 'kitchen_status_ready'),   color: 'bg-emerald-50 border-emerald-300', badge: 'bg-emerald-500', text: 'text-emerald-700', next: 'served',    nextLabel: t(lang, 'kitchen_act_served') },
  })

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const r = await getSales({ page_size: 80, ordering: 'created_at' })
      const all = r.data.results || r.data
      setOrders(all.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)))
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto refresh every 15 seconds
  useEffect(() => {
    const id = setInterval(() => { load(true); setTick((tk) => tk + 1) }, 15000)
    return () => clearInterval(id)
  }, [load])

  // Elapsed time re-render every minute
  useEffect(() => {
    const id = setInterval(() => setTick((tk) => tk + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const ACTION_MAP = { preparing: markPreparing, ready: markReady, served: markServed }

  const updateStatus = async (saleId, newStatus) => {
    setUpdating(saleId)
    try {
      const fn = ACTION_MAP[newStatus]
      if (fn) await fn(saleId)
      setOrders((prev) =>
        prev
          .map((o) => o.id === saleId ? { ...o, status: newStatus } : o)
          .filter((o) => newStatus !== 'served' || o.id !== saleId)
      )
      if (newStatus === 'served') toast(t(lang, 'kitchen_served_toast'), 'success')
      else if (newStatus === 'ready') toast(t(lang, 'kitchen_ready_toast'), 'success')
    } catch { toast(t(lang, 'kitchen_error'), 'error') }
    finally { setUpdating(null) }
  }

  const STATUS_CONFIG = getStatusConfig()
  const shown = orders.filter((o) => o.status === tab)
  const counts = {
    pending:   orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready:     orders.filter((o) => o.status === 'ready').length,
  }

  const isUrgent = (createdAt) => {
    return (Date.now() - new Date(createdAt).getTime()) > 15 * 60 * 1000
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{t(lang, 'kitchen_title')}</h1>
            <p className="text-xs text-gray-400">{t(lang, 'kitchen_auto_refresh')}</p>
          </div>
        </div>
        <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t(lang, 'kitchen_refresh')}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              tab === status
                ? `${cfg.badge} text-white shadow-md`
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cfg.label}
            {counts[status] > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === status ? 'bg-white/25' : `${cfg.badge} text-white`}`}>
                {counts[status]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-5 bg-gray-100 rounded-lg w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-fade-up">
          <Utensils size={40} className="mb-3 opacity-20" />
          <p className="font-medium">{t(lang, 'kitchen_no_orders')}</p>
          <p className="text-xs mt-1 opacity-60">{STATUS_CONFIG[tab].label} {t(lang, 'kitchen_status_empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {shown.map((order) => {
            const cfg = STATUS_CONFIG[order.status]
            const urgent = isUrgent(order.created_at)
            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border-2 ${cfg.color} shadow-sm overflow-hidden animate-fade-up transition-all hover:shadow-md ${urgent && order.status === 'pending' ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}
              >
                {/* Card header */}
                <div className={`px-4 py-3 ${cfg.badge} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-base">#{order.order_number}</span>
                    {order.table_number && (
                      <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Table2 size={10} /> {order.table_number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/80 text-xs">
                    {urgent && order.status === 'pending' && <Bell size={12} className="animate-bounce" />}
                    <Clock size={12} />
                    <span className="font-mono">{elapsed(order.created_at)}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="px-4 py-3">
                  <div className="space-y-2 mb-3">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium truncate flex-1">{item.product_name}</span>
                          <span className={`font-bold ml-2 shrink-0 ${cfg.text}`}>×{item.quantity}</span>
                        </div>
                        {(item.modifiers || []).length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1 pl-1">
                            {item.modifiers.map((m, mi) => (
                              <span key={mi} className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full font-medium">
                                {m.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 text-xs text-amber-700">
                      📝 {order.note}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{fmt(order.created_at)}</span>
                    <span>{order.cashier_name}</span>
                  </div>

                  {cfg.next && (
                    <button
                      disabled={updating === order.id}
                      onClick={() => updateStatus(order.id, cfg.next)}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${cfg.badge} hover:opacity-90 active:scale-[0.98] disabled:opacity-60`}
                    >
                      {updating === order.id
                        ? <RefreshCw size={14} className="animate-spin" />
                        : <CheckCircle size={14} />
                      }
                      {cfg.nextLabel}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
