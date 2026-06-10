import client from './client'

export const getModifierGroups = () => client.get('/modifier-groups/')
export const createModifierGroup = (data) => client.post('/modifier-groups/', data)
export const updateModifierGroup = (id, data) => client.patch(`/modifier-groups/${id}/`, data)
export const deleteModifierGroup = (id) => client.delete(`/modifier-groups/${id}/`)

export const addModifier = (groupId, data) => client.post(`/modifier-groups/${groupId}/add-modifier/`, data)
export const deleteModifier = (groupId, mid) => client.delete(`/modifier-groups/${groupId}/remove-modifier/${mid}/`)

export const getWriteOffs = () => client.get('/writeoffs/')
export const createWriteOff = (data) => client.post('/writeoffs/', data)
