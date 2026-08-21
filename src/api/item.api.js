// src/api/OrderAPI.js
import BaseAPI from './BaseAPI.js'

class ItemAPI extends BaseAPI {
    constructor() {
        super()
        this.basePath = 'menu/v2/admin/item/'
    }

    async getItemList(params = {}) {
        const response = await this.get(`${this.basePath}list/`, { params })
        return response.data
    }
    async getItemCategory(params = {}) {
        const response = await this.get(`${this.basePath}list/category/`, { params })
        return response.data
    }
    async getAllCategories() {
        const response = await this.get(`${this.basePath}categories/`)
        return response.data.data || []
    }
    async createCategory(data) {
        const response = await this.post(`${this.basePath}categories/`, data)
        return response.data
    }
    async updateCategory(id, data) {
        const response = await this.patch(`${this.basePath}categories/${id}/`, data)
        return response.data
    }
    async deleteCategory(id) {
        const response = await this.delete(`${this.basePath}categories/${id}/`)
        return response.data
    }

}

export default new ItemAPI()
