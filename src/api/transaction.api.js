import BaseAPI from './BaseAPI.js'
import { useCostToast } from '@/composables/useCostToast'

class TransactionAPI extends BaseAPI {
  constructor() { super(); this.basePath = '/api/expenses/admin/' }

  async request(promise, { notify = false } = {}) {
    try {
      const response = await promise
      const payload = response.data
      if (!payload?.success) {
        const error = new Error(payload?.message || 'انجام عملیات امکان‌پذیر نیست.')
        error.cost = payload
        throw error
      }
      if (notify) useCostToast().success(payload.message)
      return payload.data
    } catch (error) {
      const payload = error.cost || error.response?.data
      if (notify && payload?.message) useCostToast().error(payload.message)
      error.cost = payload
      throw error
    }
  }

  getList(params = {}) { return this.request(this.get(this.basePath, { params })) }
  create(data) { return this.request(this.post(this.basePath, data), { notify: true }) }
  getDetail(id) { return this.request(this.get(`${this.basePath}${id}/`)) }
  partialUpdate(id, data) { return this.request(this.patch(`${this.basePath}${id}/`, data), { notify: true }) }
  remove(id) { return this.request(this.delete(`${this.basePath}${id}/`), { notify: true }) }
  getSummary(params = {}) { return this.request(this.get(`${this.basePath}summary/`, { params })) }
  getMonthlyReport(params = {}) { return this.request(this.get(`${this.basePath}monthly-report/`, { params })) }
  getCategoryList() { return this.request(this.get(`${this.basePath}categories/`)) }
  createCategory(data) { return this.request(this.post(`${this.basePath}categories/`, data), { notify: true }) }
}

export default new TransactionAPI()
