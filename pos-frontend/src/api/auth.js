import client from './client'

export const login = (data) => client.post('/auth/login/', data)
export const logout = (refresh) => client.post('/auth/logout/', { refresh })
export const getMe = () => client.get('/auth/me/')
export const updateMe = (data) => client.patch('/auth/me/', data)
export const getWorkers = () => client.get('/auth/workers/')
export const createWorker = (data) => client.post('/auth/workers/', data)
export const updateWorker = (id, data) => client.patch(`/auth/workers/${id}/`, data)
export const deleteWorker = (id) => client.delete(`/auth/workers/${id}/`)
export const toggleWorker = (id) => client.post(`/auth/workers/${id}/toggle-active/`)
