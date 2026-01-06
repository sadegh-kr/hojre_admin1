<template>
  <header class="main-header" :class="{'header-dark': isDarkMode}">
    <div class="header-container">
      <!-- لوگو و نام برند -->
      <div class="brand-section">
        <div class="logo">
          <i class="icon-coffee"></i>
          <span>کافه حجره</span>
        </div>
        <div class="slogan">تجربه‌ای دلنشین از طعم‌های اصیل</div>
      </div>

      <!-- بخش ناوبری و کنترل‌ها -->
      <div class="header-controls">
        <!-- جستجو -->
        <div class="search-box">
          <input
              type="text"
              :placeholder="isDarkMode ? 'جستجو در منو...' : 'به دنبال چه می‌گردید؟'"
              class="search-input"
          />
          <button class="search-btn">
            <i class="icon-search"></i>
          </button>
        </div>

        <!-- دکمه تغییر تم -->
        <button class="theme-toggle" @click="$emit('toggle-theme')" :title="isDarkMode ? 'حالت روشن' : 'حالت تاریک'">
          <i :class="isDarkMode ? 'icon-sun' : 'icon-moon'"></i>
          <span>{{ isDarkMode ? 'روشن' : 'تاریک' }}</span>
        </button>

        <!-- اطلاع‌رسانی و پروفایل -->
        <div class="user-section">
          <button class="notification-btn" title="اطلاع‌رسانی‌ها">
            <i class="icon-bell"></i>
            <span class="notification-badge">۳</span>
          </button>

          <div class="user-profile">
            <div class="avatar">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=hojre" alt="پروفایل کاربر">
            </div>
            <div class="user-info">
              <span class="user-name">محمدرضا</span>
              <span class="user-role">مدیر کافه</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: "HeaderComponent",
  props: {
    isDarkMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-theme']
}
</script>

<style scoped>
.main-header {
  grid-area: header;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: var(--text-light);
  padding: 0 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 100;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  max-width: 1400px;
  margin: 0 auto;
}

.brand-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.logo i {
  font-size: 2.2rem;
  margin-left: 10px;
  color: var(--secondary-color);
}

.slogan {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 300;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 25px;
}

.search-box {
  display: flex;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: var(--transition);
}

.search-box:focus-within {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: var(--secondary-color);
}

.search-input {
  background: transparent;
  border: none;
  padding: 10px 20px;
  width: 250px;
  color: var(--text-light);
  font-size: 0.95rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-input:focus {
  outline: none;
}

.search-btn {
  background-color: var(--secondary-color);
  border: none;
  color: var(--text-dark);
  width: 45px;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.search-btn:hover {
  background-color: var(--accent-color);
}

.theme-toggle {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  color: var(--text-light);
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition);
}

.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-btn {
  position: relative;
  background: transparent;
  border: none;
  color: var(--text-light);
  font-size: 1.3rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: var(--transition);
}

.notification-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #ff4757;
  color: white;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 50px;
  transition: var(--transition);
}

.user-profile:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--secondary-color);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-role {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* آیکون‌ها (شبیه‌سازی) */
.icon-coffee::before { content: "☕"; }
.icon-search::before { content: "🔍"; }
.icon-bell::before { content: "🔔"; }
.icon-sun::before { content: "☀️"; }
.icon-moon::before { content: "🌙"; }

/* رسپانسیو */
@media (max-width: 1200px) {
  .search-input {
    width: 200px;
  }
}

@media (max-width: 992px) {
  .header-container {
    flex-direction: column;
    height: auto;
    padding: 15px 0;
  }

  .brand-section {
    align-items: center;
    margin-bottom: 15px;
  }

  .header-controls {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .search-box {
    order: 3;
    width: 100%;
    margin-top: 15px;
  }

  .search-input {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .main-header {
    padding: 0 15px;
  }

  .header-controls {
    gap: 15px;
  }

  .slogan {
    display: none;
  }

  .user-info {
    display: none;
  }
}
</style>