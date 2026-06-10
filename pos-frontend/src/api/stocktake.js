import client from './client'

export const getSessions = () => client.get('/stocktake/')
export const getSession = (id) => client.get(`/stocktake/${id}/`)
export const createSession = (data) => client.post('/stocktake/', data)
export const updateLine = (sessionId, lineId, data) =>
  client.patch(`/stocktake/${sessionId}/update-line/${lineId}/`, data)
export const closeSession = (sessionId, applyAdjustments) =>
  client.post(`/stocktake/${sessionId}/close/`, { apply_adjustments: applyAdjustments })
