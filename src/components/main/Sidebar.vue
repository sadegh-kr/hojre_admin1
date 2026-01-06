<template>
  <aside class="main-sidebar" :class="{'sidebar-collapsed': isCollapsed}">
    <!-- دکمه جمع شدن سایدبار -->
    <button class="collapse-toggle" @click="toggleCollapse">
      <i :class="isCollapsed ? 'icon-chevron-left' : 'icon-chevron-right'"></i>
    </button>

    <!-- پروفایل کاربر در سایدبار -->
    <div class="sidebar-profile">
      <div class="profile-avatar">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=hojre" alt="پروفایل کاربر">
      </div>
      <div v-if="!isCollapsed" class="profile-info">
        <h3>محمدرضا</h3>
        <p>مدیر کافه</p>
      </div>
    </div>

    <!-- منوی ناوبری -->
    <nav class="sidebar-nav">
      <ul>
        <li v-for="item in menuItems" :key="item.id">
          <router-link
              :to="item.path"
              class="nav-item"
              :class="{'active': $route.path === item.path}"
          >
            <i :class="item.icon"></i>
            <span v-if="!isCollapsed">{{ item.title }}</span>
            <span v-if="item.badge && !isCollapsed" class="nav-badge">{{ item.badge }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- بخش پایینی سایدبار -->
    <div class="sidebar-footer" v-if="!isCollapsed">
      <div class="sidebar-stats">
        <div class="stat-item">
          <i class="icon-coffee"></i>
          <div>
            <span class="stat-value">۱۲۴</span>
            <span class="stat-label">سفارش امروز</span>
          </div>
        </div>
        <div class="stat-item">
          <i class="icon-wallet"></i>
          <div>
            <span class="stat-value">۳.۲M</span>
            <span class="stat-label">درآمد امروز</span>
          </div>
        </div>
      </div>

      <button class="logout-btn">
        <i class="icon-logout"></i>
        <span>خروج از حساب</span>
      </button>
    </div>
    <div class="sidebar-footer-collapsed" v-else>
      <button class="logout-btn-collapsed" title="خروج">
        <i class="icon-logout"></i>
      </button>
    </div>
  </aside>
</template>

<script>
export default {
  name: "SidebarComponent",
  data() {
    return {
      isCollapsed: false,
      menuItems: [
        { id: 1, title: "داشبورد", path: "/dashboard", icon: "icon-dashboard", badge: "" },
        { id: 2, title: "پروفایل", path: "/dashboard/profile", icon: "icon-profile", badge: "" },
        { id: 3, title: "منو کافه", path: "/dashboard/menu", icon: "icon-menu", badge: "جدید" },
        { id: 4, title: "سفارش‌ها", path: "/dashboard/orders", icon: "icon-orders", badge: "۵" },
        { id: 5, title: "گزارش‌ها", path: "/dashboard/reports", icon: "icon-reports", badge: "" },
        { id: 6, title: "کاربران", path: "/dashboard/users", icon: "icon-users", badge: "" },
        { id: 7, title: "تنظیمات", path: "/dashboard/settings", icon: "icon-settings", badge: "" },
        { id: 8, title: "پشتیبانی", path: "/dashboard/support", icon: "icon-support", badge: "" }
      ]
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('sidebar-collapsed', this.isCollapsed);
    }
  }
}
</script>

<style scoped>
.main-sidebar {
  z-index: 100;
  grid-area: sidebar;
  background: linear-gradient(180deg, var(--primary-dark) 0%, var(--primary-color) 100%);
  color: var(--text-light);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  transition: var(--transition);
  overflow: hidden;
}

.collapse-toggle {
  position: absolute;
  top: 20px;
  left: 15px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-light);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: var(--transition);
}

.collapse-toggle:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.sidebar-profile {
  padding: 40px 20px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: var(--transition);
}

.profile-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--secondary-color);
  margin-bottom: 15px;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  text-align: center;
  transition: var(--transition);
}

.profile-info h3 {
  font-size: 1.2rem;
  margin-bottom: 5px;
  font-weight: 600;
}

.profile-info p {
  font-size: 0.9rem;
  opacity: 0.8;
}

.sidebar-nav {
  flex: 1;
  padding: 25px 0;
  overflow-y: auto;
}

.sidebar-nav ul {
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 25px;
  color: var(--text-light);
  text-decoration: none;
  transition: var(--transition);
  position: relative;
  border-right: 3px solid transparent;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-right-color: var(--secondary-color);
}

.nav-item.active {
  background-color: rgba(255, 255, 255, 0.15);
  border-right-color: var(--secondary-color);
  font-weight: 600;
}

.nav-item i {
  font-size: 1.3rem;
  margin-left: 15px;
  min-width: 24px;
  text-align: center;
}

.nav-item span {
  flex: 1;
  font-size: 0.95rem;
}

.nav-badge {
  background-color: var(--secondary-color);
  color: var(--text-dark);
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-stats {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius);
  padding: 15px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-item i {
  font-size: 1.5rem;
  margin-left: 12px;
  color: var(--secondary-color);
}

.stat-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  opacity: 0.8;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  color: var(--text-light);
  cursor: pointer;
  transition: var(--transition);
  gap: 10px;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.sidebar-footer-collapsed {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.logout-btn-collapsed {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  cursor: pointer;
  transition: var(--transition);
}

.logout-btn-collapsed:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* حالت جمع شده */
.sidebar-collapsed {
  width: 80px;
}

.sidebar-collapsed .profile-info,
.sidebar-collapsed .nav-item span,
.sidebar-collapsed .logout-btn span,
.sidebar-collapsed .stat-item div {
  display: none;
}

.sidebar-collapsed .sidebar-profile {
  padding: 40px 10px 30px;
}

.sidebar-collapsed .profile-avatar {
  width: 50px;
  height: 50px;
}

.sidebar-collapsed .nav-item {
  padding: 15px;
  justify-content: center;
}

.sidebar-collapsed .nav-item i {
  margin-left: 0;
}

.sidebar-collapsed .nav-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.6rem;
  padding: 1px 5px;
}

.sidebar-collapsed .sidebar-stats {
  padding: 10px;
}

.sidebar-collapsed .stat-item {
  justify-content: center;
  margin-bottom: 20px;
}

.sidebar-collapsed .stat-item i {
  margin-left: 0;
  font-size: 1.8rem;
}

/* آیکون‌ها (شبیه‌سازی) */
.icon-dashboard::before { content: "📊"; }
.icon-profile::before { content: "👤"; }
.icon-menu::before { content: "📋"; }
.icon-orders::before { content: "🛒"; }
.icon-reports::before { content: "📈"; }
.icon-users::before { content: "👥"; }
.icon-settings::before { content: "⚙️"; }
.icon-support::before { content: "💬"; }
.icon-wallet::before { content: "💰"; }
.icon-logout::before { content: "🚪"; }
.icon-chevron-left::before { content: "◀"; }
.icon-chevron-right::before { content: "▶"; }

/* رسپانسیو */
@media (max-width: 992px) {
  .main-sidebar {
    position: fixed;
    top: 0;
    right: -300px;
    height: 100vh;
    z-index: 1000;
    width: 280px;
    transition: right 0.3s ease;
  }

  .main-sidebar.sidebar-mobile-open {
    right: 0;
  }

  .sidebar-collapsed {
    width: 280px;
  }

  .sidebar-collapsed .profile-info,
  .sidebar-collapsed .nav-item span,
  .sidebar-collapsed .logout-btn span,
  .sidebar-collapsed .stat-item div {
    display: block;
  }

  .sidebar-collapsed .sidebar-profile {
    padding: 40px 20px 30px;
  }

  .sidebar-collapsed .profile-avatar {
    width: 90px;
    height: 90px;
  }

  .sidebar-collapsed .nav-item {
    padding: 15px 25px;
    justify-content: flex-start;
  }

  .sidebar-collapsed .nav-item i {
    margin-left: 15px;
  }

  .sidebar-collapsed .nav-badge {
    position: static;
    font-size: 0.7rem;
    padding: 2px 8px;
  }

  .collapse-toggle {
    display: none;
  }
}

/* اسکرول‌بار سفارشی */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--secondary-color);
  border-radius: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color);
}
</style>