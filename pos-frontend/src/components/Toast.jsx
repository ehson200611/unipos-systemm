import { useState, createContext, useContext, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = ++_id
    setToasts(p => [...p, { id, message, type, visible: false }])
    setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, visible: true } : t)), 10)
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, visible: false } : t))
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 350)
    }, 3500)
  }, [])

  const close = (id) => {
    setToasts(p => p.map(t => t.id === id ? { ...t, visible: false } : t))
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 350)
  }

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onClose={() => close(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  )
}

const CFG = {
  success: { Icon: CheckCircle, border: 'border-l-emerald-500', icon: 'text-emerald-500', title: 'Муваффақият' },
  error:   { Icon: XCircle,     border: 'border-l-red-500',     icon: 'text-red-500',     title: 'Хатогӣ' },
  warning: { Icon: AlertTriangle, border: 'border-l-amber-500', icon: 'text-amber-500',   title: 'Огоҳӣ' },
  info:    { Icon: Info,        border: 'border-l-blue-500',    icon: 'text-blue-500',    title: 'Маълумот' },
}

function ToastItem({ toast, onClose }) {
  const c = CFG[toast.type] || CFG.success
  const { Icon } = c
  return (
    <div className={`
      pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl
      bg-white border border-gray-100 border-l-4 ${c.border}
      transition-all duration-300 ease-out
      ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <Icon size={19} className={`shrink-0 mt-0.5 ${c.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{c.title}</p>
        <p className="text-sm text-gray-700 leading-snug">{toast.message}</p>
      </div>
      <button onClick={onClose} className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5">
        <X size={14} />
      </button>
    </div>
  )
}
