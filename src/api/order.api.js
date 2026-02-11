// src/api/OrderAPI.js
import BaseAPI from './BaseAPI.js'

class OrderAPI extends BaseAPI {
    constructor() {
        super()
        this.basePath = '/api/order/v2/'  // مسیر اصلی API سفارش‌ها
    }

    // لیست سفارش‌ها برای یک رستوران
    getOrdersByRestaurant(restaurantId, params = {}) {
        return this.get(`${this.basePath}list/${restaurantId}`, { params })
    }

    // جزئیات یک سفارش
    getOrder(orderId) {
        return this.get(`${this.basePath}detail/${orderId}/`)
    }

    // ایجاد سفارش جدید
    updateOrderStatus(orderId, data) {
        return this.patch(`${this.basePath}update-status/${orderId}/`, data)
    }
    userOrderList(UserId, params) {
        return this.get(`${this.basePath}user-order/${UserId}/`, {params})
    }

    // آپدیت سفارش
    updateOrder(orderId, data) {
        return this.get(`${this.basePath}/${orderId}/`, data)
    }

    // حذف سفارش
    deleteOrder(orderId) {
        return this.delete(`${this.basePath}/${orderId}/`)
    }
}

export default new OrderAPI()
