import { useState, useEffect, useCallback } from 'react'
import { ClipboardCheck, Plus, CheckCircle2, AlertTriangle, RotateCcw, Lock } from 'lucide-react'
import { getSessions, getSession, createSession, updateLine, closeSession } from '../api/stocktake'

function FarqBadge({ diff }) {
  if (diff === null || diff === undefined) return <span className="text-gray-300 text-xs">—</span>
  if (diff === 0) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={12} /> 0</span>
  if (diff < 0) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><AlertTriangle size={12} /> {diff}</span>
  return <span className="text-xs font-semibold text-blue-600">+{diff}</span>
}

export default function Stocktake() {
  const [nishastho, setNishastho] = useState([])
  const [faol, setFaol] = useState(null)
  const [loading, setLoading] = useState(true)
  const [meofarad, setMeofarad] = useState(false)
  const [izoh, setIzoh] = useState('')
  const [navNishast, setNavNishast] = useState(false)
  const [nigohmeshavad, setNigohmeshavad] = useState({})
  const [mahalliqty, setMahalliqty] = useState({})
  const [mebandad, setMebandad] = useState(false)
  const [justujo, setJustujo] = useState('')

  const barresikun = useCallback(async () => {
    try {
      const r = await getSessions()
      const royxat = r.data.results || r.data
      setNishastho(royxat)
      const kushoda = royxat.find(s => s.status === 'open')
      if (kushoda) {
        const r2 = await getSession(kushoda.id)
        setFaol(r2.data)
        const init = {}
        r2.data.lines.forEach(l => { init[l.id] = l.actual_qty ?? '' })
        setMahalliqty(init)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const nishastBargir = async (id) => {
    const r = await getSession(id)
    setFaol(r.data)
    const init = {}
    r.data.lines.forEach(l => { init[l.id] = l.actual_qty ?? '' })
    setMahalliqty(init)
  }

  useEffect(() => { barresikun() }, [barresikun])

  const nishastSokhtan = async () => {
    setMeofarad(true)
    try {
      const r = await createSession({ note: izoh })
      setNishastho(prev => [r.data, ...prev])
      setFaol(r.data)
      const init = {}
      r.data.lines.forEach(l => { init[l.id] = l.actual_qty ?? '' })
      setMahalliqty(init)
      setNavNishast(false)
      setIzoh('')
    } catch (e) {
      alert(e.response?.data?.detail || 'Хатогӣ рӯй дод')
    } finally {
      setMeofarad(false)
    }
  }

  const satrNigoh = async (nishastId, satrId) => {
    const qiymat = mahalliqty[satrId]
    if (qiymat === '' || qiymat === null || qiymat === undefined) return
    const raqam = parseInt(qiymat, 10)
    if (isNaN(raqam) || raqam < 0) return
    setNigohmeshavad(prev => ({ ...prev, [satrId]: true }))
    try {
      const r = await updateLine(nishastId, satrId, { actual_qty: raqam })
      setFaol(prev => ({
        ...prev,
        lines: prev.lines.map(l => l.id === satrId ? r.data : l)
      }))
    } catch {}
    finally { setNigohmeshavad(prev => ({ ...prev, [satrId]: false })) }
  }

  const nishastBand = async (tatbiq) => {
    if (!faol) return
    if (!confirm(tatbiq
      ? 'Нишастро мебандем ва тафовутҳоро ба анбор татбиқ мекунем?'
      : 'Нишастро бе тағйир мебандем?')) return
    setMebandad(true)
    try {
      const r = await closeSession(faol.id, tatbiq)
      setFaol(r.data)
      setNishastho(prev => prev.map(s => s.id === r.data.id ? r.data : s))
    } catch (e) {
      alert(e.response?.data?.detail || 'Хатогӣ рӯй дод')
    } finally {
      setMebandad(false)
    }
  }

  const филтр = faol
    ? faol.lines.filter(l => l.product_name.toLowerCase().includes(justujo.toLowerCase()))
    : []

  const ҳисобшуда = faol ? faol.lines.filter(l => l.actual_qty !== null).length : 0
  const ҳамагӣ = faol ? faol.lines.length : 0
  const зиёдӣ = faol ? faol.lines.filter(l => l.diff > 0) : []
  const норасоӣ = faol ? faol.lines.filter(l => l.diff < 0) : []

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Сарлавҳа */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <ClipboardCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Баршумории анбор</h1>
            <p className="text-xs text-gray-400">Санҷиши воқеии захираи анбор</p>
          </div>
        </div>
        <button
          onClick={() => setNavNishast(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors shadow"
        >
          <Plus size={16} /> Нишасти нав
        </button>
      </div>

      {/* Шакли нишасти нав */}
      {navNishast && (
        <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm space-y-3">
          <p className="font-semibold text-gray-700">Нишасти нав</p>
          <input
            value={izoh}
            onChange={e => setIzoh(e.target.value)}
            placeholder="Тавзеҳ (ихтиёрӣ)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <div className="flex gap-2">
            <button
              onClick={nishastSokhtan}
              disabled={meofarad}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {meofarad ? 'Лутфан интизор шавед...' : 'Сохтан'}
            </button>
            <button onClick={() => setNavNishast(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
              Бекор кардан
            </button>
          </div>
        </div>
      )}

      {/* Рӯйхати нишастҳо + нишасти фаъол */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Рӯйхат */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">Нишастҳо</p>
          {loading && <p className="text-sm text-gray-400 px-1">Лутфан интизор шавед...</p>}
          {nishastho.map(s => (
            <button
              key={s.id}
              onClick={() => nishastBargir(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                faol?.id === s.id
                  ? 'bg-violet-50 border-violet-200 text-violet-800 font-semibold'
                  : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">Нишаст #{s.id}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(s.created_at).toLocaleDateString('ru-RU')}
                {' · '}
                <span className={s.status === 'open' ? 'text-emerald-600' : 'text-gray-400'}>
                  {s.status === 'open' ? 'Кушода' : 'Баста'}
                </span>
              </div>
            </button>
          ))}
          {!loading && nishastho.length === 0 && (
            <p className="text-xs text-gray-400 px-1">Нишаст нест. Нав эҷод кунед.</p>
          )}
        </div>

        {/* Нишасти фаъол */}
        {faol ? (
          <div className="lg:col-span-3 space-y-4">
            {/* Нишондиҳандаҳо */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-center">
              <div className="text-sm">
                <span className="text-gray-400">Нишаст</span>{' '}
                <span className="font-bold text-gray-900">#{faol.id}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Ҳисобшуда:</span>{' '}
                <span className="font-bold text-gray-900">{ҳисобшуда}/{ҳамагӣ}</span>
              </div>
              {норасоӣ.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-red-600 font-semibold">
                  <AlertTriangle size={14} /> {норасоӣ.length} норасоӣ
                </div>
              )}
              {зиёдӣ.length > 0 && (
                <div className="text-sm text-blue-600 font-semibold">
                  +{зиёдӣ.length} зиёдӣ
                </div>
              )}
              {faol.status === 'open' && (
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => nishastBand(false)}
                    disabled={mebandad}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Lock size={13} /> Банд кун (бе тағйир)
                  </button>
                  <button
                    onClick={() => nishastBand(true)}
                    disabled={mebandad}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <RotateCcw size={13} /> Тасдиқ ва банд кун
                  </button>
                </div>
              )}
              {faol.status === 'closed' && (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-400">
                  <Lock size={12} /> Баста {faol.closed_at ? new Date(faol.closed_at).toLocaleString('ru-RU') : ''}
                </span>
              )}
            </div>

            {/* Ҷустуҷӯ */}
            <input
              value={justujo}
              onChange={e => setJustujo(e.target.value)}
              placeholder="Ҷустуҷӯи маҳсулот..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />

            {/* Ҷадвали сатрҳо */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Маҳсулот</th>
                    <th className="text-center px-4 py-3 w-28">Дар система</th>
                    <th className="text-center px-4 py-3 w-32">Воқеан</th>
                    <th className="text-center px-4 py-3 w-24">Фарқ</th>
                  </tr>
                </thead>
                <tbody>
                  {филтр.map(line => {
                    const farq = line.actual_qty !== null
                      ? line.actual_qty - line.system_qty
                      : null
                    const rowBg = farq === null ? '' : farq < 0 ? 'bg-red-50' : farq > 0 ? 'bg-blue-50' : 'bg-emerald-50/40'
                    return (
                      <tr key={line.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${rowBg}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{line.product_name}</td>
                        <td className="px-4 py-2.5 text-center text-gray-500">{line.system_qty}</td>
                        <td className="px-4 py-2.5 text-center">
                          {faol.status === 'open' ? (
                            <input
                              type="number"
                              min="0"
                              value={mahalliqty[line.id] ?? ''}
                              onChange={e => setMahalliqty(prev => ({ ...prev, [line.id]: e.target.value }))}
                              onBlur={() => satrNigoh(faol.id, line.id)}
                              placeholder="—"
                              className={`w-20 text-center border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors ${
                                nigohmeshavad[line.id] ? 'border-violet-300 bg-violet-50' : 'border-gray-200'
                              }`}
                            />
                          ) : (
                            <span className="text-gray-700">{line.actual_qty ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <FarqBadge diff={farq} />
                        </td>
                      </tr>
                    )
                  })}
                  {филтр.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                        Маҳсулот ёфт нашуд
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 flex items-center justify-center py-20 text-gray-400 text-sm">
            Нишасти баршуморӣро интихоб кунед ё нав эҷод кунед
          </div>
        )}
      </div>
    </div>
  )
}
