import BaseAPI from './BaseAPI.js'
import { useCostToast } from '@/composables/useCostToast'
import { getApiErrorMessage } from '@/api/error'

class ProductCostAPI extends BaseAPI {
  constructor() { super(); this.basePath = 'menu/admin/' }
  async request(promise, notify = false) {
    try { const { data } = await promise; if (!data?.success) { const error = new Error(data?.message); error.cost = data; throw error } if (notify) useCostToast().success(data.message); return data.data }
    catch (error) { const payload = error.cost || error.response?.data; error.cost = payload; if (notify) useCostToast().error(getApiErrorMessage(error)); throw error }
  }
  products(params) { return this.request(this.get(`${this.basePath}products/`, { params })) }
  product(id) { return this.request(this.get(`${this.basePath}products/${id}/`)) }
  createProduct(data, image = null) {
    if (!image) return this.request(this.post(`${this.basePath}products/`, data), true)
    const form = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) form.append(key, value)
    })
    form.append('image', image)
    return this.request(this.post(`${this.basePath}products/`, form), true)
  }
  updateProduct(id, data) { return this.request(this.patch(`${this.basePath}products/${id}/`, data), true) }
  deleteProduct(id) { return this.request(this.delete(`${this.basePath}products/${id}/`), true) }
  recipes(id) { return this.request(this.get(`${this.basePath}products/${id}/recipes/`)) }
  saveRecipe(id, data) { return this.request(this.post(`${this.basePath}products/${id}/recipes/`, data), true) }
  removeRecipe(id, lineId) { return this.request(this.delete(`${this.basePath}products/${id}/recipes/${lineId}/`), true) }
  uploadImage(id, file) { const form = new FormData(); form.append('image', file); return this.request(this.post(`${this.basePath}products/${id}/image/`, form, { headers: { 'Content-Type': 'multipart/form-data' } }), true) }
  removeImage(id) { return this.request(this.delete(`${this.basePath}products/${id}/image/`), true) }
  meta() { return this.request(this.get(`${this.basePath}products/meta/`)) }
  dashboard(params = {}) { return this.request(this.get(`${this.basePath}cost-dashboard/`, { params })) }
  ingredients(params = {}) { return this.request(this.get(`${this.basePath}ingredients/`, { params })) }
  async activeIngredients() {
    const results = []
    let page = 1
    let response
    do {
      response = await this.ingredients({ is_active: true, page, page_size: 50 })
      results.push(...(response.results || []))
      page += 1
    } while (response.has_next)
    return results
  }
  createIngredient(data) { return this.request(this.post(`${this.basePath}ingredients/`, data), true) }
  updateIngredient(id, data) { return this.request(this.patch(`${this.basePath}ingredients/${id}/`, data), true) }
  deleteIngredient(id) { return this.request(this.delete(`${this.basePath}ingredients/${id}/`), true) }
  overheads(params = {}) { return this.request(this.get(`${this.basePath}overheads/`, { params })) }
  createOverhead(data) { return this.request(this.post(`${this.basePath}overheads/`, data), true) }
  updateOverhead(id, data) { return this.request(this.patch(`${this.basePath}overheads/${id}/`, data), true) }
  deleteOverhead(id) { return this.request(this.delete(`${this.basePath}overheads/${id}/`), true) }
}
export default new ProductCostAPI()
