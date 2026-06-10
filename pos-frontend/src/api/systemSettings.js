import client from './client'

export const getSystemSettings = () => client.get('/system-settings/')
export const saveSystemSettings = (data) => client.post('/system-settings/', data)
export const testTelegram = () => client.post('/system-settings/telegram-test/')
