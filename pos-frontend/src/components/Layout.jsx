import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useAuthStore from '../store/useAuthStore'
import useSettingsStore from '../store/useSettingsStore'
import { logout } from '../api/auth'
import { getProducts } from '../api/products'
import { getCurrentShift, closeShift } from '../api/sales'
import { t } from '../lib/i18n'
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, Grid3X3,
  ClipboardList, Clock, Users, BarChart2, Settings, LogOut,
  AlertCircle, Timer, Menu, ChevronLeft, ChefHat, PackageCheck,
  LayoutGrid, SlidersHorizontal, ClipboardCheck, Store
} from 'lucide-react'

const BASE_NAV = [
  { to: '/',           icon: LayoutDashboard,   lk: 'nav_dashboard',  roles: ['admin','manager','cashier','chef','assembler'], color: 'bg-blue-500' },
  { to: '/pos',        icon: ShoppingCart,      lk: 'nav_pos',        roles: ['admin','manager','cashier'],                    color: 'bg-emerald-500' },
  { to: '/table-map',  icon: LayoutGrid,        lk: 'nav_table_map',  roles: ['admin','manager','cashier'],                    color: 'bg-sky-500',    fastfoodOnly: true },
  { to: '/kitchen',    icon: ChefHat,           lk: 'nav_kitchen',    roles: ['admin','manager','chef'],                       color: 'bg-orange-500', fastfoodOnly: true },
  { to: '/assembler',  icon: PackageCheck,      lk: 'nav_assembler',  roles: ['admin','manager','assembler'],                  color: 'bg-teal-500',   fastfoodOnly: true },
  { to: '/products',   icon: Package,           lk: 'nav_products',   roles: ['admin','manager'],                              color: 'bg-orange-500' },
  { to: '/modifiers',  icon: SlidersHorizontal, lk: 'nav_modifiers',  roles: ['admin','manager'],                              color: 'bg-purple-500', fastfoodOnly: true },
  { to: '/warehouse',  icon: Warehouse,         lk: 'nav_warehouse',  roles: ['admin','manager'],                              color: 'bg-teal-500',   stockAlert: true },
  { to: '/stocktake',  icon: ClipboardCheck,    lk: 'nav_stocktake',  roles: ['admin','manager'],                              color: 'bg-violet-500' },
  { to: '/categories', icon: Grid3X3,           lk: 'nav_categories', roles: ['admin','manager'],                              color: 'bg-violet-500' },
  { to: '/orders',     icon: ClipboardList,     lk: 'nav_orders',     roles: ['admin','manager','cashier','chef','assembler'],  color: 'bg-amber-500' },
  { to: '/shifts',     icon: Clock,             lk: 'nav_shifts',     roles: ['admin','manager','cashier'],                    color: 'bg-indigo-500' },
  { to: '/workers',    icon: Users,             lk: 'nav_workers',    roles: ['admin'],                                        color: 'bg-rose-500' },
  { to: '/reports',    icon: BarChart2,         lk: 'nav_reports',    roles: ['admin','manager'],                              color: 'bg-cyan-500' },
  { to: '/settings',   icon: Settings,          lk: 'nav_settings',   roles: ['admin','manager','cashier'],                    color: 'bg-slate-500' },
]

function useShiftTimer(shift) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!shift) { setElapsed(''); return }
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(shift.opened_at).getTime()) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      setElapsed(h > 0 ? `${h}с ${m}д` : `${m}д`)
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [shift])
  return elapsed
}

export default function Layout({ children }) {
  const { user, logout: authLogout } = useAuthStore()
  const settings = useSettingsStore()
  const lang = settings.language || 'tg'
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentShift, setCurrentShift] = useState(null)
  const [closingShift, setClosingShift] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)
  const elapsed = useShiftTimer(currentShift)

  useEffect(() => {
    getCurrentShift().then((r) => setCurrentShift(r.data)).catch(() => setCurrentShift(null))
  }, [])

  useEffect(() => {
    getProducts({ page_size: 500 }).then((r) => {
      const prods = r.data.results || r.data
      const low = prods.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= settings.lowStockThreshold).length
      const empty = prods.filter((p) => p.stock_quantity === 0).length
      setLowStockCount(low + empty)
    }).catch(() => {})
  }, [settings.lowStockThreshold])

  const handleLogout = async () => {
    try { await logout(localStorage.getItem('refresh')) } catch {}
    authLogout()
    navigate('/login')
  }

  const handleCloseShift = async () => {
    if (!confirm(t(lang, 'shift_confirm'))) return
    setClosingShift(true)
    try {
      await closeShift({})
      setCurrentShift(null)
      window.dispatchEvent(new Event('shift-changed'))
    } catch (e) { alert(e.response?.data?.detail || t(lang, 'error')) }
    finally { setClosingShift(false) }
  }

  const isFastFood = settings.businessType === 'fastfood'
  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'

  const visibleNav = BASE_NAV.filter((n) => {
    if (!n.roles.includes(user?.role)) return false
    if (n.fastfoodOnly && !isFastFood) return false
    return true
  })

  const logoSrc = settings.logoBase64

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-[220px] flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0
      `}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="logo"
              className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-lg ring-1 ring-white/20"
            />
          ) : (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              isFastFood
                ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30'
                : 'bg-gradient-to-br from-indigo-500 to-blue-500 shadow-indigo-500/30'
            }`}>
              {isFastFood ? <ChefHat size={17} className="text-white" /> : <Store size={17} className="text-white" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-white leading-tight truncate">
              {settings.storeName}
            </p>
            <p className="text-[10px] text-indigo-300 uppercase tracking-widest mt-0.5">POS система</p>
          </div>
          <button className="lg:hidden text-white/40 hover:text-white/80 transition-colors" onClick={() => setSidebarOpen(false)}>
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
          {visibleNav.map(({ to, icon: Icon, lk, color, stockAlert }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/50 hover:bg-white/8 hover:text-white/90'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${isActive ? color + ' shadow-md' : 'bg-white/8 group-hover:bg-white/15'}`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <span className="truncate flex-1">{t(lang, lk)}</span>
                  {stockAlert && lowStockCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center">
                      {lowStockCount}
                    </span>
                  )}
                  {isActive && !stockAlert && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-2.5 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || user?.username}</p>
              <p className="text-xs text-indigo-300">{t(lang, `role_${user?.role}`) || user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/8 hover:text-white/80 transition-all duration-200"
          >
            <LogOut size={15} />
            {lang === 'ru' ? 'Выйти' : 'Баромадан'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white/80 backdrop-blur border-b border-gray-200/70 flex items-center px-4 gap-3 shrink-0 shadow-sm">
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {currentShift ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-700 font-semibold hidden sm:inline">{t(lang, 'shift_open')}</span>
              <span className="text-gray-300">·</span>
              <Timer size={13} className="text-gray-400" />
              <span className="text-gray-600 font-mono text-xs font-bold">{elapsed}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500 text-xs">{currentShift.opened_by_name || ''}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              <span className="hidden sm:inline text-xs">{t(lang, 'shift_closed')}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {lowStockCount > 0 && (
              <NavLink to="/warehouse" className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-semibold transition-all">
                <AlertCircle size={13} />
                {lowStockCount} {t(lang, 'low_stock')}
              </NavLink>
            )}
            {currentShift && (
              <button
                onClick={handleCloseShift}
                disabled={closingShift}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-xs font-semibold transition-all"
              >
                <AlertCircle size={13} />
                {t(lang, 'shift_close_btn')}
              </button>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
