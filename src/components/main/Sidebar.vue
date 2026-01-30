<template>
  <aside
      class="main-sidebar bg-white"
      :class="{

      'sidebar-collapsed': isCollapsed,
      'sidebar-mobile-open': isMobileOpen,
      'dark-sidebar': isDarkMode
    }"
  >
    <!-- هدر سایدبار -->
    <div class="sidebar-header">
      <!-- دکمه جمع شدن -->
      <button class="collapse-toggle" @click="toggleCollapse" :title="isCollapsed ? 'باز کردن' : 'بستن'">
        <div class="toggle-icon">
          <i :class="isCollapsed ? 'icon-chevron-right' : 'icon-chevron-left'"></i>
        </div>
      </button>

      <!-- دکمه بستن موبایل -->
      <button v-if="isMobileOpen" class="mobile-close-btn" @click="$emit('close-mobile-sidebar')">
        <i class="icon-close"></i>
      </button>
    </div>

    <!-- پروفایل کاربر -->
    <div class="sidebar-profile" :class="{'collapsed': isCollapsed}">
      <div class="profile-avatar-wrapper">
        <div class="profile-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=hojre&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9"
               alt="لیست رستوان ها">
          <div class="avatar-status online"></div>
        </div>
        <div class="profile-level" v-if="!isCollapsed">
          <span class="level-badge">PRO</span>
        </div>
      </div>

      <div class="profile-info" v-if="!isCollapsed">
        <h3 class="profile-name">{{ userName }}</h3>
        <p class="profile-role">مدیر ارشد کافه</p>

        
      </div>
    </div>

    <!-- منوی اصلی -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="section-label" v-if="!isCollapsed">منوی اصلی</div>
        <ul class="nav-menu">
          <li v-for="item in mainMenu" :key="item.id">
            <router-link
                :to="item.path"
                class="nav-item"
                :class="{
                'active': isActive(item.path),
                'has-notification': item.notification
              }"
                @click="$emit('close-mobile-sidebar')"
            >
              <div class="nav-icon-wrapper">
                <i :class="item.icon"></i>
                <span v-if="item.notification" class="nav-notification"></span>
              </div>

              <div class="nav-content" v-if="!isCollapsed">
                <span class="nav-title">{{ item.title }}</span>
                <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
              </div>

              <i v-if="!isCollapsed && item.hasSubmenu" class="nav-arrow icon-chevron-left"></i>
            </router-link>
          </li>
        </ul>
      </div>

    </nav>


    <!-- حالت حداقل -->
    <div class="sidebar-minimal" v-if="isCollapsed">
      <div class="minimal-time">
        <span class="time-hour">{{ currentTime.hours }}</span>
        <span class="time-separator">:</span>
        <span class="time-minute">{{ currentTime.minutes }}</span>
      </div>
    </div>
  </aside>
</template>

<script>
import { useAuthStore } from '@/store/auth' // اضافه کردن این خط
import { mapActions } from 'pinia'

export default {
  name: "SidebarComponent",
  props: {
    isMobileOpen: {
      type: Boolean,
      default: false
    },
    isDarkMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isCollapsed: false,
      currentTime: {
        hours: '14',
        minutes: '30'
      },
      authStore: null, // اینجا null قرار بده
      mainMenu: [
        { id: 1, title: "داشبورد", path: "/dashboard", icon: "icon-dashboard", badge: "" },
        { id: 2, title: "لیست رستوان ها", path: "/dashboard/restaurant_list", icon: "icon-menu", notification: true },
        { id: 3, title: "مشتریان", path: "/dashboard/user-list", icon: "icon-menu", badge: "جدید", hasSubmenu: true },
        // { id: 4, title: "سفارش‌ها", path: "/dashboard/orders", icon: "icon-orders", badge: "۵" },
        // { id: 5, title: "مشتریان", path: "/dashboard/customers", icon: "icon-users", badge: "۳" },
        // { id: 6, title: "گزارش‌ها", path: "/dashboard/reports", icon: "icon-chart", hasSubmenu: true },
        // { id: 7, title: "انبار", path: "/dashboard/inventory", icon: "icon-box" }
      ],
      // managementMenu: [
      //   { id: 8, title: "کارمندان", path: "/dashboard/employees", icon: "icon-team", tag: "۳" },
      //   { id: 9, title: "مالی", path: "/dashboard/finance", icon: "icon-wallet", tag: "جدید", tagClass: "tag-new" },
      //   { id: 10, title: "تنظیمات", path: "/dashboard/settings", icon: "icon-settings" },
      //   { id: 11, title: "پشتیبانی", path: "/dashboard/support", icon: "icon-help", tag: "۲", tagClass: "tag-support" }
      // ]
    }
  },
  computed: {
    // محاسبه نام کاربر از استور
    userName() {
      if (!this.authStore?.user) return 'کاربر'
      return this.authStore.user.full_name ||
          this.authStore.user.phone_number ||
          'کاربر'
    },

    // محاسبه نقش کاربر
    userRole() {
      if (!this.authStore?.user) return 'کاربر سیستم'
      return this.authStore.user.role || 'کاربر سیستم'
    },

    // محاسبه آواتار کاربر
    userAvatar() {
      if (!this.authStore?.user) {
        return 'https://api.dicebear.com/7.x/avataaars/svg?seed=user&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9'
      }
      return this.authStore.user.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.authStore.user.username || 'user'}&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9`
    },

    // آخرین زمان لاگین
    lastLoginTime() {
      const storedTime = localStorage.getItem('last_login')
      return storedTime || '۱۴:۳۰'
    },

    // آیا کاربر آنلاین است؟
    isUserOnline() {
      return !!this.authStore?.accessToken
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('sidebar-collapsed', this.isCollapsed);
    },

    isActive(path) {
      return this.$route.path === path;
    },

    handleLogout() {
      this.$emit('close-mobile-sidebar');

      if (this.authStore) {
        this.authStore.logout(); // فراخوانی متد logout از استور
      }

      // ریدایرکت به صفحه لاگین
      this.$router.push('/login');
    },

    updateTime() {
      const now = new Date();
      this.currentTime.hours = now.getHours().toString().padStart(2, '0');
      this.currentTime.minutes = now.getMinutes().toString().padStart(2, '0');
    }
  },

  created() {
    // مقداردهی اولیه authStore در created
    this.authStore = useAuthStore();
  },

  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 60000); // Update every minute
  },

  emits: ['sidebar-collapsed', 'close-mobile-sidebar']
}
</script>
<style scoped>
.main-sidebar {
  grid-area: sidebar;
  background: white;
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 4px 0 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-left: 1px solid var(--sidebar-border);
  width: 280px;
}

/* هدر سایدبار */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 15px;
  border-bottom: 1px solid var(--sidebar-border);
  position: relative;
}

.collapse-toggle {
  background: var(--sidebar-btn-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 12px;
  color: var(--sidebar-icon);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: absolute;
  right: 20px;
  top: 20px;
}

.collapse-toggle:hover {
  background: var(--sidebar-btn-hover);
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: auto;
}

.sidebar-logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 10px;
  padding: 6px;
}

.sidebar-logo-icon svg {
  width: 100%;
  height: 100%;
}

.sidebar-logo-text {
  display: flex;
  flex-direction: column;
}

.logo-main {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--sidebar-text);
  line-height: 1;
}

.logo-sub {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--sidebar-text-secondary);
  margin-top: 2px;
}

.mobile-close-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--sidebar-text);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: var(--transition);
}

.mobile-close-btn:hover {
  background: var(--sidebar-btn-hover);
}

/* پروفایل کاربر */
.sidebar-profile {
  padding: 25px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid var(--sidebar-border);
  transition: var(--transition);
}

.profile-avatar-wrapper {
  position: relative;
  margin-bottom: 15px;
}

.profile-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--sidebar-accent);
  position: relative;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-status {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--sidebar-bg);
}

.avatar-status.online {
  background: #2ecc71;
}

.profile-level {
  position: absolute;
  top: -5px;
  left: -5px;
}

.level-badge {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #000;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.profile-info {
  text-align: center;
  width: 100%;
}

.profile-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
  color: var(--sidebar-text);
}

.profile-role {
  font-size: 0.85rem;
  color: var(--sidebar-text-secondary);
  margin-bottom: 15px;
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background: var(--sidebar-btn-bg);
  border-radius: 12px;
  padding: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--sidebar-accent);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--sidebar-text-secondary);
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 20px;
  background: var(--sidebar-border);
}

/* آمار سریع */
.sidebar-quick-stats {
  padding: 20px;
  border-bottom: 1px solid var(--sidebar-border);
}

.quick-stats-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  color: var(--sidebar-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.stats-icon {
  color: var(--sidebar-accent);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-card {
  background: var(--sidebar-card-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--sidebar-accent);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.stat-icon.orders {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.stat-icon.customers {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.stat-icon.rating {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  color: white;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--sidebar-text);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--sidebar-text-secondary);
  margin-top: 2px;
}

/* منوی اصلی */
.sidebar-nav {

  flex: 1;
  padding: 20px 0;
  /* overflow-y: auto; */
}

.nav-section {
  margin-bottom: 25px;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--sidebar-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding: 0 20px;
}

.nav-menu {
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: var(--sidebar-text);
  text-decoration: none;
  transition: var(--transition);
  position: relative;
  margin: 4px 0;
}

.nav-item:hover {
  background: var(--sidebar-btn-hover);
  padding-right: 25px;
}

.nav-item.active {
  background: var(--sidebar-active-bg);
  border-right: 3px solid var(--sidebar-accent);
  color: var(--sidebar-accent);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: var(--sidebar-accent);
  border-radius: 0 3px 3px 0;
}

.nav-icon-wrapper {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--sidebar-btn-bg);
  margin-left: 12px;
}

.nav-item.active .nav-icon-wrapper {
  background: var(--sidebar-active-icon);
}

.nav-icon-wrapper i {
  font-size: 1.1rem;
}

.nav-notification {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 8px;
  height: 8px;
  background: #ff4757;
  border-radius: 50%;
  border: 2px solid var(--sidebar-bg);
}

.nav-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-title {
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-badge {
  background: var(--sidebar-accent);
  color: var(--sidebar-bg);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 24px;
  text-align: center;
}

.nav-tag {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 500;
}

.tag-new {
  background: #ff4757;
  color: white;
}

.tag-support {
  background: #3498db;
  color: white;
}

.nav-arrow {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-right: 5px;
}

/* پیشنهاد ویژه */
.sidebar-promo {
  margin: 20px;
  padding: 15px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 12px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.promo-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.promo-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.promo-text h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 3px;
}

.promo-text p {
  font-size: 0.8rem;
  opacity: 0.9;
}

.promo-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 8px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: var(--transition);
}

.promo-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* بخش پایینی */
.sidebar-footer {
  margin-bottom: 50px;
  padding: 20px;
  border-top: 1px solid var(--sidebar-border);
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #2ecc71;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.last-login {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--sidebar-text-secondary);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background: var(--sidebar-btn-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 10px;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.logout-btn:hover {
  background: var(--sidebar-btn-hover);
  border-color: #ff4757;
  color: #ff4757;
}

/* حالت جمع شده */
.footer-collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.logout-btn-collapsed {
  background: var(--sidebar-btn-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: var(--transition);
}

.logout-btn-collapsed:hover {
  background: var(--sidebar-btn-hover);
  color: #ff4757;
  transform: rotate(15deg);
}

.quick-actions {
  display: flex;
  gap: 10px;
}

.quick-action {
  background: var(--sidebar-btn-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: var(--transition);
}

.quick-action:hover {
  background: var(--sidebar-btn-hover);
  transform: scale(1.1);
}

/* حالت حداقل */
.sidebar-minimal {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.minimal-time {
  display: flex;
  align-items: baseline;
  background: var(--sidebar-btn-bg);
  border-radius: 10px;
  padding: 8px 12px;
}

.time-hour, .time-minute {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--sidebar-accent);
}

.time-separator {
  font-size: 1rem;
  color: var(--sidebar-text-secondary);
  margin: 0 2px;
  animation: blink 1s infinite;
}

/* حالت جمع شده */
.sidebar-collapsed {
  width: 80px;
}

.sidebar-collapsed .sidebar-logo,
.sidebar-collapsed .profile-info,
.sidebar-collapsed .sidebar-quick-stats,
.sidebar-collapsed .section-label,
.sidebar-collapsed .nav-content,
.sidebar-collapsed .nav-arrow,
.sidebar-collapsed .sidebar-promo,
.sidebar-collapsed .footer-content,
.sidebar-collapsed .sidebar-minimal {
  display: none;
}

.sidebar-collapsed .sidebar-profile {
  padding: 25px 10px;
}

.sidebar-collapsed .profile-avatar {
  width: 50px;
  height: 50px;
}

.sidebar-collapsed .collapse-toggle {
  position: static;
  margin: 0 auto;
}

.sidebar-collapsed .collapse-toggle:hover {
  transform: translateX(3px);
}

.sidebar-collapsed .nav-item {
  padding: 12px;
  justify-content: center;
}

.sidebar-collapsed .nav-icon-wrapper {
  margin-left: 0;
}

/* رسپانسیو */
@media (max-width: 992px) {
  .main-sidebar {
    position: fixed;
    top: 0;
    right: -300px;
    height: 100vh;
    z-index: 1001;
    width: 280px;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .main-sidebar.sidebar-mobile-open {
    right: 0;
  }

  .mobile-close-btn {
    display: block;
  }

  .collapse-toggle {
    display: none;
  }

  .sidebar-collapsed {
    width: 280px;
  }

  .sidebar-collapsed .sidebar-logo,
  .sidebar-collapsed .profile-info,
  .sidebar-collapsed .sidebar-quick-stats,
  .sidebar-collapsed .section-label,
  .sidebar-collapsed .nav-content,
  .sidebar-collapsed .nav-arrow,
  .sidebar-collapsed .sidebar-promo,
  .sidebar-collapsed .footer-content {
    display: block;
  }

  .sidebar-collapsed .sidebar-profile {
    padding: 25px 20px;
  }

  .sidebar-collapsed .profile-avatar {
    width: 90px;
    height: 90px;
  }

  .sidebar-collapsed .nav-item {
    padding: 12px 20px;
    justify-content: flex-start;
  }

  .sidebar-collapsed .nav-icon-wrapper {
    margin-left: 12px;
  }

  .sidebar-collapsed .sidebar-minimal {
    display: none;
  }
}

/* اسکرول‌بار */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--sidebar-accent);
  border-radius: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* انیمیشن‌ها */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* متغیرهای سایدبار */
:root {
  --sidebar-bg: #ffffff;
  --sidebar-bg-secondary: #f8f9fa;
  --sidebar-text: #2c3e50;
  --sidebar-text-secondary: #7f8c8d;
  --sidebar-border: #eaeaea;
  --sidebar-accent: #8b4513;
  --sidebar-btn-bg: #f5f5f5;
  --sidebar-btn-hover: #eaeaea;
  --sidebar-active-bg: rgba(139, 69, 19, 0.1);
  --sidebar-active-icon: rgba(139, 69, 19, 0.2);
  --sidebar-card-bg: #ffffff;
  --sidebar-icon: #8b4513;
  --sidebar-icon-color: #8b4513;
}

[data-theme="dark"] {
  --sidebar-bg: #1a1a1a;
  --sidebar-bg-secondary: #2d2d2d;
  --sidebar-text: #ffffff;
  --sidebar-text-secondary: #b0b0b0;
  --sidebar-border: #404040;
  --sidebar-accent: #d4a574;
  --sidebar-btn-bg: #2d2d2d;
  --sidebar-btn-hover: #404040;
  --sidebar-active-bg: rgba(212, 165, 116, 0.15);
  --sidebar-active-icon: rgba(212, 165, 116, 0.25);
  --sidebar-card-bg: #2d2d2d;
  --sidebar-icon: #d4a574;
  --sidebar-icon-color: #d4a574;
}

/* آیکون‌ها */
.icon-dashboard::before { content: "📊"; }
.icon-profile::before { content: "👤"; }
.icon-menu::before { content: "📋"; }
.icon-orders::before { content: "🛒"; }
.icon-chart::before { content: "📈"; }
.icon-users::before { content: "👥"; }
.icon-box::before { content: "📦"; }
.icon-team::before { content: "👨‍👩‍👧‍👦"; }
.icon-wallet::before { content: "💰"; }
.icon-settings::before { content: "⚙️"; }
.icon-help::before { content: "❓"; }
.icon-logout::before { content: "🚪"; }
.icon-chevron-left::before { content: "‹"; }
.icon-chevron-right::before { content: "›"; }
.icon-close::before { content: "✕"; }
.icon-trend::before { content: "📈"; }
.icon-cash::before { content: "💵"; }
.icon-coffee::before { content: "☕"; }
.icon-star::before { content: "⭐"; }
.icon-gift::before { content: "🎁"; }
.icon-arrow-left::before { content: "←"; }
.icon-clock::before { content: "🕒"; }
</style>