// src/api/OrderAPI.js
import BaseAPI from './BaseAPI.js'
import { useCostToast } from '@/composables/useCostToast'

class OrderAPI extends BaseAPI {
    constructor() {
        super()
        this.basePath = '/api/order/v2/'  // مسیر اصلی API سفارش‌ها
    }

    // لیست سفارش‌ها برای یک رستوران
    getOrdersByRestaurant(restaurantId, params = {}) {
        return this.get(`${this.basePath}list/${restaurantId}`, { params })
    }

    async request(promise, notify = false) {
        try {
            const { data } = await promise
            if (!data?.success) { const error = new Error(data?.message || 'انجام عملیات امکان‌پذیر نیست.'); error.order = data; throw error }
            if (notify) useCostToast().success(data.message)
            return data.data
        } catch (error) {
            const payload = error.order || error.response?.data
            if (notify && payload?.message) useCostToast().error(payload.message)
            error.order = payload
            throw error
        }
    }

    getOrder(orderId) {
        return this.request(this.get(`${this.basePath}detail/${orderId}/`))
    }

    // ایجاد سفارش جدید
    updateOrderStatus(orderId, data) {
        return this.request(this.patch(`${this.basePath}update-status/${orderId}/`, data), true)
    }
    createOrderInStore( data) {
        return this.post(`${this.basePath}create/in_store/`, data)
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
