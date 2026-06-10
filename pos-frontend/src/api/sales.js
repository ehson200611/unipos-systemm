import client from './client'

export const getSales = (params) => client.get('/sales/', { params })
export const createSale = (data) => client.post('/sales/', data)
export const deleteSale = (id) => client.delete(`/sales/${id}/`)
export const markPreparing = (id) => client.post(`/sales/${id}/mark_preparing/`)
export const markReady = (id) => client.post(`/sales/${id}/mark_ready/`)
export const markServed = (id) => client.post(`/sales/${id}/mark_served/`)
export const refundSale = (id, data) => client.post(`/sales/${id}/refund/`, data)

export const getShifts = () => client.get('/shifts/')
export const openShift = () => client.post('/shifts/open/')
export const closeShift = (data) => client.post('/shifts/close/', data)
export const getCurrentShift = () => client.get('/shifts/current/')
export const getShift = (id) => client.get(`/shifts/${id}/`)
