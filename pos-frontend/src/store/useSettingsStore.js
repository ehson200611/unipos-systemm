import { create } from 'zustand'

const DEFAULTS = {
  businessType: 'electronics',
  storeName: 'Телефон дӯкон',
  tableCount: 12,
  lowStockThreshold: 3,
  currency: 'сомони',
  taxPercent: 0,
  language: 'tg',
  logoBase64: '',
  employees: [],       // [{ name, salary }]
  monthlyRevTarget: 0, // daily target = monthlyRevTarget / 30
  qrAlif: '',          // base64 QR image for Alif Mobi
  qrDcPay: '',         // base64 QR image for DC Pay
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
  electronics: {
    label:         'Дӯкони электроника',
    label_ru:      'Магазин электроники',
    icon:          '📱',
    color:         'from-blue-500 to-indigo-600',
    posLabel:      'Маҳсулот',
    categoryLabel: 'Категория',
    tableMode:     false,
    sizeMode:      false,
    desc:          'Телефон, ноутбук, аксессуарҳо',
    desc_ru:       'Телефоны, ноутбуки, аксессуары',
  },
  fastfood: {
    label:         'Фастфуд / Кафе',
    label_ru:      'Фастфуд / Кафе',
    icon:          '🍔',
    color:         'from-orange-500 to-red-500',
    posLabel:      'Меню',
    categoryLabel: 'Навъи хӯрок',
    tableMode:     true,
    sizeMode:      false,
    desc:          'Ресторан, кафе, фастфуд',
    desc_ru:       'Ресторан, кафе, фастфуд',
  },
  clothing: {
    label:         'Дӯкони либос',
    label_ru:      'Магазин одежды',
    icon:          '👕',
    color:         'from-pink-500 to-rose-500',
    posLabel:      'Маҳсулот',
    categoryLabel: 'Навъ',
    tableMode:     false,
    sizeMode:      true,
    desc:          'Либос, пойафзол, аксессуарҳо',
    desc_ru:       'Одежда, обувь, аксессуары',
  },
  grocery: {
    label:         'Супермаркет',
    label_ru:      'Супермаркет',
    icon:          '🛒',
    color:         'from-green-500 to-emerald-600',
    posLabel:      'Маҳсулот',
    categoryLabel: 'Категория',
    tableMode:     false,
    sizeMode:      false,
    desc:          'Хӯрокворӣ, маводи рӯзмарра',
    desc_ru:       'Продукты питания, товары первой необходимости',
  },
}

export default useSettingsStore
