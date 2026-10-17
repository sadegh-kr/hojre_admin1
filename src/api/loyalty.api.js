import BaseAPI from './BaseAPI.js'
import { useRestaurantStore } from '@/store/restaurant'

export const RESTAURANT_CONTEXT_MESSAGE = 'لطفاً ابتدا رستوران مورد نظر را انتخاب کنید.'

function withoutEmptyValues(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  )
}

class LoyaltyAPI extends BaseAPI {
  constructor() {
    super()
    this.basePath = 'loyalty/admin/'
  }

  unwrap(response) { return response.data }
  scopedConfig(params = {}) {
    const restaurantId = useRestaurantStore().activeRestaurantId
    if (!restaurantId) {
      const error = new Error(RESTAURANT_CONTEXT_MESSAGE)
      error.apiMessage = RESTAURANT_CONTEXT_MESSAGE
      error.code = 'RESTAURANT_CONTEXT_REQUIRED'
      throw error
    }
    return { params: withoutEmptyValues({ ...params, restaurant_id: restaurantId }) }
  }

  overview(params = {}) { return this.get(`${this.basePath}overview/`, this.scopedConfig(params)).then(this.unwrap) }
  customers(params = {}) { return this.get(`${this.basePath}customers/`, this.scopedConfig(params)).then(this.unwrap) }
  createCustomer(data) { return this.post(`${this.basePath}customers/`, data, this.scopedConfig()).then(this.unwrap) }
  searchCustomers(q) { return this.get(`${this.basePath}customers/search/`, this.scopedConfig({ q })).then(this.unwrap) }
  customer(id) { return this.get(`${this.basePath}customers/${id}/`, this.scopedConfig()).then(this.unwrap) }
  updateCustomer(id, data) { return this.patch(`${this.basePath}customers/${id}/`, data, this.scopedConfig()).then(this.unwrap) }
  points(id) { return this.get(`${this.basePath}customers/${id}/points/`, this.scopedConfig()).then(this.unwrap) }
  adjustPoints(id, data) { return this.post(`${this.basePath}customers/${id}/points/adjust/`, data, this.scopedConfig()).then(this.unwrap) }
  wallet(id) { return this.get(`${this.basePath}customers/${id}/wallet/`, this.scopedConfig()).then(this.unwrap) }
  adjustWallet(id, data) { return this.post(`${this.basePath}customers/${id}/wallet/adjust/`, data, this.scopedConfig()).then(this.unwrap) }
  tiers() { return this.get(`${this.basePath}tiers/`, this.scopedConfig()).then(this.unwrap) }
  createTier(data) { return this.post(`${this.basePath}tiers/`, data, this.scopedConfig()).then(this.unwrap) }
  updateTier(id, data) { return this.patch(`${this.basePath}tiers/${id}/`, data, this.scopedConfig()).then(this.unwrap) }
  rules() { return this.get(`${this.basePath}rules/`, this.scopedConfig()).then(this.unwrap) }
  createRule(data) { return this.post(`${this.basePath}rules/`, data, this.scopedConfig()).then(this.unwrap) }
  updateRule(id, data) { return this.patch(`${this.basePath}rules/${id}/`, data, this.scopedConfig()).then(this.unwrap) }
  automaticEarningSettings() { return this.get(`${this.basePath}automatic-earning-settings/`, this.scopedConfig()).then(this.unwrap) }
  updateAutomaticEarningSettings(data) { return this.patch(`${this.basePath}automatic-earning-settings/`, data, this.scopedConfig()).then(this.unwrap) }
  rewards() { return this.get(`${this.basePath}rewards/`, this.scopedConfig()).then(this.unwrap) }
  createReward(data) { return this.post(`${this.basePath}rewards/`, data, this.scopedConfig()).then(this.unwrap) }
  redeemReward(id, data) { return this.post(`${this.basePath}rewards/${id}/redeem/`, data, this.scopedConfig()).then(this.unwrap) }
  reports(params = {}) { return this.get(`${this.basePath}reports/`, this.scopedConfig(params)).then(this.unwrap) }
}

export default new LoyaltyAPI()
