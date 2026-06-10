import { useEffect, useState } from 'react'
import { getShifts, openShift, closeShift, getCurrentShift } from '../api/sales'
import { Clock, Play, Square, Loader, Timer } from 'lucide-react'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function duration(from, to) {
  const diff = Math.floor((new Date(to || Date.now()).getTime() - new Date(from).getTime()) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  if (h > 0) return `${h}с ${m}д`
  if (m > 0) return `${m}д ${s}с`
  return `${s}с`
}

export default function Shifts() {
  const toast = useToast()
  const [shifts, setShifts] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.allSettled([getShifts(), getCurrentShift()])
      if (s.status === 'fulfilled') setShifts(s.value.data.results || s.value.data)
      if (c.status === 'fulfilled') setCurrent(c.value.data)
      else setCurrent(null)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleOpen = async () => {
    setActing(true)
    try { await openShift(); toast('Навбат кушода шуд'); load() }
    catch (e) { toast(e.response?.data?.detail || 'Хатогӣ', 'error') }
    finally { setActing(false) }
  }

  const handleClose = async () => {
    if (!confirm('Навбатро мебандем?')) return
    setActing(true)
    try { await closeShift({}); toast('Навбат банд шуд', 'warning'); load() }
    catch (e) { toast(e.response?.data?.detail || 'Хатогӣ', 'error') }
    finally { setActing(false) }
  }

  const allShifts = shifts.slice().sort((a, b) => b.id - a.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Навбатҳо</h1>
          <p className="text-sm text-gray-400">Таърихи навбатҳои корӣ</p>
        </div>
        {!current ? (
          <button onClick={handleOpen} disabled={acting} className="btn-primary flex items-center gap-2">
            {acting ? <Loader size={16} className="animate-spin" /> : <Play size={16} />} Навбат кушодан
          </button>
        ) : (
          <button onClick={handleClose} disabled={acting} className="btn-danger flex items-center gap-2">
            {acting ? <Loader size={16} className="animate-spin" /> : <Square size={16} />} Навбатро банд кардан
          </button>
        )}
      </div>

      {current && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white animate-fade-up shadow-lg shadow-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-lg">Навбат кушода аст</p>
              <p className="text-emerald-100 text-sm">
                {current.opened_by_name && `${current.opened_by_name} · `}
                {new Date(current.opened_at).toLocaleString('ru', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
              <Timer size={16} />
              <span className="font-mono font-bold">{duration(current.opened_at, now)}</span>
            </div>
          </div>
        </div>
      )}

      {loading ? <TableSkeleton rows={4} /> : (
        <div className="space-y-3">
          {allShifts.map((shift, idx) => {
            const isOpen = shift.status === 'open'
            const num = allShifts.length - idx
            return (
              <div key={shift.id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all animate-fade-up ${isOpen ? 'border-emerald-300' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOpen ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                    <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">Навбат #{num}</span>
                      <span className={`badge ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isOpen ? 'Кушода' : 'Баста'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(shift.opened_at).toLocaleString('ru')}
                      {shift.closed_at && ` — ${new Date(shift.closed_at).toLocaleString('ru')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-1.5 shrink-0">
                    <Timer size={13} />
                    <span className="font-mono font-semibold">
                      {isOpen ? duration(shift.opened_at, now) : shift.closed_at ? duration(shift.opened_at, shift.closed_at) : '—'}
                    </span>
                  </div>
                  {!isOpen && shift.summary && (
                    <p className="font-bold text-indigo-600 shrink-0 ml-2">{fmt(shift.summary.total_revenue)} сомони</p>
                  )}
                </div>

                {!isOpen && shift.summary && (
                  <div className="px-5 pb-4 grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Фурӯш</p>
                      <p className="text-xl font-bold text-gray-800">{shift.summary.sale_count}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Фоида</p>
                      <p className="text-sm font-bold text-emerald-600">{fmt(shift.summary.total_profit)} сомони</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Кушода</p>
                      <p className="text-sm font-bold text-indigo-700 truncate">{shift.opened_by_name || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {!allShifts.length && (
            <div className="text-center py-16 text-gray-400">
              <Clock size={36} className="mx-auto mb-3 opacity-20" />
              <p>Таърихи навбат нест</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
