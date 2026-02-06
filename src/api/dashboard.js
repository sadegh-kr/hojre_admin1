// src/api/auth.api.js
import BaseAPI from './BaseAPI'

class DashboardAPI extends BaseAPI {
    dashboard() {
        return this.get('/api/core/v1/dashboard/')
    }

}

export default new DashboardAPI()
