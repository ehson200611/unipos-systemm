import client from './client'

export const getCustomers    = (params) => client.get('/customers/', { params })
export const getCustomer     = (id)     => client.get(`/customers/${id}/`)
export const createCustomer  = (data)   => client.post('/customers/', data)
export const updateCustomer  = (id, d)  => client.patch(`/customers/${id}/`, d)
export const deleteCustomer  = (id)     => client.delete(`/customers/${id}/`)
export const searchByPhone   = (phone)  => client.get('/customers/search_phone/', { params: { phone } })
export const addBonus        = (id, amount) => client.post(`/customers/${id}/add_bonus/`, { amount })
export const useBonus        = (id, amount) => client.post(`/customers/${id}/use_bonus/`, { amount })
