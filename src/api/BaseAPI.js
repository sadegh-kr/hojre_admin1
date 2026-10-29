// src/api/BaseAPI.js
import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/store/auth'
import { API_BASE_URL } from '@/config/api'
import { getApiErrorMessage } from '@/api/error'

const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

let refreshPromise = null

class BaseAPI {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // 👉 Request Interceptor (توکن)
        this.api.interceptors.request.use(
            (config) => {
                const authStore = useAuthStore()

                // Let the browser generate the multipart boundary. Keeping the
                // default JSON content type causes Axios to serialize FormData.
                if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
                    config.headers.delete('Content-Type')
                }

                if (authStore.accessToken && !config.skipAuthRefresh) {
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
                error.apiMessage = getApiErrorMessage(error)

                const originalRequest = error.config
                const canRefresh = error.response?.status === 401
                    && !originalRequest?._retry
                    && !originalRequest?.skipAuthRefresh
                    && Boolean(authStore.refreshToken)

                if (canRefresh) {
                    originalRequest._retry = true

                    try {
                        if (!refreshPromise) {
                            refreshPromise = refreshClient.post('user/token/refresh', {
                                refresh: authStore.refreshToken,
                            }).then(({ data }) => {
                                authStore.updateTokens({
                                    access: data.access,
                                    refresh: data.refresh,
                                })
                                return data.access
                            }).finally(() => {
                                refreshPromise = null
                            })
                        }

                        const access = await refreshPromise
                        originalRequest.headers = originalRequest.headers || {}
                        originalRequest.headers.Authorization = `Bearer ${access}`
                        return this.api.request(originalRequest)
                    } catch (refreshError) {
                        refreshError.apiMessage = getApiErrorMessage(refreshError)
                        authStore.logout()
                        if (router.currentRoute.value.path !== '/login') {
                            await router.push('/login')
                        }
                        return Promise.reject(refreshError)
                    }
                }

                // A failed refresh (or a session with no refresh token) proves the
                // session cannot continue. A lone endpoint-level 401 does not.
                if (error.response?.status === 401 && !authStore.refreshToken) {
                    authStore.logout()
                    if (router.currentRoute.value.path !== '/login') {
                        await router.push('/login')
                    }
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
