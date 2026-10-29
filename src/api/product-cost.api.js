import BaseAPI from './BaseAPI.js'
import { useCostToast } from '@/composables/useCostToast'
import { getApiErrorMessage } from '@/api/error'
import { notifyPricingWarningsChanged } from '@/utils/pricingWarnings'

class ProductCostAPI extends BaseAPI {
  constructor() { super(); this.basePath = 'menu/admin/' }
  async request(promise, notify = false) {
    try { const { data } = await promise; if (!data?.success) { const error = new Error(data?.message); error.cost = data; throw error } if (notify) useCostToast().success(data.message); return data.data }
    catch (error) { const payload = error.cost || error.response?.data; error.cost = payload; if (notify) useCostToast().error(getApiErrorMessage(error)); throw error }
  }
  async pricingWrite(promise) {
    const data = await this.request(promise, true)
    notifyPricingWarningsChanged()
    return data
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
  updateProduct(id, data, image = null) {
    if (!image) return this.pricingWrite(this.patch(`${this.basePath}products/${id}/`, data))
    const form = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) form.append(key, value)
    })
    form.append('image', image)
    return this.pricingWrite(this.patch(`${this.basePath}products/${id}/`, form))
  }
  deleteProduct(id) { return this.request(this.delete(`${this.basePath}products/${id}/`), true) }
  recipes(id) { return this.request(this.get(`${this.basePath}products/${id}/recipes/`)) }
  saveRecipe(id, data) { return this.pricingWrite(this.post(`${this.basePath}products/${id}/recipes/`, data)) }
  removeRecipe(id, lineId) { return this.pricingWrite(this.delete(`${this.basePath}products/${id}/recipes/${lineId}/`)) }
  uploadImage(id, file) { const form = new FormData(); form.append('image', file); return this.request(this.post(`${this.basePath}products/${id}/image/`, form), true) }
  removeImage(id) { return this.request(this.delete(`${this.basePath}products/${id}/image/`), true) }
  meta() { return this.request(this.get(`${this.basePath}products/meta/`)) }
  dashboard(params = {}) { return this.request(this.get(`${this.basePath}cost-dashboard/`, { params })) }
  monthlyIngredientAnalysis() { return this.request(this.get(`${this.basePath}monthly-ingredient-analysis/`)) }
  pricingRecommendations(params = {}) { return this.request(this.get(`${this.basePath}pricing/recommendations/`, { params })) }
  bulkPricingPreview() { return this.request(this.get(`${this.basePath}pricing/bulk-preview/`)) }
  bulkPricingApprove(recommendations) { return this.pricingWrite(this.post(`${this.basePath}pricing/bulk-approve/`, { recommendations })) }
  pricingWarningSummary() { return this.request(this.get(`${this.basePath}pricing/warnings/`)) }
  productPricing(id) { return this.request(this.get(`${this.basePath}products/${id}/pricing/`)) }
  saveProductPricing(id, data) { return this.pricingWrite(this.patch(`${this.basePath}products/${id}/pricing/`, data)) }
  approveProductPricing(id, data) { return this.pricingWrite(this.post(`${this.basePath}products/${id}/pricing/approve/`, data)) }
  dismissProductPricing(id, data) { return this.pricingWrite(this.post(`${this.basePath}products/${id}/pricing/dismiss/`, data)) }
  ingredients(params = {}) { return this.request(this.get(`${this.basePath}ingredients/`, { params })) }
  operationalIngredients(params = {}) { return this.request(this.get(`${this.basePath}operational/ingredients/`, { params })) }
  async activeIngredients() {
    const results = []
    let page = 1
    let response
    do {
      response = await this.operationalIngredients({ is_active: true, page, page_size: 50 })
      results.push(...(response.results || []))
      page += 1
    } while (response.has_next)
    return results
  }
  createIngredient(data) { return this.request(this.post(`${this.basePath}ingredients/`, data), true) }
  updateIngredient(id, data) { return this.pricingWrite(this.patch(`${this.basePath}ingredients/${id}/`, data)) }
  deleteIngredient(id) { return this.request(this.delete(`${this.basePath}ingredients/${id}/`), true) }
  createOperationalIngredient(data) { return this.request(this.post(`${this.basePath}operational/ingredients/`, data), true) }
  updateOperationalIngredient(id, data) { return this.pricingWrite(this.patch(`${this.basePath}operational/ingredients/${id}/`, data)) }
  deleteOperationalIngredient(id) { return this.request(this.delete(`${this.basePath}operational/ingredients/${id}/`), true) }
  createIngredientWaste(data) { return this.request(this.post(`${this.basePath}operational/ingredient-waste/`, data), true) }
  ingredientWasteReport(params = {}) { return this.request(this.get(`${this.basePath}operational/ingredient-waste/report/`, { params })) }
  inventoryOverview() { return this.request(this.get(`${this.basePath}inventory/overview/`)) }
  inventoryItems(params = {}) { return this.request(this.get(`${this.basePath}inventory/items/`, { params })) }
  inventoryMovements(params = {}) { return this.request(this.get(`${this.basePath}inventory/movements/`, { params })) }
  inventoryWaste(params = {}) { return this.request(this.get(`${this.basePath}inventory/waste/`, { params })) }
  materialCategories(params = {}) { return this.request(this.get(`${this.basePath}inventory/material-categories/`, { params })) }
  createMaterialCategory(data) { return this.request(this.post(`${this.basePath}inventory/material-categories/`, data), true) }
  overheads(params = {}) { return this.request(this.get(`${this.basePath}overheads/`, { params })) }
  createOverhead(data) { return this.pricingWrite(this.post(`${this.basePath}overheads/`, data)) }
  updateOverhead(id, data) { return this.pricingWrite(this.patch(`${this.basePath}overheads/${id}/`, data)) }
  deleteOverhead(id) { return this.pricingWrite(this.delete(`${this.basePath}overheads/${id}/`)) }
}
export default new ProductCostAPI()
