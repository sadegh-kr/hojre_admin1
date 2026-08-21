import BaseAPI from './BaseAPI.js'
import { useCostToast } from '@/composables/useCostToast'
import { getApiErrorMessage } from '@/api/error'

class TransactionAPI extends BaseAPI {
  constructor() { super(); this.basePath = 'expenses/admin/' }

  async request(promise, { notify = false } = {}) {
    try {
      const response = await promise
      const payload = response.data
      if (!payload?.success) {
        const error = new Error(payload?.message || 'پاسخ نامعتبر از سرور دریافت شد.')
        error.cost = payload
        throw error
      }
      if (notify) useCostToast().success(payload.message)
      return payload.data
    } catch (error) {
      const payload = error.cost || error.response?.data
      error.cost = payload
      if (notify) useCostToast().error(getApiErrorMessage(error))
      throw error
    }
  }

  getList(params = {}) { return this.request(this.get(this.basePath, { params })) }
  create(data) { return this.request(this.post(this.basePath, data), { notify: true }) }
  getDetail(id) { return this.request(this.get(`${this.basePath}${id}/`)) }
  update(id, data) { return this.request(this.put(`${this.basePath}${id}/`, data), { notify: true }) }
  partialUpdate(id, data) { return this.request(this.patch(`${this.basePath}${id}/`, data), { notify: true }) }
  remove(id) { return this.request(super.delete(`${this.basePath}${id}/`), { notify: true }) }
  delete(id) { return this.remove(id) }
  getSummary(params = {}) { return this.request(this.get(`${this.basePath}summary/`, { params })) }
  getStatistics(params = {}) { return this.getSummary(params) }
  getMonthlyReport(params = {}) { return this.request(this.get(`${this.basePath}monthly-report/`, { params })) }
  getCategoryList(params = {}) { return this.request(this.get(`${this.basePath}categories/`, { params })) }
  getCategoryDetail(id) { return this.request(this.get(`${this.basePath}categories/${id}/`)) }
  createCategory(data) { return this.request(this.post(`${this.basePath}categories/`, data), { notify: true }) }
  updateCategory(id, data) { return this.request(this.patch(`${this.basePath}categories/${id}/`, data), { notify: true }) }
  deleteCategory(id) { return this.request(super.delete(`${this.basePath}categories/${id}/`), { notify: true }) }
}

export default new TransactionAPI()
