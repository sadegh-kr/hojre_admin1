<template>
  <header class="main-header" :class="{'header-dark': isDarkMode}">
    <div class="header-container">
      <!-- لوگو و نام برند -->
      <div class="brand-section">
        <div class="logo-container">
          <!-- لوگوی مینیمال و شیک -->
          <div class="logo-symbol">
            <svg class="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <!-- شکل قهوه‌گیر سنتی ایرانی -->
              <path d="M50,20 C60,15 75,18 80,30 C85,42 80,60 70,70 C60,80 40,80 30,70 C20,60 15,42 20,30 C25,18 40,15 50,20 Z"
                    :fill="isDarkMode ? '#c19a6b' : '#8b4513'"/>
              <!-- بخار قهوه -->
              <path d="M50,10 Q55,5 60,10 Q65,15 60,20 Q55,25 50,20 Q45,15 50,10 Z"
                    :fill="isDarkMode ? '#f9f5f0' : '#fff'"/>
              <path d="M40,8 Q45,3 50,8 Q55,13 50,18 Q45,23 40,18 Q35,13 40,8 Z"
                    :fill="isDarkMode ? '#f9f5f0' : '#fff'"/>
              <path d="M60,8 Q65,3 70,8 Q75,13 70,18 Q65,23 60,18 Q55,13 60,8 Z"
                    :fill="isDarkMode ? '#f9f5f0' : '#fff'"/>
            </svg>
          </div>

          <div class="logo-text">
            <h1 class="brand-name">کافه‌حجره</h1>
            <div class="brand-subtitle">KAFE HOJRE</div>
          </div>
        </div>

        <div class="slogan-line">
          <span class="slogan-icon">•</span>
          <span class="slogan-text">طعم‌های اصیل، لحظه‌های به یادماندنی</span>
          <span class="slogan-icon">•</span>
        </div>
      </div>

      <!-- دکمه همبرگر برای موبایل -->
      <button class="mobile-menu-btn" @click="$emit('toggle-sidebar')" aria-label="منو">
        <div class="hamburger-icon" :class="{'active': isMobileMenuActive}">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <!-- بخش ناوبری و کنترل‌ها -->
      <div class="header-controls">
        <!-- نویگیشن سریع -->
        <nav class="quick-nav">
          <button class="nav-btn" title="سفارش سریع">
            <i class="nav-icon icon-flash"></i>
            <span class="nav-label">سفارش سریع</span>
          </button>

          <button class="nav-btn" title="منوی ویژه">
            <i class="nav-icon icon-star"></i>
            <span class="nav-label">منوی ویژه</span>
          </button>
        </nav>

        <!-- نوار وضعیت -->
        <div class="status-bar">
          <div class="status-item">
            <div class="status-label">وضعیت کافه</div>
            <div class="status-value status-open">
              <span class="status-dot"></span>
              باز
            </div>
          </div>

          <div class="status-divider">|</div>

          <div class="status-item">
            <div class="status-label">سفارش فعال</div>
            <div class="status-value">۸</div>
          </div>
        </div>

        <!-- کنترل‌های اصلی -->
        <div class="main-controls">
          <!-- جستجو -->
          <div class="search-wrapper">
            <div class="search-box" :class="{'focused': isSearchFocused}">
              <i class="search-icon icon-search"></i>
              <input
                  type="text"
                  placeholder="جستجوی منو، نوشیدنی، غذا..."
                  class="search-input"
                  @focus="isSearchFocused = true"
                  @blur="isSearchFocused = false"
              />
              <button class="search-clear" title="پاک کردن">
                <i class="icon-clear"></i>
              </button>
            </div>
          </div>

          <!-- دکمه تغییر تم -->
          <button class="theme-toggle" @click="$emit('toggle-theme')"
                  :title="isDarkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'">
            <div class="theme-toggle-inner">
              <i class="theme-icon" :class="isDarkMode ? 'icon-sun' : 'icon-moon'"></i>
            </div>
          </button>

          <!-- اطلاع‌رسانی -->
          <div class="notification-wrapper">
            <button class="notification-btn" title="اعلان‌ها">
              <i class="notification-icon icon-bell"></i>
              <span class="notification-badge">۳</span>
            </button>

            <!-- پروفایل کاربر -->

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
  data() {
    return {
      isSearchFocused: false,
      isMobileMenuActive: false
    }
  },
  emits: ['toggle-theme', 'toggle-sidebar']
}
</script>

<style scoped>
.main-header {
  grid-area: header;
  background: var(--header-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
  transition: var(--transition);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 30px;
  gap: 30px;
}

/* برند و لوگو */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 220px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
}

.logo-symbol {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-family: 'Vazir', 'IRANSans', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  margin: 0;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 2px;
}

.slogan-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 5px;
  border-top: 1px solid var(--border-light);
  width: 100%;
}

.slogan-icon {
  color: var(--secondary-color);
  font-size: 0.8rem;
}

.slogan-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 400;
  white-space: nowrap;
}

/* کنترل‌های هدر */
.header-controls {
  display: flex;
  align-items: center;
  gap: 30px;
  flex: 1;
  justify-content: flex-end;
}

/* نویگیشن سریع */
.quick-nav {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 50px;
  padding: 8px 16px;
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.nav-btn:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.nav-icon {
  font-size: 1rem;
}

.nav-label {
  font-family: 'Vazir', 'IRANSans', sans-serif;
}

/* نوار وضعیت */
.status-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 8px 15px;
  margin-left: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.status-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-open .status-dot {
  width: 8px;
  height: 8px;
  background: #2ecc71;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-divider {
  color: var(--border-color);
  opacity: 0.5;
}

/* کنترل‌های اصلی */
.main-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: auto;
}

/* جستجو */
.search-wrapper {
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 50px;
  padding: 0 15px;
  width: 280px;
  transition: var(--transition);
}

.search-box.focused {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
  width: 320px;
}

.search-icon {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-left: 8px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 0;
  color: var(--text-color);
  font-size: 0.9rem;
  font-family: 'Vazir', 'IRANSans', sans-serif;
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.search-input:focus {
  outline: none;
}

.search-clear {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: var(--transition);
}

.search-box.focused .search-clear {
  opacity: 1;
}

.search-clear:hover {
  color: var(--text-color);
}

/* تغییر تم */
.theme-toggle {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.theme-toggle:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
  transform: rotate(15deg);
}

.theme-icon {
  font-size: 1.2rem;
  color: var(--text-color);
}

/* اطلاع‌رسانی */
.notification-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
}

.notification-btn {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.notification-btn:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.notification-icon {
  font-size: 1.2rem;
  color: var(--text-color);
}

.notification-badge {
  position: absolute;
  top: -2px;
  left: -2px;
  background: #ff4757;
  color: white;
  font-size: 0.7rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border: 2px solid var(--header-bg);
}

/* پروفایل کاربر */
.user-profile-dropdown {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 50px;
  padding: 4px 4px 4px 15px;
  cursor: pointer;
  transition: var(--transition);
  min-width: 200px;
}

.user-profile-dropdown:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--secondary-color);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-main {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.2;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}

.status-online {
  font-size: 0.7rem;
  color: #2ecc71;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-id {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.profile-dropdown-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  transition: var(--transition);
}

.profile-dropdown-btn:hover {
  color: var(--text-color);
}

/* دکمه همبرگر موبایل */
.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 10px;
  z-index: 1001;
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 24px;
}

.hamburger-icon span {
  height: 2px;
  background: var(--text-color);
  border-radius: 2px;
  transition: var(--transition);
  transform-origin: center;
}

.hamburger-icon span:nth-child(1) {
  width: 100%;
}

.hamburger-icon span:nth-child(2) {
  width: 80%;
  margin-right: auto;
}

.hamburger-icon span:nth-child(3) {
  width: 60%;
  margin-right: auto;
}

.hamburger-icon.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
  width: 100%;
}

.hamburger-icon.active span:nth-child(2) {
  opacity: 0;
  transform: translateX(-10px);
}

.hamburger-icon.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
  width: 100%;
}

/* متغیرهای جدید */
:root {
  --header-bg: rgba(255, 255, 255, 0.95);
  --hover-bg: rgba(139, 69, 19, 0.05);
  --border-light: rgba(139, 69, 19, 0.1);
  --text-secondary: rgba(60, 60, 60, 0.7);
}

[data-theme="dark"] {
  --header-bg: rgba(30, 26, 22, 0.95);
  --hover-bg: rgba(184, 154, 122, 0.1);
  --border-light: rgba(184, 154, 122, 0.2);
  --text-secondary: rgba(255, 255, 255, 0.7);
}

/* انیمیشن‌ها */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* رسپانسیو */
@media (max-width: 1200px) {
  .header-container {
    padding: 0 20px;
    gap: 20px;
  }

  .search-box {
    width: 240px;
  }

  .search-box.focused {
    width: 280px;
  }

  .quick-nav,
  .status-bar {
    display: none;
  }
}

@media (max-width: 992px) {
  .header-container {
    height: 70px;
  }

  .brand-name {
    font-size: 1.4rem;
  }

  .slogan-line {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
    order: -1;
  }

  .brand-section {
    min-width: auto;
    margin-right: auto;
  }

  .header-controls {
    gap: 15px;
  }

  .search-box {
    width: 200px;
  }

  .search-box.focused {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 15px;
  }

  .brand-name {
    font-size: 1.2rem;
  }

  .brand-subtitle {
    font-size: 0.6rem;
  }

  .logo-symbol {
    width: 36px;
    height: 36px;
  }

  .search-box {
    width: 160px;
  }

  .search-box.focused {
    width: 200px;
  }

  .user-profile-dropdown {
    min-width: auto;
    padding: 4px;
  }

  .user-info,
  .profile-dropdown-btn {
    display: none;
  }
}

@media (max-width: 576px) {
  .brand-section {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .logo-text {
    display: none;
  }

  .search-box {
    display: none;
  }

  .search-box.focused {
    display: flex;
    position: absolute;
    top: 100%;
    left: 15px;
    right: 15px;
    width: auto;
    margin-top: 10px;
    z-index: 1000;
  }

  .theme-toggle,
  .notification-btn {
    width: 40px;
    height: 40px;
  }
}

/* آیکون‌های سفارشی */
.icon-flash::before { content: "⚡"; }
.icon-star::before { content: "⭐"; }
.icon-search::before { content: "🔍"; }
.icon-clear::before { content: "✕"; }
.icon-bell::before { content: "🔔"; }
.icon-sun::before { content: "☀️"; }
.icon-moon::before { content: "🌙"; }
.icon-chevron-down::before { content: "⌄"; }
</style>