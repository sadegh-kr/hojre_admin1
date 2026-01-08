// src/api/restaurant.api.js
import BaseAPI from './BaseAPI'

class RestaurantAPI extends BaseAPI {
    constructor() {
        super()
    }

    // لیست رستوران‌ها
    listRestaurants() {
        return this.get('/api/restaurant/v2/restaurant/list')
    }

    listBranch() {
        return this.get('/api/restaurant/v2/branch/list')
    }
    // اگه بخوای بعداً endpoint دیگه اضافه کنی:
    // createRestaurant(data) {
    //     return this.post('/api/restaurant/v2/create', data)
    // }
}

export default new RestaurantAPI()
