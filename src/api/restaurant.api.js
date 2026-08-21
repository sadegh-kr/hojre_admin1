// src/api/restaurant.api.js
import BaseAPI from './BaseAPI'

class RestaurantAPI extends BaseAPI {
    constructor() {
        super()
    }

    // لیست رستوران‌ها
    listRestaurants() {
        return this.get('restaurant/v2/restaurant/list')
    }

    listBranch() {
        return this.get('restaurant/v2/branch/list')
    }
}

export default new RestaurantAPI()
