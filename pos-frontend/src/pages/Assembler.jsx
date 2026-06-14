import { useEffect, useState, useRef, useCallback } from 'react'
import { getSales, markServed } from '../api/sales'
import { PackageCheck, Clock, Bell, CheckCheck, RefreshCw, Table2, Utensils, ChevronRight, AlertCircle } from 'lucide-react'
import { useToast } from '../components/Toast'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

const fmt = (s) => {
  const d = new Date(s)
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

// Simple beep using Web Audio API — no external files needed
function beep(freq = 880, dur = 150, vol = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur / 1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + dur / 1000)
  } catch {}
}

function doubleBeep() {
  beep(880, 120, 0.35)
  setTimeout(() => beep(1100, 120, 0.35), 180)
}

export default function Assembler() {
  const toast = useToast()
  const { language: lang = 'tg' } = useSettingsStore()
  const [ready, setReady] = useState([])
  const [preparing, setPreparing] = useState([])
  const [serving, setServing] = useState(null)
  const [tick, setTick] = useState(0)
  const [loading, setLoading] = useState(true)
  const prevReadyIds = useRef(new Set())

  const elapsed = (s) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 60000)
    if (diff < 1) return t(lang, 'assembler_elapsed_now')
    return `${diff} ${t(lang, 'assembler_elapsed_min')}`
  }

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const r = await getSales({ page_size: 100, ordering: 'created_at' })
      const all = r.data.results || r.data

      const newReady = all.filter((o) => o.status === 'ready')
      const newPreparing = all.filter((o) => ['pending', 'preparing'].includes(o.status))

      // Sound alert for newly ready orders
      const newIds = new Set(newReady.map((o) => o.id))
      const appeared = [...newIds].filter((id) => !prevReadyIds.current.has(id))
      if (appeared.length > 0 && prevReadyIds.current.size > 0) {
        doubleBeep()
      }
      prevReadyIds.current = newIds

      setReady(newReady.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
      setPreparing(newPreparing.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const id = setInterval(() => { load(true); setTick((tk) => tk + 1) }, 10000)
    return () => clearInterval(id)
  }, [load])

  // Re-render elapsed every minute
  useEffect(() => {
    const id = setInterval(() => setTick((tk) => tk + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const handleServed = async (order) => {
    setServing(order.id)
    try {
      await markServed(order.id)
      setReady((prev) => prev.filter((o) => o.id !== order.id))
      prevReadyIds.current.delete(order.id)
      beep(660, 200, 0.3)
      toast(`${t(lang, 'assembler_table')} #${order.order_number} ${t(lang, 'assembler_delivered_toast')}`, 'success')
    } catch { toast(t(lang, 'error'), 'error') }
    finally { setServing(null) }
  }

  const isUrgent = (o) => (Date.now() - new Date(o.created_at).getTime()) > 20 * 60 * 1000

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <PackageCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{t(lang, 'assembler_title')}</h1>
            <p className="text-xs text-gray-400">{t(lang, 'assembler_sub')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ready.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl animate-pulse">
              <Bell size={15} className="text-emerald-600" />
              <span className="font-bold text-emerald-700 text-sm">{ready.length} {t(lang, 'assembler_ready_count')}</span>
            </div>
          )}
          <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t(lang, 'assembler_refresh')}
          </button>
        </div>
      </div>

      {/* Main board: two columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0 overflow-hidden">

        {/* LEFT: READY orders (3/5 width) — primary focus */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{t(lang, 'assembler_ready_col')}</h2>
            <span className="ml-auto bg-emerald-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">{ready.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5 animate-pulse">
                  <div className="h-8 bg-gray-100 rounded-xl w-1/3 mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : ready.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                <CheckCheck size={48} className="mb-3 opacity-15" />
                <p className="font-semibold text-base">{t(lang, 'assembler_all_done')}</p>
                <p className="text-xs mt-1 opacity-60">{t(lang, 'assembler_will_notify')}</p>
              </div>
            ) : (
              ready.map((order) => {
                const urgent = isUrgent(order)
                const isServing = serving === order.id
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all animate-fade-up ${
                      urgent ? 'border-red-400 ring-2 ring-red-200' : 'border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    {/* Order header */}
                    <div className={`px-5 py-3 flex items-center justify-between ${urgent ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-black text-2xl tracking-wide">#{order.order_number}</span>
                        {order.table_number && (
                          <div className="flex items-center gap-1 bg-white/20 text-white text-sm px-3 py-1 rounded-full font-bold">
                            <Table2 size={13} />
                            {t(lang, 'assembler_table')} {order.table_number}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-white/80 text-xs">
                        {urgent && <AlertCircle size={14} className="animate-bounce text-yellow-300" />}
                        <Clock size={13} />
                        <span className="font-mono font-bold">{elapsed(order.created_at)}</span>
                        <span className="opacity-60">({fmt(order.created_at)})</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="px-5 py-4">
                      <div className="space-y-2 mb-4">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                              <span className="text-emerald-700 font-black text-sm">{item.quantity}</span>
                            </div>
                            <span className="text-gray-800 font-semibold">{item.product_name}</span>
                            {item.color && <span className="text-gray-400 text-sm">· {item.color}</span>}
                          </div>
                        ))}
                      </div>

                      {order.note && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-amber-800 font-medium">
                          📝 {order.note}
                        </div>
                      )}

                      {/* Deliver button */}
                      <button
                        disabled={isServing}
                        onClick={() => handleServed(order)}
                        className={`w-full py-4 rounded-xl text-base font-black text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg ${
                          urgent
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-red-200'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {isServing
                          ? <><RefreshCw size={20} className="animate-spin" /> {t(lang, 'assembler_saving')}</>
                          : <><CheckCheck size={20} /> {t(lang, 'assembler_deliver_btn')}</>
                        }
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT: PREPARING orders (2/5 width) — secondary info */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
            <h2 className="font-bold text-gray-500 text-sm uppercase tracking-wide">{t(lang, 'assembler_preparing_col')}</h2>
            <span className="ml-auto bg-blue-400 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">{preparing.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {preparing.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
                <Utensils size={32} className="mb-2 opacity-30" />
                <p className="text-sm">{t(lang, 'assembler_no_queue')}</p>
              </div>
            ) : (
              preparing.map((order) => (
                <div key={order.id}
                  className={`bg-white rounded-xl border px-4 py-3 transition-all animate-fade-up ${
                    order.status === 'pending' ? 'border-amber-200 bg-amber-50/50' : 'border-blue-200 bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-lg ${order.status === 'pending' ? 'text-amber-700' : 'text-blue-700'}`}>
                        #{order.order_number}
                      </span>
                      {order.table_number && (
                        <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Table2 size={9} /> {order.table_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status === 'pending' ? t(lang, 'assembler_status_new') : t(lang, 'assembler_status_cooking')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <ChevronRight size={11} className="text-gray-300 shrink-0" />
                        <span className="truncate">{item.product_name}</span>
                        <span className="font-bold text-gray-800 shrink-0 ml-auto">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Clock size={10} />
                    <span>{elapsed(order.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
