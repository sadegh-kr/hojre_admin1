// src/api/auth.api.js
import BaseAPI from './BaseAPI'

class DashboardAPI extends BaseAPI {
    dashboard(params = {}) {
        return this.get('core/v1/dashboard/', { params })
    }

}

export default new DashboardAPI()
