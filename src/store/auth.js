// src/store/auth.js
import { defineStore } from 'pinia'
import authApi from '@/api/auth.api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem('access_token') || null,
        refreshToken: localStorage.getItem('refresh_token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        isAdmin: (state) => Boolean(state.user?.is_staff || state.user?.is_superuser),
        canAccessFinancials: (state) => Boolean(state.user?.is_superuser || (state.user?.is_staff && state.user?.admin_role === 'owner')),
    },

    actions: {
        // ✅ این متد باید وجود داشته باشه
        async login(payload) {
            const { data } = await authApi.login(payload)

            this.setAuth({
                access: data.access,
                refresh: data.refresh,
                user: data.user,
            })
        },

        setAuth({ access, refresh, user }) {
            this.accessToken = access
            this.refreshToken = refresh
            this.user = user

            localStorage.setItem('access_token', access)
            localStorage.setItem('refresh_token', refresh)
            localStorage.setItem('user', JSON.stringify(user))
        },

        logout() {
            this.accessToken = null
            this.refreshToken = null
            this.user = null

            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')
        },
    },
})
