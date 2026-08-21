// src/api/auth.api.js
import BaseAPI from './BaseAPI'

class AuthAPI extends BaseAPI {
    // 🔐 Login با رمز عبور
    login(data) {
        // data: { phone_number, password }
        return this.post('user/login', data)
    }

    // 📝 Signup
    signup(data) {
        // data: { fullname, phone_number, password }
        return this.post('user/signup', data)
    }

    // ✅ Verify کد ثبت‌نام
    verify(data) {
        // data: { phone_number, code }
        return this.post('user/verify', data)
    }

    // 📲 درخواست OTP
    requestOTP(data) {
        // data: { phone_number }
        return this.post('user/request_otp', data)
    }

    // 🔢 تایید OTP
    verifyOTP(data) {
        // data: { phone_number, otp }
        return this.post('user/verify_otp', data)
    }

    // 🔄 Refresh Token (SimpleJWT)
    refreshToken(refresh) {
        return this.post('user/token/refresh', {
            refresh,
        })
    }

    // 👤 گرفتن اطلاعات کاربر
    getUser(id) {
        return this.get(`user/get/${id}`)
    }

    // ✏️ آپدیت پروفایل
    updateUser(data) {
        return this.put('user/update', data)
    }

    // ❌ حذف اکانت
    deleteUser(data) {
        // data: { password }
        return this.delete('user/delete', { data })
    }

    getAdminUsers(params = {}) { return this.get('user/admin/users/', { params }) }
    updateAdminRole(id, admin_role) { return this.patch(`user/admin/users/${id}/role/`, { admin_role }) }
}

export default new AuthAPI()
