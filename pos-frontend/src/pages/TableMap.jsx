import { useEffect, useState, useCallback } from 'react'
import { getSales } from '../api/sales'
import useSettingsStore from '../store/useSettingsStore'
import { Table2, Clock, RefreshCw, CheckCircle, Loader } from 'lucide-react'
import { t } from '../lib/i18n'

const fmt = (s) => {
  const d = new Date(s)
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

export default function TableMap() {
  const settings = useSettingsStore()
  const { language: lang = 'tg' } = settings
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [tick, setTick] = useState(0)

  const elapsed = (s) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 60000)
    return diff < 1 ? t(lang, 'kitchen_elapsed_now') : `${diff} ${t(lang, 'kitchen_elapsed_min')}`
  }

  const getStatusColor = () => ({
    pending:   { bg: 'bg-amber-500',   ring: 'ring-amber-300',   label: t(lang, 'tablemap_status_pending') },
    preparing: { bg: 'bg-blue-500',    ring: 'ring-blue-300',    label: t(lang, 'tablemap_status_cooking') },
    ready:     { bg: 'bg-emerald-500', ring: 'ring-emerald-300', label: t(lang, 'tablemap_status_ready') },
  })

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const r = await getSales({ page_size: 200 })
      const all = r.data.results || r.data
      setOrders(all.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)))
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const id = setInterval(() => { load(true); setTick((tk) => tk + 1) }, 15000)
    return () => clearInterval(id)
  }, [load])
  useEffect(() => {
    const id = setInterval(() => setTick((tk) => tk + 1), 60000)
    return () => clearInterval(id)
  }, [])

  // Map: tableNumber → order
  const tableOrders = {}
  orders.forEach((o) => {
    if (o.table_number) {
      const key = String(o.table_number)
      if (!tableOrders[key] || o.status === 'ready') tableOrders[key] = o
    }
  })

  const tables = Array.from({ length: settings.tableCount }, (_, i) => String(i + 1))
  const freeCount = tables.filter((tbl) => !tableOrders[tbl]).length
  const occupiedCount = tables.length - freeCount

  const STATUS_COLOR = getStatusColor()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t(lang, 'tablemap_title')}</h1>
          <p className="text-sm text-gray-400">{t(lang, 'tablemap_sub')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-200" /><span className="text-gray-500">{t(lang, 'tablemap_free')}: {freeCount}</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-gray-500">{t(lang, 'tablemap_busy')}: {occupiedCount}</span></div>
          </div>
          <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap animate-fade-up">
        {[
          { color: 'bg-gray-100 border-gray-200', label: t(lang, 'tablemap_legend_free') },
          { color: 'bg-amber-100 border-amber-300', label: t(lang, 'tablemap_legend_pending') },
          { color: 'bg-blue-100 border-blue-300', label: t(lang, 'tablemap_legend_cooking') },
          { color: 'bg-emerald-100 border-emerald-300', label: t(lang, 'tablemap_legend_ready') },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-6 h-6 rounded-lg border-2 ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-indigo-400" /></div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {tables.map((num) => {
            const order = tableOrders[num]
            const sc = order ? STATUS_COLOR[order.status] : null
            const isSelected = selected === num
            const isUrgent = order && (Date.now() - new Date(order.created_at).getTime()) > 20 * 60 * 1000

            return (
              <button
                key={num}
                onClick={() => setSelected(isSelected ? null : num)}
                className={`
                  relative p-3 rounded-2xl border-2 text-left transition-all duration-200
                  ${order
                    ? `${sc.bg.replace('bg-', 'bg-').replace('500', '50')} ${sc.ring.replace('ring-', 'border-').replace('300', '400')} hover:shadow-md`
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                  }
                  ${isSelected ? 'ring-2 ring-offset-2 ring-indigo-400 shadow-lg' : ''}
                  ${isUrgent ? 'animate-pulse' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${order ? 'text-gray-600' : 'text-gray-400'}`}>{t(lang, 'tablemap_table_lbl')}</span>
                  {order && (
                    <div className={`w-2.5 h-2.5 rounded-full ${sc.bg}`} />
                  )}
                </div>
                <p className={`text-2xl font-black leading-none mb-1 ${order ? 'text-gray-800' : 'text-gray-300'}`}>{num}</p>
                {order ? (
                  <div>
                    <p className={`text-[10px] font-bold ${sc.bg.replace('bg-', 'text-').replace('500', '700')}`}>{sc.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">#{order.order_number} · {elapsed(order.created_at)}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-300 font-medium">{t(lang, 'tablemap_free_detail')}</p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Order detail panel */}
      {selected && tableOrders[selected] && (() => {
        const order = tableOrders[selected]
        const sc = STATUS_COLOR[order.status]
        return (
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center`}>
                  <Table2 size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-gray-800 text-lg">{t(lang, 'tablemap_table_lbl')} {selected} — #{order.order_number}</p>
                  <p className={`text-sm font-semibold ${sc.bg.replace('bg-', 'text-').replace('500', '700')}`}>{sc.label}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>{fmt(order.created_at)}</p>
                <p className="font-bold text-gray-600">{elapsed(order.created_at)} {t(lang, 'tablemap_elapsed')}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="font-semibold text-gray-800">{item.product_name}</span>
                    {item.color && <span className="text-gray-400 text-sm ml-1">· {item.color}</span>}
                    {(item.modifiers || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.modifiers.map((m, mi) => (
                          <span key={mi} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{m.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-gray-700">×{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t(lang, 'tablemap_cashier')}: {order.cashier_name}</span>
              <span className="font-bold text-lg text-gray-800">{Number(order.total_amount).toLocaleString('ru')} {t(lang, 'currency')}</span>
            </div>
          </div>
        )
      })()}

      {selected && !tableOrders[selected] && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 text-center animate-scale-in">
          <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-700">{t(lang, 'tablemap_table_lbl')} {selected} — {t(lang, 'tablemap_free_detail')}</p>
          <p className="text-sm text-gray-400 mt-1">{t(lang, 'tablemap_no_orders')}</p>
        </div>
      )}
    </div>
  )
}
