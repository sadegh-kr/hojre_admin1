// src/api/OrderAPI.js
import BaseAPI from './BaseAPI.js'
import { useCostToast } from '@/composables/useCostToast'
import { getApiErrorMessage } from '@/api/error'

class OrderAPI extends BaseAPI {
    constructor() {
        super()
        this.basePath = 'order/v2/'
    }

    // لیست سفارش‌ها برای یک رستوران
    getOrdersByRestaurant(restaurantId, params = {}) {
        return this.get(`${this.basePath}list/${restaurantId}`, { params })
    }

    getAdminOrders(restaurantId, params = {}) {
        return this.get(`${this.basePath}admin/orders/`, {
            params: { ...params, restaurant_id: restaurantId },
        })
    }

    financialStatistics(restaurantId, params = {}) {
        return this.request(this.get(`${this.basePath}admin/statistics/`, { params: { ...params, restaurant_id: restaurantId } }))
    }

    getOnlineOrderNotifications(restaurantId, cursor = null) {
        const params = { restaurant_id: restaurantId }
        if (cursor?.created) params.cursor_created = cursor.created
        if (cursor?.id) params.cursor_id = cursor.id
        return this.request(this.get(`${this.basePath}admin/online-notifications/`, { params }))
    }

    async request(promise, notify = false) {
        try {
            const { data } = await promise
            if (!data?.success) { const error = new Error(data?.message || 'پاسخ نامعتبر از سرور دریافت شد.'); error.order = data; throw error }
            if (notify) useCostToast().success(data.message)
            return data.data
        } catch (error) {
            const payload = error.order || error.response?.data
            error.order = payload
            if (notify) useCostToast().error(getApiErrorMessage(error))
            throw error
        }
    }

    getOrder(orderId) {
        return this.request(this.get(`${this.basePath}detail/${orderId}/`))
    }

    settleOrder(orderId, data) {
        return this.request(this.post(`${this.basePath}detail/${orderId}/settle/`, data))
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
