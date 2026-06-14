import client from './client'

export const getSuppliers   = ()      => client.get('/suppliers/')
export const createSupplier = (data)  => client.post('/suppliers/', data)
export const updateSupplier = (id, d) => client.patch(`/suppliers/${id}/`, d)
export const deleteSupplier = (id)    => client.delete(`/suppliers/${id}/`)
export const payDebt        = (id, amount) => client.post(`/suppliers/${id}/pay_debt/`, { amount })
export const getSupplierPurchases = (id) => client.get(`/suppliers/${id}/purchases/`)

export const getPurchases   = ()      => client.get('/purchases/')
export const createPurchase = (data)  => client.post('/purchases/', data)
