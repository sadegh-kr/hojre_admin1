// src/api/OrderAPI.js
import BaseAPI from './BaseAPI.js'

class ItemAPI extends BaseAPI {
    constructor() {
        super()
        this.basePath = '/api/menu/v2/admin/item/'  // مسیر اصلی API سفارش‌ها
    }

    getItemList(  params = {}) {
        return this.get(`${this.basePath}list/`, { params })
    }
    getItemCategory(  params = {}) {
        return this.get(`${this.basePath}list/category/`, { params })
    }

}

export default new ItemAPI()
