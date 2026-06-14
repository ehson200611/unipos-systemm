import { useEffect, useState, useRef, useCallback } from 'react'
import { getMenu, getMenuCategories } from '../api/products'
import { createSale } from '../api/sales'
import {
  ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle, Loader,
  Banknote, CreditCard, Smartphone, Zap, Tag, Table2, ScanLine, X, Users, QrCode
} from 'lucide-react'
import { useToast } from '../components/Toast'
import Receipt from '../components/Receipt'
import useSettingsStore, { BUSINESS_TYPES } from '../store/useSettingsStore'
import { t } from '../lib/i18n'

// ── QR payment modal ──────────────────────────────────────────────────────────
function QrModal({ label, qrSrc, total, onClose, lang }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-indigo-500" />
            <p className="font-bold text-gray-800">{label}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-2 mt-1">
          <p className="text-xs text-gray-400">{t(lang, 'pos_qr_show')}</p>
        </div>
        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-center">
            <img src={qrSrc} alt="QR" className="w-52 h-52 object-contain" />
          </div>
          <div className="mt-4 bg-indigo-50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-indigo-600 font-medium">{t(lang, 'pos_qr_amount')}</span>
            <span className="text-xl font-black text-indigo-700">
              {Number(total || 0).toLocaleString('ru', { minimumFractionDigits: 2 })} {t(lang, 'currency')}
            </span>
          </div>
          <button onClick={onClose}
            className="mt-3 w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors">
            {t(lang, 'pos_qr_confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modifier picker modal ─────────────────────────────────────────────────────
function ModifierModal({ product, onConfirm, onClose, lang }) {
  const [selected, setSelected] = useState({})  // { groupId: [modifierId, ...] }

  const toggle = (group, mod) => {
    const cur = selected[group.id] || []
    let next
    if (group.max_select === 1) {
      next = cur.includes(mod.id) ? [] : [mod.id]
    } else {
      next = cur.includes(mod.id)
        ? cur.filter((x) => x !== mod.id)
        : cur.length < group.max_select ? [...cur, mod.id] : cur
    }
    setSelected({ ...selected, [group.id]: next })
  }

  const buildModifiers = () => {
    const result = []
    ;(product.modifier_groups || []).forEach((group) => {
      const sel = selected[group.id] || []
      sel.forEach((mid) => {
        const m = group.modifiers.find((x) => x.id === mid)
        if (m) result.push({ group: group.name, name: m.name, price: m.price })
      })
    })
    return result
  }

  const canConfirm = (product.modifier_groups || []).every((g) => !g.required || (selected[g.id] || []).length > 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex items-center justify-between">
          <p className="font-bold text-white">{product.name}</p>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {(product.modifier_groups || []).map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-bold text-gray-700">{group.name}</p>
                {group.required && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{t(lang, 'pos_modifier_required')}</span>}
                {group.max_select > 1 && <span className="text-[10px] text-gray-400">{t(lang, 'pos_modifier_max')} {group.max_select}</span>}
              </div>
              <div className="space-y-1.5">
                {group.modifiers.filter((m) => m.is_available).map((m) => {
                  const isSelected = (selected[group.id] || []).includes(m.id)
                  return (
                    <button key={m.id} onClick={() => toggle(group, m)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                        isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-gray-50 hover:border-gray-200 text-gray-700'
                      }`}>
                      <span className="font-medium">{m.name}</span>
                      <span className="font-bold">{Number(m.price) > 0 ? `+${Number(m.price).toLocaleString('ru')} ${t(lang, 'currency')}` : t(lang, 'pos_free')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <button disabled={!canConfirm} onClick={() => onConfirm(buildModifiers())}
            className="w-full btn-primary py-3 font-bold disabled:opacity-40">
            {t(lang, 'pos_modifier_add')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Split bill modal ──────────────────────────────────────────────────────────
function SplitModal({ cart, total, onClose, lang }) {
  const [guests, setGuests] = useState(2)
  const share = total / guests
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs animate-scale-in p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-gray-800 flex items-center gap-2"><Users size={18} className="text-indigo-500" /> {t(lang, 'pos_split_title')}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="bg-indigo-50 rounded-xl px-4 py-3 text-center mb-5">
          <p className="text-xs text-indigo-500 mb-1">{t(lang, 'pos_split_total')}</p>
          <p className="text-2xl font-black text-indigo-700">{Number(total).toLocaleString('ru')} {t(lang, 'currency')}</p>
        </div>
        <div className="mb-5">
          <label className="label">{t(lang, 'pos_split_guests')}</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setGuests(Math.max(2, guests - 1))}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-xl font-bold">−</button>
            <span className="flex-1 text-center text-2xl font-black text-gray-800">{guests}</span>
            <button onClick={() => setGuests(Math.min(20, guests + 1))}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-xl font-bold">+</button>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl px-4 py-3 text-center mb-4">
          <p className="text-xs text-emerald-600 mb-1">{t(lang, 'pos_split_per_person')}</p>
          <p className="text-3xl font-black text-emerald-700">{Number(share).toLocaleString('ru', { maximumFractionDigits: 2 })} {t(lang, 'currency')}</p>
        </div>
        <div className="space-y-1">
          {Array.from({ length: guests }, (_, i) => (
            <div key={i} className="flex items-center justify-between text-sm text-gray-600 px-2 py-1">
              <span>{t(lang, 'pos_split_guest')} {i + 1}</span>
              <span className="font-bold">{Number(share).toLocaleString('ru', { maximumFractionDigits: 2 })} {t(lang, 'currency')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function POS() {
  const toast = useToast()
  const settings = useSettingsStore()
  const { language: lang = 'tg' } = settings
  const biz = BUSINESS_TYPES[settings.businessType] || BUSINESS_TYPES['bubbletea']
  const isFastFood = false

  const PAY = [
    { value: 'cash',      label: t(lang, 'pay_cash'), icon: Banknote,   active: 'bg-emerald-500' },
    { value: 'card_alif', label: t(lang, 'pay_alif'), icon: Smartphone, active: 'bg-blue-500' },
    { value: 'card_dc',   label: t(lang, 'pay_dc'),   icon: CreditCard, active: 'bg-violet-500' },
    { value: 'mixed',     label: t(lang, 'pay_mixed'),icon: Zap,        active: 'bg-orange-500' },
    { value: 'card',      label: t(lang, 'pay_card'), icon: CreditCard, active: 'bg-gray-600' },
  ]

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [payment, setPayment] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [colorPicker, setColorPicker] = useState(null)
  const [modifierTarget, setModifierTarget] = useState(null) // { product, color }
  const [splitOpen, setSplitOpen] = useState(false)
  const [discount, setDiscount] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [barcodeMode, setBarcodeMode] = useState(false)
  const [barcodeVal, setBarcodeVal] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const [numpadOpen, setNumpadOpen] = useState(false)
  const barcodeRef = useRef(null)
  const searchRef = useRef(null)
  const [qrOpen, setQrOpen] = useState(false)

  useEffect(() => {
    getMenuCategories().then((r) => setCategories(r.data))
  }, [])

  useEffect(() => {
    const params = {}
    if (activeCategory) params.category = activeCategory
    if (search) params.search = search
    getMenu(params).then((r) => setProducts(r.data.results || r.data))
  }, [activeCategory, search])

  useEffect(() => {
    if (barcodeMode && barcodeRef.current) barcodeRef.current.focus()
  }, [barcodeMode])

  const addToCart = (product, color = null, modifiers = []) => {
    const modKey = modifiers.map((m) => m.name).sort().join(',')
    setCart((prev) => {
      const key = `${product.id}_${color || ''}_${modKey}`
      const ex = prev.find((i) => i.key === key)
      if (ex) return prev.map((i) => i.key === key ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { key, product, color, qty: 1, customPrice: null, modifiers }]
    })
    setColorPicker(null)
    setModifierTarget(null)
  }

  const handleProduct = (p) => {
    if (p.modifier_groups?.length > 0) {
      if (p.color_stocks?.length > 0) {
        setColorPicker(colorPicker?.id === p.id ? null : p)
      } else {
        setModifierTarget({ product: p, color: null })
      }
    } else if (p.color_stocks?.length > 0) {
      setColorPicker(colorPicker?.id === p.id ? null : p)
    } else {
      addToCart(p)
    }
  }

  const handleColorSelect = (product, color) => {
    if (product.modifier_groups?.length > 0) {
      setModifierTarget({ product, color })
      setColorPicker(null)
    } else {
      addToCart(product, color)
    }
  }

  const handleBarcodeScan = useCallback((e) => {
    if (e.key === 'Enter') {
      const code = barcodeVal.trim()
      if (!code) return
      const found = products.find((p) => p.barcode === code || String(p.id) === code)
      if (found) {
        addToCart(found)
        toast(`${found.name} — ${t(lang, 'pos_scan_added')}`, 'success')
      } else {
        toast(`«${code}» ${t(lang, 'pos_scan_not_found')}`, 'warning')
      }
      setBarcodeVal('')
    }
  }, [barcodeVal, products, lang])

  const changeQty = (key, d) => {
    setCart((prev) => prev.map((i) => i.key === key ? { ...i, qty: i.qty + d } : i).filter((i) => i.qty > 0))
  }

  const discountNum = parseFloat(discount) || 0
  const subtotal = cart.reduce((s, i) => {
    const base = (i.customPrice ?? Number(i.product.price)) * i.qty
    const mods = (i.modifiers || []).reduce((a, m) => a + Number(m.price || 0), 0) * i.qty
    return s + base + mods
  }, 0)
  const total = Math.max(subtotal - discountNum, 0)

  const handleSale = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      const items = cart.map((i) => ({
        product_id: i.product.id,
        quantity: i.qty,
        color: i.color || '',
        modifiers: i.modifiers || [],
      }))
      const itemPrices = {}
      cart.forEach((i) => { if (i.customPrice !== null) itemPrices[`${i.product.id}::${i.color || ''}`] = i.customPrice })
      const { data } = await createSale({
        payment_method: payment,
        items,
        itemPrices,
        discount_amount: discountNum,
        table_number: tableNumber,
      })
      setSuccess(data)
      setCart([])
      setDiscount('')
      setTableNumber('')
      setCashReceived('')
      setNumpadOpen(false)
    } catch (e) { toast(e.response?.data?.detail || t(lang, 'pos_error'), 'error') }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-full">
        <Receipt sale={success} onClose={() => setSuccess(null)} onNext={() => setSuccess(null)} />
      </div>
    )
  }

  const gridCols = isFastFood
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

  return (
    <>
    {modifierTarget && (
      <ModifierModal
        product={modifierTarget.product}
        lang={lang}
        onConfirm={(mods) => addToCart(modifierTarget.product, modifierTarget.color, mods)}
        onClose={() => setModifierTarget(null)}
      />
    )}
    {splitOpen && <SplitModal cart={cart} total={total} lang={lang} onClose={() => setSplitOpen(false)} />}
    {qrOpen && payment === 'card_alif' && settings.qrAlif && (
      <QrModal label="Alif Mobi" qrSrc={settings.qrAlif} total={total} lang={lang} onClose={() => setQrOpen(false)} />
    )}
    {qrOpen && payment === 'card_dc' && settings.qrDcPay && (
      <QrModal label="DC Pay" qrSrc={settings.qrDcPay} total={total} lang={lang} onClose={() => setQrOpen(false)} />
    )}
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      {/* Left: products */}
      <div className="flex-1 flex flex-col min-w-0 gap-3">

        {/* FastFood: table selector at top */}
        {isFastFood && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 animate-fade-up">
            <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1"><Table2 size={12} /> {t(lang, 'pos_table_lbl')}</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTableNumber('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!tableNumber ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {t(lang, 'pos_takeout')}
              </button>
              {Array.from({ length: settings.tableCount }, (_, i) => String(i + 1)).map((n) => (
                <button
                  key={n}
                  onClick={() => setTableNumber(tableNumber === n ? '' : n)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${tableNumber === n ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search + barcode toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              className="input pl-10"
              placeholder={`${biz.posLabel} ${t(lang, 'search')}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setBarcodeMode((v) => !v)}
            title={t(lang, 'pos_scan_title')}
            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${barcodeMode ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
          >
            <ScanLine size={17} />
          </button>
        </div>

        {/* Barcode scanner input */}
        {barcodeMode && (
          <div className="flex gap-2 items-center bg-indigo-50 rounded-2xl px-4 py-2.5 border border-indigo-200 animate-scale-in">
            <ScanLine size={15} className="text-indigo-500 shrink-0" />
            <input
              ref={barcodeRef}
              className="flex-1 bg-transparent outline-none text-sm text-indigo-800 font-mono placeholder:text-indigo-300"
              placeholder={t(lang, 'pos_scan_ph')}
              value={barcodeVal}
              onChange={(e) => setBarcodeVal(e.target.value)}
              onKeyDown={handleBarcodeScan}
            />
            <button onClick={() => { setBarcodeMode(false); setBarcodeVal('') }}>
              <X size={14} className="text-indigo-400 hover:text-indigo-700" />
            </button>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !activeCategory ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t(lang, 'pos_all_cat')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === c.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto">
          <div className={`grid ${gridCols} gap-3 pb-2`}>
            {products.map((p) => (
              <div key={p.id} className="relative">
                <button
                  onClick={() => handleProduct(p)}
                  className="w-full bg-white border-2 border-gray-100 rounded-2xl overflow-hidden text-left hover:border-indigo-400 hover:shadow-xl transition-all duration-200 group active:scale-[0.97]"
                >
                  <div className="relative">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${isFastFood ? 'h-36' : 'h-28'}`} />
                    ) : (
                      <div className={`w-full flex items-center justify-center ${isFastFood ? 'h-36' : 'h-28'}`}
                        style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                        <span className="text-4xl opacity-60">{biz.icon}</span>
                      </div>
                    )}
                    {p.discount_price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{t(lang, 'pos_discount_badge')}</span>
                    )}
                    {!isFastFood && p.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">{t(lang, 'pos_out_of_stock')}</span>
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 group-hover:scale-100 ${isFastFood ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                      <Plus size={15} className="text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-2 min-h-[2rem]">{p.name}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`font-black ${isFastFood ? 'text-lg text-orange-500' : 'text-base text-indigo-600'}`}>
                          {fmt(p.discount_price || p.price)}
                        </p>
                        <p className="text-[10px] text-gray-400 -mt-0.5">{t(lang, 'som')}</p>
                      </div>
                      {p.discount_price && (
                        <p className="text-xs line-through text-gray-300 mb-3">{fmt(p.price)}</p>
                      )}
                      {!isFastFood && p.stock_quantity <= 5 && p.stock_quantity > 0 && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold mb-3">
                          {p.stock_quantity} {t(lang, 'pos_left')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {colorPicker?.id === p.id && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl p-3 animate-scale-in">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t(lang, 'pos_choose_color')}</p>
                    <div className="space-y-1.5">
                      {p.color_stocks.map((cs) => (
                        <button key={cs.color} onClick={() => handleColorSelect(p, cs.color)}
                          className="w-full text-xs px-3 py-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors text-left flex justify-between items-center">
                          <span className="font-medium">{cs.color_label}</span>
                          <span className="text-gray-400">{cs.quantity} {t(lang, 'warehouse_pieces')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!products.length && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                <Search size={36} className="mb-3 opacity-20" />
                <p>{t(lang, 'pos_product_not_found')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: cart */}
      <div className="w-80 xl:w-96 flex flex-col gap-3 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Cart header */}
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isFastFood ? 'bg-orange-50' : 'bg-indigo-50'}`}>
              <ShoppingCart size={16} className={isFastFood ? 'text-orange-500' : 'text-indigo-600'} />
            </div>
            <span className="font-bold text-gray-800">{t(lang, 'pos_cart_title')}</span>
            {tableNumber && (
              <span className="ml-1 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">{t(lang, 'pos_cart_table')} {tableNumber}</span>
            )}
            {cart.length > 0 && (
              <span className={`ml-auto text-white text-xs px-2 py-0.5 rounded-full font-bold ${isFastFood ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                <ShoppingCart size={40} className="mb-3 opacity-15" />
                <p className="text-sm font-medium">{t(lang, 'pos_cart_empty')}</p>
                <p className="text-xs mt-1 opacity-60">{t(lang, 'pos_cart_choose')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map((item) => (
                  <div key={item.key} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-gray-800 leading-tight">
                        {item.product.name}
                        {item.color && <span className="text-gray-400 font-normal"> · {item.color}</span>}
                      </p>
                      <button onClick={() => setCart((prev) => prev.filter((i) => i.key !== item.key))}
                        className="text-gray-300 hover:text-red-400 shrink-0 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {(item.modifiers || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {item.modifiers.map((m, mi) => (
                          <span key={mi} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                            {m.name}{Number(m.price) > 0 ? ` +${Number(m.price).toLocaleString('ru')}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(item.key, -1)}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all">
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                        <button onClick={() => changeQty(item.key, 1)}
                          className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center transition-all ${isFastFood ? 'hover:bg-orange-50 hover:text-orange-500' : 'hover:bg-indigo-50 hover:text-indigo-600'}`}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className={`text-sm font-bold ${isFastFood ? 'text-orange-500' : 'text-indigo-600'}`}>
                        {fmt((item.customPrice ?? Number(item.product.price)) * item.qty)} {t(lang, 'currency')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart footer */}
          <div className="border-t border-gray-100 p-3.5 space-y-3">
            {/* Payment methods */}
            <div className="grid grid-cols-4 gap-1.5">
              {PAY.slice(0, 4).map((m) => {
                const Icon = m.icon
                const isActive = payment === m.value
                const hasQr = (m.value === 'card_alif' && settings.qrAlif) ||
                              (m.value === 'card_dc'   && settings.qrDcPay)
                return (
                  <button key={m.value}
                    onClick={() => {
                      setPayment(m.value)
                      if (hasQr) setQrOpen(true)
                    }}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                      isActive ? `${m.active} border-transparent text-white shadow-md` : `bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100`
                    }`}>
                    <Icon size={16} />
                    <span className="text-[10px] font-bold leading-none">{m.label}</span>
                    {hasQr && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border border-white" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Table number (non-fastfood: text input) */}
            {!isFastFood && (
              <div className="flex items-center gap-2">
                <Table2 size={14} className="text-gray-400 shrink-0" />
                <input
                  className="input py-2 text-sm flex-1"
                  placeholder={t(lang, 'pos_table_ph')}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            )}

            {/* Discount */}
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-gray-400 shrink-0" />
              <input
                className="input py-2 text-sm flex-1"
                type="number"
                min="0"
                placeholder={t(lang, 'pos_discount_ph')}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            {/* Subtotal + discount */}
            {discountNum > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-gray-400">{t(lang, 'pos_discount_lbl')}</span>
                <span className="text-xs font-semibold text-red-500">−{fmt(discountNum)} {t(lang, 'currency')}</span>
              </div>
            )}

            {/* Cash received + numpad + change */}
            {payment === 'cash' && cart.length > 0 && (
              <div className="space-y-2">
                {/* Display + open numpad */}
                <button
                  type="button"
                  onClick={() => setNumpadOpen((v) => !v)}
                  className="w-full flex items-center gap-2 border-2 border-emerald-300 bg-emerald-50 hover:border-emerald-400 rounded-xl px-3.5 py-2.5 transition-all"
                >
                  <Banknote size={15} className="text-emerald-500 shrink-0" />
                  <span className={`flex-1 text-left text-sm font-semibold ${cashReceived ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {cashReceived ? `${cashReceived} ${t(lang, 'currency')}` : t(lang, 'pos_cash_received_ph')}
                  </span>
                  <span className="text-xs text-emerald-500 font-bold">{numpadOpen ? '▲' : '▼'}</span>
                </button>

                {/* Numpad */}
                {numpadOpen && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-lg animate-scale-in">
                    <div className="grid grid-cols-3 gap-1.5">
                      {['7','8','9','4','5','6','1','2','3'].map((k) => (
                        <button key={k} type="button"
                          onClick={() => setCashReceived((v) => v === '0' ? k : v + k)}
                          className="h-11 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 text-lg font-bold text-gray-700 transition-all border border-gray-100">
                          {k}
                        </button>
                      ))}
                      <button type="button"
                        onClick={() => setCashReceived((v) => (!v.includes('.') ? v + '.' : v))}
                        className="h-11 rounded-xl bg-gray-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-gray-500 transition-all border border-gray-100">
                        .
                      </button>
                      <button type="button"
                        onClick={() => setCashReceived((v) => v === '0' ? '0' : v + '0')}
                        className="h-11 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 text-lg font-bold text-gray-700 transition-all border border-gray-100">
                        0
                      </button>
                      <button type="button"
                        onClick={() => setCashReceived((v) => v.slice(0, -1))}
                        className="h-11 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 text-base font-bold text-red-500 transition-all border border-red-100">
                        ⌫
                      </button>
                    </div>
                    <button type="button"
                      onClick={() => setCashReceived('')}
                      className="mt-1.5 w-full h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-500 transition-all">
                      Тоза кардан
                    </button>
                  </div>
                )}

                {/* Change */}
                {cashReceived && parseFloat(cashReceived) >= total && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                    <span className="text-sm font-semibold text-emerald-700">{t(lang, 'pos_change_lbl')}</span>
                    <span className="text-xl font-black text-emerald-600">
                      {fmt(parseFloat(cashReceived) - total)} {t(lang, 'currency')}
                    </span>
                  </div>
                )}
                {cashReceived && parseFloat(cashReceived) < total && (
                  <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    <span className="text-sm font-semibold text-red-600">Кам аст</span>
                    <span className="text-xl font-black text-red-500">
                      −{fmt(total - parseFloat(cashReceived))} {t(lang, 'currency')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Split bill */}
            {cart.length > 0 && (
              <button onClick={() => setSplitOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium transition-all">
                <Users size={13} /> {t(lang, 'pos_split_btn')}
              </button>
            )}

            {/* Total */}
            <div className="rounded-2xl px-4 py-3.5 flex items-center justify-between"
              style={{ background: isFastFood ? 'linear-gradient(135deg,#fff7ed,#ffedd5)' : 'linear-gradient(135deg,#eef2ff,#e0e7ff)' }}>
              <div>
                <p className={`text-xs font-medium ${isFastFood ? 'text-orange-500' : 'text-indigo-400'}`}>{t(lang, 'pos_total_lbl')}</p>
                <p className={`text-2xl font-black tracking-tight ${isFastFood ? 'text-orange-600' : 'text-indigo-700'}`}>{fmt(total)}</p>
                <p className={`text-xs -mt-0.5 ${isFastFood ? 'text-orange-400' : 'text-indigo-400'}`}>{t(lang, 'som')}</p>
              </div>
              {discountNum > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">{t(lang, 'pos_discount_lbl')}</p>
                  <p className="text-sm font-bold text-red-500">−{fmt(discountNum)}</p>
                </div>
              )}
            </div>

            <button onClick={handleSale} disabled={loading || !cart.length}
              className="w-full py-4 text-base font-black flex items-center justify-center gap-2.5 rounded-2xl transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
              style={{
                background: cart.length
                  ? isFastFood
                    ? 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)'
                  : '#e2e8f0',
                boxShadow: cart.length ? (isFastFood ? '0 8px 24px rgba(249,115,22,0.4)' : '0 8px 24px rgba(99,102,241,0.4)') : 'none',
              }}>
              {loading ? <Loader size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {loading ? t(lang, 'pos_saving') : isFastFood ? t(lang, 'pos_pay_fastfood') : t(lang, 'pos_pay_pos')}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
