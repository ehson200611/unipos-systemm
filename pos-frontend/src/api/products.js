import client from './client'

export const getCategories = () => client.get('/categories/')
export const createCategory = (data) => client.post('/categories/', data)
export const updateCategory = (id, data) => client.patch(`/categories/${id}/`, data)
export const deleteCategory = (id) => client.delete(`/categories/${id}/`)

export const getProducts = (params) => client.get('/products/', { params })
export const getProduct = (id) => client.get(`/products/${id}/`)
export const createProduct = (data) => client.post('/products/', data)
export const updateProduct = (id, data) => client.patch(`/products/${id}/`, data)
export const deleteProduct = (id) => client.delete(`/products/${id}/`)
export const toggleProduct = (id) => client.post(`/products/${id}/toggle-active/`)
export const addStock = (id, data) => client.post(`/products/${id}/add-stock/`, data)
export const getColorStocks = (id) => client.get(`/products/${id}/color-stocks/`)
export const addColorStock = (id, data) => client.post(`/products/${id}/add-color-stock/`, data)
export const getColors = () => client.get('/colors/')

export const getRecipe = (id) => client.get(`/products/${id}/recipe/`)
export const saveRecipe = (id, data) => client.put(`/products/${id}/recipe/`, data)
export const getIngredients = (params) => client.get('/products/', { params: { is_ingredient: true, ...params } })
export const bulkAssignIngredient = (data) => client.post('/products/bulk-assign-ingredient/', data)

export const getMenu = (params) => client.get('/menu/', { params })
export const getMenuCategories = () => client.get('/menu/categories/')
