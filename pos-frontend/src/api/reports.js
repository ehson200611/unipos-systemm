import client from './client'

export const getDashboard = () => client.get('/reports/dashboard/')
export const getDaily = (days = 30) => client.get('/reports/daily/', { params: { days } }).then((r) => ({ ...r, data: r.data.data || r.data }))
export const getSummary = (params) => client.get('/reports/summary/', { params })
