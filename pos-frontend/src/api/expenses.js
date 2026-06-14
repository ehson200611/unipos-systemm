import client from './client'

export const getExpenses      = (params) => client.get('/reports/expenses/', { params })
export const createExpense    = (data)   => client.post('/reports/expenses/', data)
export const deleteExpense    = (id)     => client.delete(`/reports/expenses/${id}/`)
export const getFinancial     = (days)   => client.get('/reports/financial/', { params: { days } })
