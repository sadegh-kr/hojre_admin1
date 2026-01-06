// src/api/BaseAPI.js
import axios from 'axios'
import router from '@/router'
import { BASE_URL } from '../../config.js'
import { useAuthStore } from '@/store/auth'

class BaseAPI {
    constructor() {
        this.api = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // 👉 Request Interceptor (توکن)
        this.api.interceptors.request.use(
            (config) => {
                const authStore = useAuthStore()

                if (authStore.accessToken) {
                    config.headers.Authorization = `Bearer ${authStore.accessToken}`
                }

                return config
            },
            (error) => Promise.reject(error)
        )

        // 👉 Response Interceptor (401)
        this.api.interceptors.response.use(
            response => response,
            async (error) => {
                const authStore = useAuthStore()

                if (error.response?.status === 401) {
                    authStore.logout()
                    router.push('/login')
                }

                return Promise.reject(error)
            }
        )
    }

    // ---- متدهای عمومی ----
    get(url, config = {}) {
        return this.api.get(url, config)
    }

    post(url, data, config = {}) {
        return this.api.post(url, data, config)
    }

    put(url, data, config = {}) {
        return this.api.put(url, data, config)
    }

    patch(url, data, config = {}) {
        return this.api.patch(url, data, config)
    }

    delete(url, config = {}) {
        return this.api.delete(url, config)
    }
}

export default BaseAPI
