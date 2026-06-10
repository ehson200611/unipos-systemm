import { useEffect, useRef, useState } from 'react'
import { getMe, updateMe } from '../api/auth'
import { getSystemSettings, saveSystemSettings, testTelegram } from '../api/systemSettings'
import useAuthStore from '../store/useAuthStore'
import useSettingsStore, { BUSINESS_TYPES } from '../store/useSettingsStore'
import { t } from '../lib/i18n'
import {
  User, Store, Save, Loader, Building2, CheckCircle2,
  AlertTriangle, Settings2, ShieldCheck, Pencil, Phone,
  Mail, Hash, Table2, Bell, ImagePlus, Trash2, Globe, Check,
  Send, Plus, X, DollarSign, BotMessageSquare, QrCode, Upload,
} from 'lucide-react'
import { useToast } from '../components/Toast'

const TABS = [
  { key: 'business', icon: Building2,      label_tg: 'Навъи бизнес', label_ru: 'Тип бизнеса' },
  { key: 'store',    icon: Store,           label_tg: 'Мағоза',       label_ru: 'Магазин' },
  { key: 'profile',  icon: User,            label_tg: 'Профил',       label_ru: 'Профиль' },
  { key: 'salary',   icon: DollarSign,      label_tg: 'Харҷот',       label_ru: 'Расходы' },
  { key: 'payment',  icon: QrCode,          label_tg: 'Пардохт',      label_ru: 'Оплата' },
  { key: 'telegram', icon: BotMessageSquare,label_tg: 'Telegram',     label_ru: 'Telegram' },
  { key: 'display',  icon: Globe,           label_tg: 'Намуд',        label_ru: 'Вид' },
]

const ROLE_COLORS = {
  admin:     'from-red-500 to-rose-600',
  manager:   'from-violet-500 to-purple-600',
  cashier:   'from-blue-500 to-indigo-600',
  chef:      'from-orange-500 to-amber-500',
  assembler: 'from-teal-500 to-emerald-500',
}
const ROLE_LABELS_TG = { admin: 'Администратор', manager: 'Мудир', cashier: 'Сандуқдор', chef: 'Ошпаз', assembler: 'Ҷамъкунанда' }
const ROLE_LABELS_RU = { admin: 'Администратор', manager: 'Менеджер', cashier: 'Кассир', chef: 'Повар', assembler: 'Сборщик' }

const LANGS = [
  { code: 'tg', flag: '🇹🇯', name: 'Тоҷикӣ',  name_ru: 'Таджикский' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский',  name_ru: 'Русский' },
]

export default function Settings() {
  const toast = useToast()
  const { user, setUser } = useAuthStore()
  const settings = useSettingsStore()
  const lang = settings.language || 'tg'
  const T = (key) => t(lang, key)

  const [tab, setTab] = useState('business')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Store fields
  const [storeName, setStoreName]   = useState(settings.storeName)
  const [tableCount, setTableCount] = useState(settings.tableCount)
  const [threshold, setThreshold]   = useState(settings.lowStockThreshold)
  const [currency, setCurrency]     = useState(settings.currency || 'сомони')
  const [taxPercent, setTaxPercent] = useState(settings.taxPercent ?? 0)

  const logoRef = useRef(null)

  // ── Salary state ──────────────────────────────────────────────
  const [employees, setEmployees] = useState(() => settings.employees || [])
  const [monthlyRevTarget, setMonthlyRevTarget] = useState(() => settings.monthlyRevTarget || 0)
  const [empName, setEmpName]     = useState('')
  const [empSalary, setEmpSalary] = useState('')

  const totalSalaries = employees.reduce((s, e) => s + Number(e.salary || 0), 0)
  const dailyTarget   = monthlyRevTarget > 0 ? Math.ceil(monthlyRevTarget / 30) : 0

  const addEmployee = () => {
    if (!empName.trim() || !empSalary) return
    const next = [...employees, { name: empName.trim(), salary: Number(empSalary) }]
    setEmployees(next)
    setEmpName('')
    setEmpSalary('')
  }
  const removeEmployee = (i) => setEmployees(employees.filter((_, idx) => idx !== i))

  const handleSaveSalary = () => {
    settings.update({ employees, monthlyRevTarget: Number(monthlyRevTarget) })
    toast(lang === 'ru' ? 'Сохранено' : 'Нигоҳ шуд', 'success')
  }

  // ── Telegram state ────────────────────────────────────────────
  const [tgToken, setTgToken]     = useState('')
  const [tgChatId, setTgChatId]   = useState('')
  const [tgEnabled, setTgEnabled] = useState(false)
  const [tgLoading, setTgLoading] = useState(true)
  const [tgSaving, setTgSaving]   = useState(false)
  const [tgTesting, setTgTesting] = useState(false)

  useEffect(() => {
    getMe()
      .then((r) => { setProfile(r.data); setUser(r.data) })
      .finally(() => setLoading(false))
    getSystemSettings()
      .then((r) => {
        setTgToken(r.data.telegram_bot_token || '')
        setTgChatId(r.data.telegram_chat_id || '')
        setTgEnabled(r.data.telegram_enabled || false)
      })
      .catch(() => {})
      .finally(() => setTgLoading(false))
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await updateMe({
        first_name: profile.first_name,
        last_name:  profile.last_name,
        email:      profile.email,
        phone:      profile.phone,
      })
      setUser(data)
      toast(T('success'), 'success')
    } catch { toast(T('error'), 'error') }
    finally { setSaving(false) }
  }

  const handleSaveStore = () => {
    settings.update({
      storeName,
      tableCount:        Number(tableCount),
      lowStockThreshold: Number(threshold),
      currency,
      taxPercent:        Number(taxPercent),
    })
    toast(T('success'), 'success')
  }

  const handleSaveTelegram = async () => {
    setTgSaving(true)
    try {
      await saveSystemSettings({
        telegram_bot_token: tgToken,
        telegram_chat_id:   tgChatId,
        telegram_enabled:   tgEnabled,
      })
      toast(lang === 'ru' ? 'Настройки Telegram сохранены' : 'Танзимоти Telegram нигоҳ шуд', 'success')
    } catch { toast(T('error'), 'error') }
    finally { setTgSaving(false) }
  }

  const handleTestTelegram = async () => {
    setTgTesting(true)
    try {
      await testTelegram()
      toast(lang === 'ru' ? 'Тестовое сообщение отправлено!' : 'Паёми санҷишӣ фиристода шуд!', 'success')
    } catch (err) {
      const msg = err?.response?.data?.detail || (lang === 'ru' ? 'Ошибка отправки' : 'Хатои ирсол')
      toast(msg, 'error')
    } finally { setTgTesting(false) }
  }

  // Logo upload → base64
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast(lang === 'ru' ? 'Файл слишком большой (макс. 2 МБ)' : 'Файл хеле калон аст (ҳадди аксар 2 МБ)', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      settings.update({ logoBase64: ev.target.result })
      toast(lang === 'ru' ? 'Логотип сохранён' : 'Лого сабт шуд', 'success')
    }
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = () => {
    settings.update({ logoBase64: '' })
    if (logoRef.current) logoRef.current.value = ''
    toast(lang === 'ru' ? 'Логотип удалён' : 'Лого хориҷ шуд', 'success')
  }

  const initials = (
    (profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')
  ).toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?'

  const roleColor  = ROLE_COLORS[profile?.role] || 'from-gray-400 to-gray-500'
  const roleLabel  = lang === 'ru' ? ROLE_LABELS_RU[profile?.role] : ROLE_LABELS_TG[profile?.role]
  const activeBiz  = BUSINESS_TYPES[settings.businessType]

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div className="animate-fade-up flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
          <Settings2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {lang === 'ru' ? 'Настройки' : 'Танзимот'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === 'ru' ? 'Магазин, профиль и внешний вид' : 'Мағоза, профил ва намуди системаро идора кунед'}
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 bg-gray-100/80 p-1.5 rounded-2xl animate-fade-up" style={{ animationDelay: '40ms' }}>
        {TABS.map(({ key, icon: Icon, label_tg, label_ru }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{lang === 'ru' ? label_ru : label_tg}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: Навъи бизнес ──────────────────────────────────── */}
      {tab === 'business' && (
        <div className="space-y-4 animate-fade-up">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-800">{T('set_business_title')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{T('set_business_sub')}</p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(BUSINESS_TYPES).map(([key, biz]) => {
                const isActive = settings.businessType === key
                const label = lang === 'ru' ? biz.label_ru : biz.label
                const desc  = lang === 'ru' ? biz.desc_ru  : biz.desc
                return (
                  <button
                    key={key}
                    onClick={() => settings.update({ businessType: key })}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 group ${
                      isActive
                        ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-lg shadow-indigo-100'
                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 size={18} className="text-indigo-500" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${biz.color} flex items-center justify-center text-2xl mb-4 shadow-md transition-transform group-hover:scale-105`}>
                      {biz.icon}
                    </div>
                    <p className={`font-bold text-sm leading-tight mb-1 ${isActive ? 'text-indigo-800' : 'text-gray-800'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                    {biz.tableMode && (
                      <div className="mt-3 inline-flex items-center gap-1 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                        <Table2 size={9} /> {T('biz_table_mode')}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={`rounded-2xl p-4 bg-gradient-to-r ${activeBiz.color} text-white shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                {activeBiz.icon}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {T('biz_active')}: {lang === 'ru' ? activeBiz.label_ru : activeBiz.label}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  {lang === 'ru' ? activeBiz.desc_ru : activeBiz.desc}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 bg-white/20 rounded-xl px-3 py-1.5 text-xs font-bold">
                <ShieldCheck size={13} />
                {lang === 'ru' ? 'Активно' : 'Фаъол'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Мағоза ──────────────────────────────────────── */}
      {tab === 'store' && (
        <div className="space-y-4 animate-fade-up">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-800">{T('set_store_title')}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'ru' ? 'Отображается в чеке и интерфейсе' : 'Дар чек ва интерфейс нишон дода мешавад'}
              </p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="label flex items-center gap-1.5 mb-1.5">
                  <Store size={13} className="text-gray-400" /> {T('set_store_name')}
                </label>
                <input
                  className="input"
                  placeholder={lang === 'ru' ? 'Например: Кафе Весна' : 'Масалан: Кафе Баҳор'}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1.5 mb-1.5">
                    <Table2 size={13} className="text-gray-400" /> {T('set_tables')}
                  </label>
                  <input
                    className={`input ${!activeBiz.tableMode ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                    type="number" min="1" max="99"
                    value={tableCount}
                    onChange={(e) => setTableCount(e.target.value)}
                    disabled={!activeBiz.tableMode}
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    {activeBiz.tableMode
                      ? <span className="text-emerald-600">✓ {T('biz_table_mode')}</span>
                      : T('biz_tables_only')
                    }
                  </p>
                </div>
                <div>
                  <label className="label flex items-center gap-1.5 mb-1.5">
                    <Bell size={13} className="text-amber-500" /> {T('set_threshold')}
                  </label>
                  <input
                    className="input"
                    type="number" min="1" max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    <AlertTriangle size={10} className="inline mr-1 text-amber-400" />
                    {T('biz_threshold_hint')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1.5 mb-1.5">
                    <Hash size={13} className="text-gray-400" /> {T('set_currency')}
                  </label>
                  <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="сомони">Сомонӣ (TJS)</option>
                    <option value="USD">Доллар (USD)</option>
                    <option value="RUB">Рубл (RUB)</option>
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-1.5 mb-1.5">
                    <Hash size={13} className="text-gray-400" /> {T('set_tax')}
                  </label>
                  <input
                    className="input"
                    type="number" min="0" max="30" step="0.5"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">{T('biz_tax_hint')}</p>
                </div>
              </div>
              <div className="pt-1">
                <button
                  onClick={handleSaveStore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200 active:scale-[0.98]"
                >
                  <Save size={15} /> {T('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Профил ──────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="space-y-4 animate-fade-up">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              <div className={`rounded-2xl bg-gradient-to-br ${roleColor} p-6 shadow-xl`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-black text-white shadow-inner">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-lg leading-tight truncate">
                      {profile?.full_name || profile?.username}
                    </p>
                    <p className="text-white/70 text-sm mt-0.5">{roleLabel || profile?.role}</p>
                    <p className="text-white/50 text-xs mt-1 font-mono">@{profile?.username}</p>
                  </div>
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-white" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { val: profile?.email || '—', hint: lang === 'ru' ? 'Эл. почта' : 'Почта' },
                    { val: profile?.phone || '—', hint: lang === 'ru' ? 'Телефон' : 'Телефон' },
                    { val: `#${profile?.id}`,     hint: 'ID' },
                  ].map(({ val, hint }) => (
                    <div key={hint} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                      <p className="text-white/50 text-[10px] mb-0.5 uppercase tracking-wide">{hint}</p>
                      <p className="text-white text-xs font-semibold truncate">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                  <Pencil size={15} className="text-indigo-400" />
                  <p className="font-bold text-gray-800">{T('set_profile_title')}</p>
                </div>
                <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">{T('profile_name')}</label>
                      <input className="input" value={profile?.first_name || ''}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">{T('profile_surname')}</label>
                      <input className="input" value={profile?.last_name || ''}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Mail size={12} className="text-gray-400" /> {T('profile_email')}
                    </label>
                    <input className="input" type="email" value={profile?.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Phone size={12} className="text-gray-400" /> {T('profile_phone')}
                    </label>
                    <input className="input" placeholder="+992 900 000 000" value={profile?.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-500">{T('profile_login')}</span>
                    </div>
                    <span className="font-bold text-gray-700 font-mono text-sm">{profile?.username}</span>
                  </div>
                  <div className="pt-1">
                    <button
                      type="submit" disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200 disabled:opacity-60 active:scale-[0.98]"
                    >
                      {saving
                        ? <><Loader size={15} className="animate-spin" /> {T('saving')}</>
                        : <><Save size={15} /> {T('save')}</>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Харҷот (Маош) ───────────────────────────────── */}
      {tab === 'salary' && (
        <div className="space-y-4 animate-fade-up">

          {/* Summary card */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: lang === 'ru' ? 'Итого зарплата' : 'Маоши умумӣ',
                value: totalSalaries.toLocaleString(),
                unit:  lang === 'ru' ? 'сом/мес' : 'сом/моҳ',
                color: 'from-violet-500 to-purple-600',
              },
              {
                label: lang === 'ru' ? 'Налог' : 'Андоз',
                value: Math.round(totalSalaries * (Number(settings.taxPercent) || 0) / 100).toLocaleString(),
                unit:  lang === 'ru' ? 'сом/мес' : 'сом/моҳ',
                color: 'from-red-400 to-rose-500',
              },
              {
                label: lang === 'ru' ? 'Цель (день)' : 'Ҳадаф (рӯзона)',
                value: dailyTarget.toLocaleString(),
                unit:  lang === 'ru' ? 'сом/день' : 'сом/рӯз',
                color: 'from-emerald-500 to-teal-600',
              },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className={`rounded-2xl bg-gradient-to-br ${color} p-4 text-white shadow-lg`}>
                <p className="text-white/70 text-xs font-medium">{label}</p>
                <p className="text-2xl font-black mt-1">{value}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{unit}</p>
              </div>
            ))}
          </div>

          {/* Revenue target */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-800">
                {lang === 'ru' ? 'Цель по выручке (месяц)' : 'Ҳадафи даромад (моҳона)'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'ru' ? 'Используется для расчёта дневного плана' : 'Барои ҳисоби нақшаи рӯзона истифода мешавад'}
              </p>
            </div>
            <div className="p-6">
              <input
                className="input"
                type="number" min="0"
                placeholder={lang === 'ru' ? 'например: 50000' : 'масалан: 50000'}
                value={monthlyRevTarget || ''}
                onChange={(e) => setMonthlyRevTarget(e.target.value)}
              />
              {dailyTarget > 0 && (
                <p className="text-xs text-emerald-600 mt-2 font-semibold">
                  ≈ {dailyTarget.toLocaleString()} {lang === 'ru' ? 'сом/день' : 'сом/рӯз'}
                </p>
              )}
            </div>
          </div>

          {/* Employee list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-800">
                {lang === 'ru' ? 'Список сотрудников' : 'Рӯйхати кормандон'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'ru' ? 'Имя и месячный оклад' : 'Ном ва маоши моҳона'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Add form */}
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={lang === 'ru' ? 'Имя сотрудника' : 'Номи корманд'}
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addEmployee()}
                />
                <input
                  className="input w-32"
                  type="number" min="0"
                  placeholder={lang === 'ru' ? 'Оклад' : 'Маош'}
                  value={empSalary}
                  onChange={(e) => setEmpSalary(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addEmployee()}
                />
                <button
                  onClick={addEmployee}
                  disabled={!empName.trim() || !empSalary}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* List */}
              {employees.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {lang === 'ru' ? 'Нет сотрудников' : 'Кормандон нестанд'}
                </div>
              ) : (
                <div className="space-y-2">
                  {employees.map((emp, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {emp.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{emp.name}</p>
                          <p className="text-xs text-gray-400">{Number(emp.salary).toLocaleString()} {lang === 'ru' ? 'сом/мес' : 'сом/моҳ'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeEmployee(i)}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                {employees.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {lang === 'ru' ? 'Итого' : 'Ҷамъ'}: <span className="font-bold text-gray-700">{totalSalaries.toLocaleString()}</span> {lang === 'ru' ? 'сом' : 'сомонӣ'}
                  </p>
                )}
                <button
                  onClick={handleSaveSalary}
                  className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200 active:scale-[0.98]"
                >
                  <Save size={15} /> {T('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Telegram ────────────────────────────────────── */}
      {tab === 'telegram' && (
        <div className="space-y-4 animate-fade-up">
          {tgLoading ? (
            <div className="flex justify-center py-16">
              <Loader size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              {/* Info banner */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BotMessageSquare size={20} />
                  </div>
                  <div>
                    <p className="font-bold">Telegram Bot</p>
                    <p className="text-white/70 text-xs">
                      {lang === 'ru' ? 'Уведомления о продажах в реальном времени' : 'Огоҳиҳои фурӯш дар вақти воқеӣ'}
                    </p>
                  </div>
                  <div className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold ${tgEnabled ? 'bg-emerald-400/30 text-emerald-100' : 'bg-white/20 text-white/60'}`}>
                    {tgEnabled ? (lang === 'ru' ? '● Включён' : '● Фаъол') : (lang === 'ru' ? '○ Выключен' : '○ Ғайрифаъол')}
                  </div>
                </div>
                <p className="text-white/80 text-xs leading-relaxed">
                  {lang === 'ru'
                    ? '1. Создайте бота через @BotFather → скопируйте токен\n2. Добавьте бота в группу → скопируйте Chat ID\n3. Включите уведомления и нажмите «Сохранить»'
                    : '1. Тавассути @BotFather бот созед → токенро нусха гиред\n2. Ботро ба гурӯҳ илова кунед → Chat ID-ро нусха гиред\n3. Огоҳиҳоро фаъол кунед ва «Нигоҳ кунед» -ро пахш кунед'}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <p className="font-bold text-gray-800">
                    {lang === 'ru' ? 'Настройки бота' : 'Танзимоти бот'}
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="label mb-1.5 flex items-center gap-1.5">
                      <Hash size={13} className="text-gray-400" /> Bot Token
                    </label>
                    <input
                      className="input font-mono text-sm"
                      placeholder="123456789:AAGcwfh07upeCf6NozP2QcAL_Ue9UCzI-zQ"
                      value={tgToken}
                      onChange={(e) => setTgToken(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      {lang === 'ru' ? 'Получите у @BotFather' : 'Аз @BotFather гиред'}
                    </p>
                  </div>

                  <div>
                    <label className="label mb-1.5 flex items-center gap-1.5">
                      <Hash size={13} className="text-gray-400" /> Chat ID
                    </label>
                    <input
                      className="input font-mono text-sm"
                      placeholder="-1001234567890"
                      value={tgChatId}
                      onChange={(e) => setTgChatId(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      {lang === 'ru'
                        ? 'ID личного чата или группы (для группы начинается с -100)'
                        : 'ID чати шахсӣ ё гурӯҳ (барои гурӯҳ аз -100 оғоз мешавад)'}
                    </p>
                  </div>

                  {/* Enable toggle */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {lang === 'ru' ? 'Уведомления о продажах' : 'Огоҳии фурӯш'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {lang === 'ru' ? 'Отправлять сообщение при каждой продаже' : 'Ҳангоми ҳар фурӯш паём фиристода мешавад'}
                      </p>
                    </div>
                    <button
                      onClick={() => setTgEnabled(!tgEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${tgEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${tgEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSaveTelegram}
                      disabled={tgSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200 disabled:opacity-60 active:scale-[0.98]"
                    >
                      {tgSaving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
                      {T('save')}
                    </button>
                    <button
                      onClick={handleTestTelegram}
                      disabled={tgTesting || !tgToken || !tgChatId}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {tgTesting ? <Loader size={15} className="animate-spin" /> : <Send size={14} />}
                      {lang === 'ru' ? 'Тест' : 'Санҷиш'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Пардохт (QR) ────────────────────────────────── */}
      {tab === 'payment' && (
        <div className="space-y-4 animate-fade-up">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <QrCode size={16} className="text-indigo-400" />
              <div>
                <p className="font-bold text-gray-800">
                  {lang === 'ru' ? 'QR-коды оплаты' : 'QR-кодҳои пардохт'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lang === 'ru'
                    ? 'Отображается клиенту при выборе Alif или DC Pay'
                    : 'Вақте кассир «Alif» ё «DC Pay» интихоб мекунад, ин акс ба клиент нишон дода мешавад'}
                </p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { key: 'qrAlif',  label: 'QR — Alif Mobi', color: 'indigo' },
                { key: 'qrDcPay', label: 'QR — DC Pay',    color: 'violet' },
              ].map(({ key, label, color }) => {
                const val = settings[key] || ''
                const inputId = `qr-upload-${key}`
                return (
                  <div key={key} className="space-y-3">
                    <p className="font-semibold text-gray-700 text-sm">{label}</p>

                    {val ? (
                      /* Preview */
                      <div className="flex flex-col items-center gap-3">
                        <div className={`relative border-2 border-${color}-200 rounded-2xl p-3 bg-${color}-50`}>
                          <img src={val} alt={label} className="w-40 h-40 object-contain rounded-xl" />
                          <div className={`absolute -top-2 -right-2 w-6 h-6 bg-${color}-500 rounded-full flex items-center justify-center shadow`}>
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <label htmlFor={inputId}
                            className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-${color}-50 hover:bg-${color}-100 text-${color}-600 rounded-xl text-xs font-semibold transition-colors`}>
                            <Upload size={12} /> {lang === 'ru' ? 'Заменить' : 'Иваз кунед'}
                          </label>
                          <button
                            onClick={() => { settings.update({ [key]: '' }); toast(lang === 'ru' ? 'Удалено' : 'Хориҷ шуд', 'success') }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-semibold transition-colors">
                            <Trash2 size={12} /> {lang === 'ru' ? 'Удалить' : 'Хориҷ'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Upload zone */
                      <label htmlFor={inputId}
                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-${color}-300 hover:bg-${color}-50/30 transition-all group`}>
                        <div className={`w-16 h-16 bg-gray-100 group-hover:bg-${color}-100 rounded-2xl flex items-center justify-center transition-colors`}>
                          <QrCode size={28} className={`text-gray-300 group-hover:text-${color}-400 transition-colors`} />
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-semibold text-gray-500 group-hover:text-${color}-600 transition-colors`}>
                            {lang === 'ru' ? 'Загрузить QR-код' : 'QR-акс бор кунед'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG — {lang === 'ru' ? 'макс. 2 МБ' : 'ҳадди аксар 2 МБ'}</p>
                        </div>
                      </label>
                    )}

                    <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 2 * 1024 * 1024) { toast(lang === 'ru' ? 'Файл слишком большой' : 'Файл хеле калон аст', 'error'); return }
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          settings.update({ [key]: ev.target.result })
                          toast(lang === 'ru' ? 'QR сохранён' : 'QR нигоҳ шуд', 'success')
                        }
                        reader.readAsDataURL(file)
                        e.target.value = ''
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Hint */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-start gap-3">
            <QrCode size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-700">
              {lang === 'ru'
                ? 'После загрузки QR, при выборе «Alif» или «DC Pay» в кассе — автоматически откроется окно с QR-кодом для клиента.'
                : 'QR-аксро бор кардан баъд, ҳангоми интихоби «Alif» ё «DC Pay» дар POS — тиреза бо QR-акс барои мизоч худкор кушода мешавад.'}
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: Намуд (Лого + Забон) ─────────────────────────── */}
      {tab === 'display' && (
        <div className="space-y-4 animate-fade-up">

          {/* ── Logo ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <ImagePlus size={16} className="text-indigo-400" />
              <p className="font-bold text-gray-800">{T('set_logo_title')}</p>
            </div>
            <div className="p-6">
              {settings.logoBase64 ? (
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img
                      src={settings.logoBase64}
                      alt="logo"
                      className="w-24 h-24 rounded-2xl object-cover shadow-lg ring-2 ring-gray-100"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                      {lang === 'ru' ? 'Логотип установлен' : 'Лого насб шудааст'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lang === 'ru' ? 'Отображается в панели навигации' : 'Дар навбати навигатсия нишон дода мешавад'}
                    </p>
                    <div className="flex gap-2">
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <ImagePlus size={13} /> {T('set_logo_btn')}
                      </label>
                      <button
                        onClick={handleLogoRemove}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Trash2 size={13} /> {T('set_logo_remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-10 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="w-14 h-14 bg-gray-100 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center transition-colors">
                    <ImagePlus size={26} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600 group-hover:text-indigo-600 transition-colors">
                      {T('set_logo_btn')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{T('set_logo_sub')}</p>
                  </div>
                </label>
              )}
              <input
                ref={logoRef}
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          {/* ── Language ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <Globe size={16} className="text-indigo-400" />
              <p className="font-bold text-gray-800">{T('set_lang_title')}</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {LANGS.map((l) => {
                  const isActive = (settings.language || 'tg') === l.code
                  const displayName = lang === 'ru' ? l.name_ru : l.name
                  return (
                    <button
                      key={l.code}
                      onClick={() => settings.update({ language: l.code })}
                      className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        isActive
                          ? 'border-indigo-400 bg-indigo-50 shadow-md shadow-indigo-100'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 size={16} className="text-indigo-500" />
                        </div>
                      )}
                      <span className="text-3xl leading-none">{l.flag}</span>
                      <div>
                        <p className={`font-bold text-sm ${isActive ? 'text-indigo-800' : 'text-gray-800'}`}>
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{l.code.toUpperCase()}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">
                  {lang === 'ru' ? 'Предпросмотр навигации' : 'Пешнамоиши навигатсия'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['nav_dashboard','nav_pos','nav_orders','nav_settings'].map((key) => (
                    <span key={key} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 font-medium shadow-sm">
                      {t(settings.language || 'tg', key)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
