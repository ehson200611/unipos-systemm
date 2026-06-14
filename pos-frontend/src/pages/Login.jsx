import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import useAuthStore from '../store/useAuthStore'
import useSettingsStore from '../store/useSettingsStore'
import { Eye, EyeOff, AlertCircle, Zap } from 'lucide-react'
import { t } from '../lib/i18n'

export default function Login() {
  const navigate = useNavigate()
  const setLogin = useAuthStore((s) => s.login)
  const { language: lang = 'tg' } = useSettingsStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await apiLogin(form)
      setLogin({ access: data.access, refresh: data.refresh }, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || t(lang, 'login_error'))
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: '⚡', key: 'login_feature_1' },
    { icon: '📊', key: 'login_feature_2' },
    { icon: '🍽️', key: 'login_feature_3' },
    { icon: '📦', key: 'login_feature_4' },
    { icon: '👥', key: 'login_feature_5' },
  ]

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#0a0a0f' }}>

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 40%, #0c1a3a 100%)' }}>

        {/* Animated orbs */}
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', top: '-100px', right: '-100px' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', bottom: '-80px', left: '-80px' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}>
            <Zap size={40} className="text-white" />
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">UNIPOS</h1>
          <p className="text-indigo-300 text-lg font-medium mb-12">{t(lang, 'login_system_sub')}</p>

          {/* Feature list */}
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium">{t(lang, f.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #0a0a0f 100%)' }}>

        <div className="absolute top-4 right-4 text-indigo-500/40 text-xs font-mono">v2.0</div>

        <div
          className="w-full max-w-md"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease' }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
              <Zap size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">UNIPOS</h1>
            <p className="text-indigo-400 text-sm mt-1">{t(lang, 'login_system_sub')}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">{t(lang, 'login_welcome')}</h2>
            <p className="text-slate-400 text-sm">{t(lang, 'login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-sm flex items-center gap-2.5"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                {t(lang, 'login_username_lbl')}
              </label>
              <input
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.target.style.border = '1px solid rgba(99,102,241,0.6)'; e.target.style.background = 'rgba(99,102,241,0.08)' }}
                onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                {t(lang, 'login_password_lbl')}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid rgba(99,102,241,0.6)'; e.target.style.background = 'rgba(99,102,241,0.08)' }}
                  onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white text-base mt-2 relative overflow-hidden transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                boxShadow: loading ? 'none' : '0 8px 32px rgba(99,102,241,0.35)',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {loading ? t(lang, 'login_loading') : t(lang, 'login_submit')}
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-xs">{t(lang, 'login_system_ok')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
