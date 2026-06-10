import { Printer, X, CheckCircle, ShoppingBag } from 'lucide-react'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PAY_LABELS = {
  cash: 'Нақд пул',
  card: 'Кард',
  card_alif: 'Alif Pay',
  card_dc: 'DC Pay',
  mixed: 'Омехта',
}

export default function Receipt({ sale, onClose, onNext }) {
  const storeName = localStorage.getItem('store_name') || 'Телефон дӯкон'
  const now = new Date(sale.created_at || Date.now())
  const dateStr = now.toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md animate-scale-in">

        {/* Action buttons */}
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex items-center gap-2 text-white font-semibold">
            <CheckCircle size={18} className="text-emerald-400" />
            Фурӯш тамом шуд!
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Receipt paper */}
        <div id="receipt" className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header gradient */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 px-6 pt-6 pb-8 text-white text-center relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 11px)' }} />
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShoppingBag size={22} className="text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-wide">{storeName}</h2>
            <p className="text-indigo-200 text-xs mt-1 uppercase tracking-widest">Чеки харид</p>
          </div>

          {/* Tear effect */}
          <div className="flex" style={{ marginTop: '-1px' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex-1 h-3 bg-white"
                style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }} />
            ))}
          </div>

          <div className="px-6 pb-6">
            {/* Order info */}
            <div className="flex justify-between text-xs text-gray-400 mb-5">
              <div>
                <p className="font-bold text-gray-800 text-base">№ {sale.order_number}</p>
                <p className="mt-0.5">{dateStr} · {timeStr}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-600">Усули пардохт</p>
                <p className="mt-0.5 font-bold text-indigo-700">{PAY_LABELS[sale.payment_method] || sale.payment_method}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 mb-4" />

            {/* Items */}
            <div className="space-y-2.5 mb-4">
              {(sale.items || []).map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">
                      {item.product_name}
                      {item.color ? <span className="text-gray-400 font-normal"> · {item.color}</span> : null}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmt(item.unit_price || 0)} × {item.quantity} дона
                    </p>
                    {(item.modifiers || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.modifiers.map((m, mi) => (
                          <span key={mi} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-100">
                            {m.name}{Number(m.price) > 0 ? ` +${fmt(m.price)}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-800 shrink-0">{fmt(item.line_total)} сомони</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 mb-4" />

            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Маҳсулот ({(sale.items || []).reduce((s, i) => s + i.quantity, 0)} дона)</span>
                <span>{fmt(sale.total_amount)} сомони</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Тахфиф</span>
                  <span>-{fmt(sale.discount_amount)} сомони</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <span className="text-base font-bold text-gray-800">Ҳамагӣ</span>
                <span className="text-2xl font-bold text-indigo-600">{fmt(sale.total_amount)} сомони</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <div className="flex justify-center gap-1 mb-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`h-8 rounded-sm ${i % 2 === 0 ? 'w-1 bg-gray-800' : 'w-0.5 bg-gray-400'}`} />
                ))}
                <div className="w-3" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`h-8 rounded-sm ${i % 3 === 0 ? 'w-2 bg-gray-800' : 'w-1 bg-gray-600'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400">Ташаккур барои харид!</p>
              <p className="text-[10px] text-gray-300 mt-0.5 uppercase tracking-widest">POS · {storeName}</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
            <Printer size={17} />
            Чоп кунед
          </button>
          <button onClick={onNext}
            className="flex-1 btn-primary py-3 text-sm font-bold">
            Фармоиши нав
          </button>
        </div>
      </div>
    </div>
  )
}
