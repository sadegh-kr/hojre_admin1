import { defineStore } from 'pinia'
import RestaurantAPI from '@/api/restaurant.api'

const STORAGE_KEY = 'active_restaurant_id'
let initializationPromise = null

export const useRestaurantStore = defineStore('restaurant', {
  state: () => ({
    restaurants: [],
    activeRestaurantId: localStorage.getItem(STORAGE_KEY) || '',
    ready: false,
    loading: false,
    error: '',
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

      if (force) this.ready = false
      this.loading = true
      this.error = ''
      initializationPromise = RestaurantAPI.listRestaurants()
        .then(({ data }) => {
          this.restaurants = data.results || []
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
          this.restaurants = []
          this.clearSelection()
          this.error = error.apiMessage || 'دریافت فهرست رستوران‌های مجاز انجام نشد.'
        })
        .finally(() => {
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

    reset() {
      this.restaurants = []
      this.clearSelection()
      this.ready = false
      this.loading = false
      this.error = ''
    },
  },
})
