import { create } from 'zustand'

const DEFAULTS = {
  businessType: 'bubbletea',
  storeName: 'Bubble Tea',
  tableCount: 12,
  lowStockThreshold: 3,
  currency: 'сомони',
  taxPercent: 0,
  language: 'tg',
  logoBase64: '',
  employees: [],
  monthlyRevTarget: 0,
  qrAlif: '',
  qrDcPay: '',
}

const saved = (() => {
  try { return JSON.parse(localStorage.getItem('pos_settings') || '{}') } catch { return {} }
})()

const useSettingsStore = create((set, get) => ({
  ...DEFAULTS,
  ...saved,

  update(data) {
    const next = { ...get(), ...data }
    localStorage.setItem('pos_settings', JSON.stringify(next))
    if (data.storeName) localStorage.setItem('store_name', data.storeName)
    set(next)
  },
}))

export const BUSINESS_TYPES = {
  bubbletea: {
    label:         'Bubble Tea',
    label_ru:      'Bubble Tea',
    icon:          '🧋',
    color:         'from-pink-500 to-purple-500',
    posLabel:      'Нӯшокиҳо',
    categoryLabel: 'Навъи нӯшокӣ',
    tableMode:     true,
    sizeMode:      false,
    desc:          'Bubble tea, нӯшокиҳои меваӣ, чой',
    desc_ru:       'Bubble tea, фруктовые напитки, чай',
  },
}

export default useSettingsStore
