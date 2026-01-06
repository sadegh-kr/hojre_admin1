// src/api/auth.api.js
import BaseAPI from './BaseAPI'

class AuthAPI extends BaseAPI {
    // 🔐 Login با رمز عبور
    login(data) {
        // data: { phone_number, password }
        return this.post('/api/user/login', data)
    }

    // 📝 Signup
    signup(data) {
        // data: { fullname, phone_number, password }
        return this.post('/api/user/signup/', data)
    }

    // ✅ Verify کد ثبت‌نام
    verify(data) {
        // data: { phone_number, code }
        return this.post('/api/user/verify/', data)
    }

    // 📲 درخواست OTP
    requestOTP(data) {
        // data: { phone_number }
        return this.post('/api/user/request_otp/', data)
    }

    // 🔢 تایید OTP
    verifyOTP(data) {
        // data: { phone_number, otp }
        return this.post('/api/user/verify_otp/', data)
    }

    // 🔄 Refresh Token (SimpleJWT)
    refreshToken(refresh) {
        return this.post('/api/user/token/refresh/', {
            refresh,
        })
    }

    // 👤 گرفتن اطلاعات کاربر
    getUser(id) {
        return this.get(`/api/user/${id}/`)
    }

    // ✏️ آپدیت پروفایل
    updateUser(data) {
        return this.put('/api/user/update/', data)
    }

    // ❌ حذف اکانت
    deleteUser(data) {
        // data: { password }
        return this.delete('/api/user/delete/', { data })
    }
}

export default new AuthAPI()
