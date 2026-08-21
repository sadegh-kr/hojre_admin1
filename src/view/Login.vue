<template>
  <div class="login-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- دکمه تغییر حالت شب/روز -->
    <!-- <button class="theme-toggle" @click="toggleTheme" :title="isDarkMode ? 'حالت روز' : 'حالت شب'">
      <span class="theme-icon">
        <svg v-if="isDarkMode" viewBox="0 0 24 24">
          <path d="M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41L18.36,16.95z M19.42,5.99l-1.06-1.06c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0C19.81,7.02,19.81,6.38,19.42,5.99z M7.05,18.36l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41c0.39,0.39,1.03,0.39,1.41,0l1.06-1.06c0.39-0.39,0.39-1.03,0-1.41C8.08,17.97,7.44,17.97,7.05,18.36z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <path d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
        </svg>
      </span>
    </button> -->

    <!-- عناصر دکوراتیو قهوه -->
    <div class="coffee-elements">
      <div class="coffee-cup" :class="{ 'dark': isDarkMode }">
        <div class="cup-handle"></div>
        <div class="coffee-liquid"></div>
        <div class="coffee-foam"></div>
      </div>

      <!-- دانه‌های قهوه -->
      <div class="coffee-bean bean1" :class="{ 'dark': isDarkMode }"></div>
      <div class="coffee-bean bean2" :class="{ 'dark': isDarkMode }"></div>
      <div class="coffee-bean bean3" :class="{ 'dark': isDarkMode }"></div>
      <div class="coffee-bean bean4" :class="{ 'dark': isDarkMode }"></div>

      <!-- بخار قهوه -->
      <div class="steam steam1"></div>
      <div class="steam steam2"></div>
      <div class="steam steam3"></div>
    </div>

    <!-- کارت اصلی لاگین -->
    <div class="login-card">
      <!-- هدر -->
      <div class="header">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M18 6h-2v2h2V6zm0 4h-2v2h2v-2zm-4-4h-2v2h2V6zm0 4h-2v2h2v-2zm8-6v12c0 2.21-1.79 4-4 4H6c-2.21 0-4-1.79-4-4V4c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-2 0H4v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4z"/>
              <path d="M11 14l-3-3v2H4v2h4v2L11 14zM20 12h-4v2h4v-2zM20 16h-4v2h4v-2z"/>
            </svg>
          </div>
          <h1>کافه حجره</h1>
        </div>
        <p class="subtitle">ورود به پنل مدیریت اختصاصی</p>
      </div>

      <!-- فرم لاگین -->
      <form class="login-form" @submit.prevent="handleLogin">
        <!-- فیلد نام کاربری -->
        <div class="input-group">
          <label for="username">
            <span class="input-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </span>
            نام کاربری
          </label>
          <div class="input-wrapper">
            <input
                id="username"
                v-model="form.username"
                type="text"
                placeholder="admin@cafehojre.ir"
                required
                @focus="highlightInput('username')"
                @blur="removeHighlight('username')"
            >
            <div class="input-decoration"></div>
          </div>
        </div>

        <!-- فیلد رمز عبور -->
        <div class="input-group">
          <label for="password">
            <span class="input-icon">
              <svg viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </span>
            رمز عبور
          </label>
          <div class="input-wrapper">
            <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                @focus="highlightInput('password')"
                @blur="removeHighlight('password')"
            >
            <button
                type="button"
                class="password-toggle"
                @click="togglePasswordVisibility"
                :title="showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'"
            >
              <svg v-if="showPassword" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
            </button>
            <div class="input-decoration"></div>
          </div>
        </div>

        <!-- گزینه‌های اضافی -->
        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.rememberMe" class="checkbox-input">
            <span class="custom-checkbox"></span>
            مرا به خاطر بسپار
          </label>
          <a href="#" class="forgot-password" @click.prevent="showForgotPassword">
            رمز عبور را فراموش کرده‌اید؟
          </a>
        </div>

        <!-- دکمه ورود -->
        <button
            type="submit"
            class="submit-btn"
            :class="{ 'loading': isLoading }"
            :disabled="isLoading"
        >
          <span v-if="!isLoading" class="btn-content">
            <span class="btn-icon">
              <svg viewBox="0 0 24 24">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              </svg>
            </span>
            ورود به پنل مدیریت
          </span>
          <span v-else class="btn-loading">
            <span class="spinner"></span>
            در حال ورود...
          </span>
        </button>

        <!-- ورود مهمان -->
        <div class="guest-login">
          <p class="divider">
            <span>یا</span>
          </p>
          <button
              type="button"
              class="guest-btn"
              @click="enterAsGuest"
          >
            <span class="guest-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </span>
            مشاهده به عنوان مهمان
          </button>
        </div>
      </form>

      <!-- فوتر -->
      <div class="footer">
        <p class="copyright">© 1404 کافه حجره - تمامی حقوق محفوظ است</p>
       
        <p class="security-info">
          <span class="security-icon">
            <svg viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </span>
          اطلاعات شما با امنیت کامل ذخیره می‌شود 
     
        </p>
          
      </div>
    </div>

    <!-- اعلان خطا -->
    <div v-if="errorMessage" class="error-notification" :class="{ 'show': errorMessage }">
      <div class="error-content">
        <span class="error-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </span>
        <span class="error-text">{{ errorMessage }}</span>
        <button class="close-error" @click="errorMessage = ''">
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- مودال فراموشی رمز -->
    <div v-if="showForgotModal" class="modal-overlay" @click="closeForgotModal">
      <div class="forgot-modal" @click.stop>
        <div class="modal-header">
          <h3>بازیابی رمز عبور</h3>
          <button class="close-modal" @click="closeForgotModal">
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <p>لطفاً ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود.</p>
          <div class="modal-input">
            <input type="email" placeholder="ایمیل@example.com" v-model="recoveryEmail">
            <button class="send-recovery" @click="sendRecoveryEmail">ارسال لینک بازیابی</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'
import { getApiErrorMessage } from '@/api/error'
export default {
  name: 'AdminLogin',

  data() {
    return {
      isDarkMode: true,
      showPassword: false,
      isLoading: false,
      showForgotModal: false,
      recoveryEmail: '',
      errorMessage: '',
      form: {
        username: '',
        password: '',
        rememberMe: false
      }
    }
  },

  mounted() {
    // theme
    const savedTheme = localStorage.getItem('cafehojre-theme')
    if (savedTheme === 'dark') {
      this.isDarkMode = true
    }

    // remember username
    const savedUser = localStorage.getItem('cafehojre-username')
    if (savedUser) {
      this.form.username = savedUser
      this.form.rememberMe = true
    }

    this.animateTitle()
  },

  methods: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem(
          'cafehojre-theme',
          this.isDarkMode ? 'dark' : 'light'
      )
    },

    togglePasswordVisibility() {
      this.showPassword = !this.showPassword
    },

    highlightInput(fieldId) {
      const input = document.getElementById(fieldId)
      if (input) {
        input.parentElement.classList.add('focused')
      }
    },

    removeHighlight(fieldId) {
      const input = document.getElementById(fieldId)
      if (input) {
        input.parentElement.classList.remove('focused')
      }
    },

    animateTitle() {
      const title = document.querySelector('.subtitle')
      if (!title) return

      title.style.opacity = '0'
      setTimeout(() => {
        title.style.transition = 'opacity 1s ease'
        title.style.opacity = '1'
      }, 500)
    },

    // 🔐 LOGIN REAL
    async handleLogin() {
      if (!this.form.username.trim() || !this.form.password.trim()) {
        this.showError('لطفاً نام کاربری و رمز عبور را وارد کنید')
        return
      }

      const authStore = useAuthStore()
      const router = useRouter()
      this.isLoading = true
      this.errorMessage = ''

      try {
        // remember me
        if (this.form.rememberMe) {
          localStorage.setItem('cafehojre-username', this.form.username)
        } else {
          localStorage.removeItem('cafehojre-username')
        }

        // 🔥 API واقعی
        await authStore.login({
          phone_number: this.form.username,
          password: this.form.password
        })
        this.$router.push('/dashboard')
        // ✅ موفق
        this.$emit('login-success', {
          user: authStore.user,
          timestamp: new Date().toISOString()
        })
      } catch (err) {
        this.showError(getApiErrorMessage(err, 'ورود به سیستم انجام نشد.'))
      } finally {
        this.isLoading = false
      }
    },

    // ❌ مهمان (اختیاری – پیشنهاد میشه حذف بشه)
    enterAsGuest() {
      this.showError(
          'ورود به صورت مهمان غیرفعال است',
          'info'
      )
    },

    showForgotPassword() {
      this.showForgotModal = true
    },

    closeForgotModal() {
      this.showForgotModal = false
      this.recoveryEmail = ''
    },

    sendRecoveryEmail() {
      if (!this.recoveryEmail || !this.recoveryEmail.includes('@')) {
        this.showError('لطفاً یک ایمیل معتبر وارد کنید')
        return
      }

      // این بخش هنوز mock هست (بک‌اند نداره)
      this.showError(
          `لینک بازیابی به ${this.recoveryEmail} ارسال شد`,
          'success'
      )

      setTimeout(() => {
        this.closeForgotModal()
      }, 2000)
    },

    showError(message) {
      this.errorMessage = message

      setTimeout(() => {
        this.errorMessage = ''
      }, 5000)
    }
  }
}
</script>

<style scoped>
/* متغیرهای رنگ */
:root {
  /* حالت روز */
  --primary: #8B4513;
  --primary-light: #A0522D;
  --primary-dark: #5D2906;
  --secondary: #D2691E;
  --accent: #F4A460;
  --light: #F5DEB3;
  --lighter: #FFF8DC;
  --text: #5D4037;
  --text-light: #795548;
  --background: #FFF8F0;
  --card-bg: #FFFFFF;
  --input-bg: #F9F9F9;
  --border: #E0C9A6;
  --shadow: 0 10px 30px rgba(139, 69, 19, 0.1);
  --error: #F44336;
  --success: #4CAF50;
  --info: #2196F3;
}

.dark-mode {
  /* حالت شب */
  --primary: #D7CCC8;
  --primary-light: #EFEBE9;
  --primary-dark: #A1887F;
  --secondary: #BCAAA4;
  --accent: #8D6E63;
  --light: #5D4037;
  --lighter: #3E2723;
  --text: #EFEBE9;
  --text-light: #D7CCC8;
  --background: #1E1E1E;
  --card-bg: #2E2019;
  --input-bg: #3E2723;
  --border: #5D4037;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  --error: #EF5350;
  --success: #66BB6A;
  --info: #42A5F5;
}

/* استایل‌های اصلی */
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: var(--background);
  background-image:
      radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(210, 105, 30, 0.05) 0%, transparent 50%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.dark-mode .login-container {
  background-image:
      radial-gradient(circle at 20% 80%, rgba(215, 204, 200, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(188, 170, 164, 0.05) 0%, transparent 50%);
}

/* دکمه تغییر تم */
.theme-toggle {
  position: absolute;
  top: 30px;
  left: 30px;
  width: 50px;
  height: 50px;
  background: var(--card-bg);
  border: 2px solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: var(--shadow);
}

.theme-toggle:hover {
  transform: rotate(30deg) scale(1.1);
  border-color: var(--primary);
}

.theme-icon svg {
  width: 24px;
  height: 24px;
  fill: var(--primary);
}

/* عناصر قهوه */
.coffee-elements {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.coffee-cup {
  position: absolute;
  top: 15%;
  right: 15%;
  width: 100px;
  height: 80px;
  background: var(--light);
  border-radius: 0 0 50px 50px;
  box-shadow:
      inset 0 0 0 10px var(--primary),
      0 5px 15px rgba(0, 0, 0, 0.2);
  transform: rotate(15deg);
}

.coffee-cup.dark {
  background: var(--light);
  box-shadow:
      inset 0 0 0 10px var(--primary-dark),
      0 5px 15px rgba(0, 0, 0, 0.4);
}

.cup-handle {
  position: absolute;
  left: -30px;
  top: 20px;
  width: 40px;
  height: 40px;
  border: 10px solid var(--primary);
  border-radius: 50%;
  border-left-color: transparent;
  border-bottom-color: transparent;
}

.coffee-cup.dark .cup-handle {
  border-color: var(--primary-dark);
  border-left-color: transparent;
  border-bottom-color: transparent;
}

.coffee-liquid {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 20px;
  background: var(--primary-dark);
  border-radius: 0 0 40px 40px;
}

.coffee-foam {
  position: absolute;
  top: 5px;
  left: 15px;
  right: 15px;
  height: 10px;
  background: var(--lighter);
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* دانه‌های قهوه */
.coffee-bean {
  position: absolute;
  width: 25px;
  height: 15px;
  background: var(--primary-dark);
  border-radius: 50%;
  transform: rotate(45deg);
  opacity: 0.8;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.coffee-bean.dark {
  background: var(--primary);
}

.bean1 {
  top: 25%;
  left: 10%;
  animation: float 8s infinite ease-in-out;
}

.bean2 {
  top: 70%;
  left: 15%;
  animation: float 10s infinite ease-in-out 1s;
}

.bean3 {
  top: 40%;
  left: 85%;
  animation: float 9s infinite ease-in-out 2s;
}

.bean4 {
  top: 75%;
  left: 80%;
  animation: float 7s infinite ease-in-out 3s;
}

/* بخار قهوه */
.steam {
  position: absolute;
  width: 10px;
  height: 50px;
  background: linear-gradient(to top, transparent, rgba(255, 255, 255, 0.8));
  border-radius: 5px;
  top: 5%;
  right: 18%;
  transform: translateX(-50%);
}

.dark-mode .steam {
  background: linear-gradient(to top, transparent, rgba(255, 255, 255, 0.3));
}

.steam1 {
  animation: steam 3s infinite ease-in-out;
}

.steam2 {
  right: 20%;
  animation: steam 3s infinite ease-in-out 0.5s;
}

.steam3 {
  right: 16%;
  animation: steam 3s infinite ease-in-out 1s;
}

/* کارت لاگین */
.login-card {
  background: var(--card-bg);
  width: 100%;
  max-width: 480px;
  border-radius: 24px;
  padding: 50px 40px;
  box-shadow: var(--shadow);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  border: 1px solid var(--border);
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(139, 69, 19, 0.15);
}

.dark-mode .login-card:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* هدر */
.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.logo-icon svg {
  width: 40px;
  height: 40px;
  fill: var(--primary);
}

.logo h1 {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: var(--text-light);
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
}

/* فرم */
.login-form {
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 28px;
}

.input-group label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 500;
}

.input-icon svg {
  width: 18px;
  height: 18px;
  fill: var(--primary);
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 18px 20px 18px 50px;
  font-size: 1rem;
  background: var(--input-bg);
  border: 2px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  transition: all 0.3s ease;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
}

.dark-mode .input-wrapper input:focus {
  box-shadow: 0 0 0 3px rgba(215, 204, 200, 0.1);
}

.input-wrapper.focused input {
  border-color: var(--primary);
}

.input-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary);
  transition: width 0.3s ease;
}

.input-wrapper.focused .input-decoration {
  width: 100%;
}

.password-toggle {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.password-toggle svg {
  width: 20px;
  height: 20px;
  fill: var(--text-light);
  transition: fill 0.3s ease;
}

.password-toggle:hover svg {
  fill: var(--primary);
}

/* گزینه‌های فرم */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: var(--text);
  font-size: 0.9rem;
  user-select: none;
}

.checkbox-input {
  display: none;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox-input:checked + .custom-checkbox {
  background: var(--primary);
  border-color: var(--primary);
}

.custom-checkbox:after {
  content: '';
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.checkbox-input:checked + .custom-checkbox:after {
  opacity: 1;
}

.forgot-password {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: var(--primary-light);
  text-decoration: underline;
}

/* دکمه ورود */
.submit-btn {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 25px;
  position: relative;
  overflow: hidden;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.submit-btn.loading {
  background: linear-gradient(135deg, var(--primary-dark), var(--primary));
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-icon svg {
  width: 20px;
  height: 20px;
  fill: white;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* ورود مهمان */
.guest-login {
  text-align: center;
}

.divider {
  display: flex;
  align-items: center;
  margin: 25px 0;
  color: var(--text-light);
  font-size: 0.9rem;
}

.divider:before,
.divider:after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.divider span {
  padding: 0 15px;
}

.guest-btn {
  width: 100%;
  padding: 16px;
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.guest-btn:hover {
  background: rgba(139, 69, 19, 0.05);
  border-color: var(--primary);
}

.guest-icon svg {
  width: 20px;
  height: 20px;
  fill: var(--primary);
}

/* فوتر */
.footer {
  text-align: center;
  padding-top: 25px;
  border-top: 1px solid var(--border);
}

.copyright {
  color: var(--text-light);
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.security-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-light);
  font-size: 0.8rem;
}

.security-icon svg {
  width: 14px;
  height: 14px;
  fill: var(--success);
}

/* اعلان خطا */
.error-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: var(--error);
  color: white;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(244, 67, 54, 0.3);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 1000;
  max-width: 400px;
}

.error-notification.show {
  transform: translateY(0);
  opacity: 1;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.error-icon svg {
  width: 20px;
  height: 20px;
  fill: white;
}

.error-text {
  flex: 1;
  font-size: 0.95rem;
}

.close-error {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.close-error:hover {
  opacity: 1;
}

.close-error svg {
  width: 20px;
  height: 20px;
  fill: white;
}

/* مودال فراموشی رمز */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.forgot-modal {
  background: var(--card-bg);
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  border: 1px solid var(--border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.2rem;
}

.close-modal {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
}

.close-modal svg {
  width: 24px;
  height: 24px;
  fill: var(--text-light);
  transition: fill 0.3s ease;
}

.close-modal:hover svg {
  fill: var(--primary);
}

.modal-content {
  padding: 20px;
}

.modal-content p {
  color: var(--text-light);
  margin-bottom: 20px;
  line-height: 1.6;
}

.modal-input {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-input input {
  padding: 15px;
  font-size: 1rem;
  background: var(--input-bg);
  border: 2px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  transition: all 0.3s ease;
}

.modal-input input:focus {
  outline: none;
  border-color: var(--primary);
}

.send-recovery {
  padding: 15px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-recovery:hover {
  background: var(--primary-light);
}

/* انیمیشن‌ها */
@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  50% {
    transform: translateY(-20px) rotate(45deg);
  }
}

@keyframes steam {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-50px) scale(1.2);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* رسپانسیو */
@media (max-width: 768px) {
  .login-card {
    padding: 40px 25px;
    margin: 20px;
  }

  .theme-toggle {
    top: 20px;
    left: 20px;
    width: 45px;
    height: 45px;
  }

  .coffee-cup {
    width: 70px;
    height: 56px;
    right: 10%;
    top: 10%;
  }

  .logo h1 {
    font-size: 1.8rem;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .error-notification {
    right: 20px;
    left: 20px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  .logo {
    flex-direction: column;
    gap: 10px;
  }

  .input-wrapper input {
    padding: 15px 15px 15px 45px;
  }

  .password-toggle {
    left: 10px;
  }
}
</style>
