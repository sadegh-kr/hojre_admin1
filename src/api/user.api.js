// src/api/user.api.js
import BaseAPI from './BaseAPI.js'

class UserAPI extends BaseAPI {
    constructor() {
        super()
        this.basePath = '/api/customer/v2/'  
    }

    getCustomerList( params = {}) {
        return this.get(`${this.basePath}list/`, { params })
    }

    // جزئیات یک سفارش
    getOrder(orderId) {
        return this.get(`${this.basePath}detail/${orderId}/`)
    }

    // ایجاد سفارش جدید
    updateOrderStatus(orderId, data) {
        return this.patch(`${this.basePath}update-status/${orderId}/`, data)
    }

    // آپدیت سفارش
    updateOrder(orderId, data) {
        return this.put(`${this.basePath}/${orderId}/`, data)
    }

    // حذف سفارش
    deleteOrder(orderId) {
        return this.delete(`${this.basePath}/${orderId}/`)
    }
}

export default new UserAPI()
