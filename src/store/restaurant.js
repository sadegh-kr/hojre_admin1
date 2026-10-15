import { defineStore } from 'pinia'
import RestaurantAPI from '@/api/restaurant.api'

const STORAGE_KEY = 'active_restaurant_id'
let initializationPromise = null
let initializationEpoch = 0

export const useRestaurantStore = defineStore('restaurant', {
  state: () => ({
    restaurants: [],
    activeRestaurantId: localStorage.getItem(STORAGE_KEY) || '',
    ready: false,
    loading: false,
    error: '',
    errorKind: '',
    contextVersion: 0,
  }),

  getters: {
    activeRestaurant: state => state.restaurants.find(item => item.id === state.activeRestaurantId) || null,
    requiresSelection: state => state.ready && state.restaurants.length > 1 && !state.activeRestaurantId,
  },

  actions: {
    async initialize(force = false) {
      if (this.ready && !force) return
      if (initializationPromise) return initializationPromise

      const epoch = ++initializationEpoch
      if (force) this.ready = false
      this.loading = true
      this.error = ''
      this.errorKind = ''
      initializationPromise = RestaurantAPI.listRestaurants()
        .then(({ data }) => {
          if (epoch !== initializationEpoch) return
          if (!Array.isArray(data?.results)) {
            throw new Error('پاسخ فهرست رستوران‌ها معتبر نیست. لطفاً دوباره تلاش کنید.')
          }
          this.restaurants = data.results
          const storedId = localStorage.getItem(STORAGE_KEY) || ''
          const storedIsAccessible = this.restaurants.some(item => item.id === storedId)

          if (this.restaurants.length === 1) {
            this.setActiveRestaurant(this.restaurants[0].id)
          } else if (storedId && storedIsAccessible) {
            this.activeRestaurantId = storedId
          } else {
            this.clearSelection()
          }
        })
        .catch(error => {
          if (epoch !== initializationEpoch) return
          this.restaurants = []
          this.clearSelection()
          const status = error.response?.status
          this.errorKind = status === 401 ? 'authentication' : status === 403 ? 'permission' : 'request'
          this.error = this.errorKind === 'authentication'
            ? 'نشست مدیریت شما معتبر نیست. لطفاً دوباره وارد شوید.'
            : error.apiMessage || error.message || 'دریافت فهرست رستوران‌های مجاز انجام نشد.'
        })
        .finally(() => {
          if (epoch !== initializationEpoch) return
          this.loading = false
          this.ready = true
          initializationPromise = null
        })

      return initializationPromise
    },

    setActiveRestaurant(restaurantId) {
      const normalizedId = String(restaurantId || '')
      if (!this.restaurants.some(item => item.id === normalizedId)) {
        throw new Error('رستوران انتخاب‌شده در فهرست دسترسی شما نیست.')
      }
      if (this.activeRestaurantId !== normalizedId) this.contextVersion += 1
      this.activeRestaurantId = normalizedId
      localStorage.setItem(STORAGE_KEY, normalizedId)
    },

    clearSelection() {
      if (this.activeRestaurantId) this.contextVersion += 1
      this.activeRestaurantId = ''
      localStorage.removeItem(STORAGE_KEY)
    },

    cancelInitialization() {
      initializationEpoch += 1
      initializationPromise = null
      this.restaurants = []
      this.ready = false
      this.loading = false
      this.error = ''
      this.errorKind = ''
    },

    reset() {
      this.cancelInitialization()
      this.clearSelection()
    },
  },
})
