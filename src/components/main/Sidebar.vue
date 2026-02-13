<template>
  <aside
      class="main-sidebar"
      :class="{
        'sidebar-collapsed': isCollapsed,
        'sidebar-mobile-open': isMobileOpen,
        'dark-sidebar': isDarkMode
      }"
  >
    <!-- هدر سایدبار -->
    <div class="sidebar-header">
      <!-- لوگو - فقط در حالت عادی نمایش داده میشه -->
      <div class="sidebar-logo" v-if="!isCollapsed">
        <div class="sidebar-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="16" cy="6" r="2" fill="currentColor"/>
            <circle cx="8" cy="12" r="2" fill="currentColor"/>
            <circle cx="16" cy="18" r="2" fill="currentColor"/>
          </svg>
        </div>
        <div class="sidebar-logo-text">
          <span class="logo-main">کافه‌حجره</span>
          <span class="logo-sub">پنل مدیریت</span>
        </div>
      </div>

      <!-- دکمه جمع شدن -->
      <button class="collapse-toggle" @click="toggleCollapse" :title="isCollapsed ? 'باز کردن' : 'بستن'">
        <div class="toggle-icon">
          <i :class="isCollapsed ? 'icon-chevron-left' : 'icon-chevron-right'"></i>
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
          <img :src="userAvatar" :alt="userName">
          <div class="avatar-status online"></div>
        </div>
        <div class="profile-level" v-if="!isCollapsed">
          <span class="level-badge">PRO</span>
        </div>
      </div>

      <div class="profile-info" v-if="!isCollapsed">
        <h3 class="profile-name">{{ userName }}</h3>
        <p class="profile-role">{{ userRole }}</p>
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">۲۴</span>
            <span class="stat-label">سفارش</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">۴.۸</span>
            <span class="stat-label">امتیاز</span>
          </div>
        </div>
      </div>
    </div>

    <!-- منوی اصلی -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="section-label" v-if="!isCollapsed">منوی اصلی</div>
        <ul class="nav-menu">
          <li v-for="item in mainMenu" :key="item.id" class="nav-item-wrapper">
            <!-- آیتم اصلی منو -->
            <div
                class="nav-item"
                :class="{
                  'active': isActive(item.path) && !item.hasSubmenu,
                  'has-submenu': item.hasSubmenu,
                  'submenu-open': openSubmenus.includes(item.id)
                }"
                @click="handleItemClick(item)"
            >
              <div class="nav-icon-wrapper">
                <i :class="item.icon"></i>
                <span v-if="item.notification" class="nav-notification"></span>
              </div>

              <div class="nav-content" v-if="!isCollapsed">
                <span class="nav-title">{{ item.title }}</span>
                <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
              </div>

              <!-- فلش زیرمنو -->
              <i
                  v-if="!isCollapsed && item.hasSubmenu"
                  class="nav-arrow"
                  :class="openSubmenus.includes(item.id) ? 'icon-chevron-down' : 'icon-chevron-left'"
                  @click.stop="toggleSubmenu(item.id)"
              ></i>
            </div>

            <!-- زیرمنو -->
            <transition name="submenu-slide">
              <ul v-if="item.hasSubmenu && openSubmenus.includes(item.id) && !isCollapsed" class="submenu">
                <li v-for="subItem in item.submenu" :key="subItem.id">
                  <router-link
                      :to="subItem.path"
                      class="submenu-item"
                      :class="{ 'active': isActive(subItem.path) }"
                      @click="$emit('close-mobile-sidebar')"
                  >
                    <span class="submenu-dot"></span>
                    <span class="submenu-title">{{ subItem.title }}</span>
                    <span v-if="subItem.badge" class="submenu-badge">{{ subItem.badge }}</span>
                  </router-link>
                </li>
              </ul>
            </transition>

            <!-- زیرمنو در حالت جمع شده - به صورت tooltip -->
            <div v-if="isCollapsed && item.hasSubmenu" class="collapsed-submenu-tooltip">
              <div class="tooltip-content">
                <div class="tooltip-header">{{ item.title }}</div>
                <router-link
                    v-for="subItem in item.submenu"
                    :key="subItem.id"
                    :to="subItem.path"
                    class="tooltip-item"
                    @click="$emit('close-mobile-sidebar')"
                >
                  {{ subItem.title }}
                </router-link>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="nav-section" v-if="!isCollapsed">
        <div class="section-label">مدیریت</div>
        <ul class="nav-menu">
          <li v-for="item in managementMenu" :key="item.id" class="nav-item-wrapper">
            <!-- آیتم اصلی منوی مدیریت -->
            <div
                class="nav-item"
                :class="{
                  'active': isActive(item.path) && !item.hasSubmenu,
                  'has-submenu': item.hasSubmenu,
                  'submenu-open': openSubmenus.includes(item.id)
                }"
                @click="handleItemClick(item)"
            >
              <div class="nav-icon-wrapper">
                <i :class="item.icon"></i>
              </div>

              <div class="nav-content">
                <span class="nav-title">{{ item.title }}</span>
                <span v-if="item.tag" :class="['nav-tag', item.tagClass]">{{ item.tag }}</span>
              </div>

              <!-- فلش زیرمنو -->
              <i
                  v-if="item.hasSubmenu"
                  class="nav-arrow"
                  :class="openSubmenus.includes(item.id) ? 'icon-chevron-down' : 'icon-chevron-left'"
                  @click.stop="toggleSubmenu(item.id)"
              ></i>
            </div>

            <!-- زیرمنوی مدیریت -->
            <transition name="submenu-slide">
              <ul v-if="item.hasSubmenu && openSubmenus.includes(item.id)" class="submenu">
                <li v-for="subItem in item.submenu" :key="subItem.id">
                  <router-link
                      :to="subItem.path"
                      class="submenu-item"
                      :class="{ 'active': isActive(subItem.path) }"
                      @click="$emit('close-mobile-sidebar')"
                  >
                    <span class="submenu-dot"></span>
                    <span class="submenu-title">{{ subItem.title }}</span>
                    <span v-if="subItem.badge" class="submenu-badge">{{ subItem.badge }}</span>
                  </router-link>
                </li>
              </ul>
            </transition>
          </li>
        </ul>
      </div>
    </nav>

    <!-- حالت حداقل - فقط ساعت -->
    <div class="sidebar-minimal" v-if="isCollapsed">
      <div class="minimal-time">
        <span class="time-hour">{{ currentTime.hours }}</span>
        <span class="time-separator">:</span>
        <span class="time-minute">{{ currentTime.minutes }}</span>
      </div>
    </div>

    <!-- فوتر سایدبار -->
    <div class="sidebar-footer">
      <div v-if="!isCollapsed" class="footer-content">
        <div class="user-status">
          <div class="status-indicator">
            <span class="status-dot"></span>
            <span class="status-text">فعال</span>
          </div>
          <div class="last-login">
            <i class="icon-clock"></i>
            <span>{{ lastLoginTime }}</span>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <i class="icon-logout"></i>
          <span>خروج از حساب</span>
        </button>
        <div class="quick-actions">
          <button class="quick-action" title="اعلان‌ها">
            <i class="icon-bell"></i>
            <span class="notification-badge-mini">۳</span>
          </button>
          <button class="quick-action" title="تنظیمات سریع">
            <i class="icon-settings"></i>
          </button>
        </div>
      </div>
      <div v-else class="footer-collapsed">
        <button class="logout-btn-collapsed" @click="handleLogout" title="خروج">
          <i class="icon-logout"></i>
        </button>
        <div class="quick-actions">
          <button class="quick-action" title="اعلان‌ها">
            <i class="icon-bell"></i>
            <span class="notification-badge-mini">۳</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

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
    },
    isCollapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['sidebar-collapsed', 'close-mobile-sidebar'],
  setup(props, { emit }) {
    const router = useRouter()
    const authStore = useAuthStore()
    const openSubmenus = ref([])

    const toggleSubmenu = (itemId) => {
      if (openSubmenus.value.includes(itemId)) {
        openSubmenus.value = openSubmenus.value.filter(id => id !== itemId)
      } else {
        openSubmenus.value.push(itemId)
      }
    }

    return {
      authStore,
      router,
      openSubmenus,
      toggleSubmenu
    }
  },
  data() {
    return {
      currentTime: {
        hours: '14',
        minutes: '30'
      },
      mainMenu: [
        {
          id: 1,
          title: "داشبورد",
          path: "/dashboard",
          icon: "icon-dashboard",
          badge: "",
          hasSubmenu: false
        },
        {
          id: 2,
          title: "رستوران‌ها",
          path: "/dashboard/restaurant_list",
          icon: "icon-restaurant",
          notification: true,
          hasSubmenu: false
        },
        {
          id: 3,
          title: "آیتم‌ها",
          path: "/dashboard/item-list",
          icon: "icon-menu",
          badge: "انبار",
          hasSubmenu: true,
          submenu: [
            {
              id: 31,
              title: "دسته‌بندی‌ها",
              path: "/dashboard/item-categories",
              icon: "icon-category"
            },
            {
              id: 32,
              title: "ویرایش کالاها",
              path: "/dashboard/edit-items",
              icon: "icon-edit",
              badge: "۱۲"
            },
            {
              id: 33,
              title: "برچسب‌ها",
              path: "/dashboard/item-tags",
              icon: "icon-tag"
            },
            {
              id: 34,
              title: "انبارداری",
              path: "/dashboard/inventory",
              icon: "icon-warehouse",
              badge: "کم"
            }
          ]
        },
        {
          id: 4,
          title: "سفارش‌ها",
          path: "/dashboard/orders",
          icon: "icon-orders",
          badge: "۵",
          hasSubmenu: false
        },
        {
          id: 5,
          title: "مشتریان",
          path: "/dashboard/user-list",
          icon: "icon-users",
          badge: "جدید",
          hasSubmenu: false
        }
      ],
      managementMenu: [
        {
          id: 6,
          title: "گزارش‌ها",
          path: "/dashboard/reports",
          icon: "icon-chart",
          tag: "PDF",
          tagClass: "tag-new",
          hasSubmenu: true,
          submenu: [
            {
              id: 61,
              title: "میزان فروش",
              path: "/dashboard/sales-report",
              icon: "icon-sales"
            },
            {
              id: 62,
              title: "گزارش مالی",
              path: "/dashboard/financial-report",
              icon: "icon-wallet"
            },
            {
              id: 63,
              title: "گزارش مشتریان",
              path: "/dashboard/customers-report",
              icon: "icon-users"
            },
            {
              id: 64,
              title: "گزارش محصولات",
              path: "/dashboard/products-report",
              icon: "icon-menu"
            }
          ]
        },
        {
          id: 7,
          title: "مالی",
          path: "/dashboard/finance",
          icon: "icon-wallet",
          tag: "۳",
          tagClass: "tag-support",
          hasSubmenu: false
        },
        {
          id: 8,
          title: "کارمندان",
          path: "/dashboard/employees",
          icon: "icon-team",
          hasSubmenu: true,
          submenu: [
            {
              id: 81,
              title: "لیست کارمندان",
              path: "/dashboard/employees-list",
              icon: "icon-team"
            },
            {
              id: 82,
              title: "مدیریت دسترسی‌ها",
              path: "/dashboard/permissions",
              icon: "icon-shield"
            },
            {
              id: 83,
              title: "برنامه شیفتی",
              path: "/dashboard/schedule",
              icon: "icon-calendar"
            },
            {
              id: 84,
              title: "حضور و غیاب",
              path: "/dashboard/attendance",
              icon: "icon-clock"
            }
          ]
        },
        {
          id: 9,
          title: "تنظیمات",
          path: "/dashboard/settings",
          icon: "icon-settings",
          hasSubmenu: false
        },
        {
          id: 10,
          title: "کاربران",
          path: "/dashboard/users",
          icon: "icon-user-management",
          hasSubmenu: true,
          submenu: [
            {
              id: 101,
              title: "همه کاربران",
              path: "/dashboard/users/all",
              icon: "icon-users"
            },
            {
              id: 102,
              title: "مدیران",
              path: "/dashboard/users/admins",
              icon: "icon-admin"
            },
            {
              id: 103,
              title: "کاربران عادی",
              path: "/dashboard/users/customers",
              icon: "icon-user"
            },
            {
              id: 104,
              title: "دسترسی‌ها",
              path: "/dashboard/users/roles",
              icon: "icon-role",
              badge: "جدید"
            }
          ]
        }
      ]
    }
  },
  computed: {
    userName() {
      if (!this.authStore?.user) return 'کاربر مهمان'
      return this.authStore.user.full_name ||
          this.authStore.user.phone_number ||
          this.authStore.user.username ||
          'کاربر'
    },
    userRole() {
      if (!this.authStore?.user) return 'کاربر سیستم'
      const roles = {
        'admin': 'مدیر ارشد',
        'manager': 'مدیر کافه',
        'staff': 'کارمند',
        'accountant': 'حسابدار'
      }
      return roles[this.authStore.user.role] || this.authStore.user.role || 'مدیر کافه'
    },
    userAvatar() {
      if (!this.authStore?.user) {
        return 'https://api.dicebear.com/7.x/avataaars/svg?seed=hojre&backgroundColor=b6e3f4,c0aede,d1d4f9'
      }
      return this.authStore.user.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.authStore.user.username || 'user'}&backgroundColor=b6e3f4,c0aede,d1d4f9`
    },
    lastLoginTime() {
      const storedTime = localStorage.getItem('last_login')
      if (storedTime) return storedTime

      const now = new Date()
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    }
  },
  methods: {
    toggleCollapse() {
      const newState = !this.isCollapsed
      this.$emit('sidebar-collapsed', newState)
    },
    isActive(path) {
      return this.$route.path === path || this.$route.path.startsWith(path + '/')
    },
    handleItemClick(item) {
      if (item.hasSubmenu) {
        this.toggleSubmenu(item.id)
      } else {
        this.$router.push(item.path)
        this.$emit('close-mobile-sidebar')
      }
    },
    handleLogout() {
      this.$emit('close-mobile-sidebar')
      try {
        if (this.authStore) {
          this.authStore.logout()
        }
        this.$router.push('/login')
      } catch (error) {
        console.error('خطا در خروج:', error)
      }
    },
    updateTime() {
      const now = new Date()
      this.currentTime.hours = now.getHours().toString().padStart(2, '0')
      this.currentTime.minutes = now.getMinutes().toString().padStart(2, '0')
    }
  },
  mounted() {
    this.updateTime()
    setInterval(this.updateTime, 60000)

    // باز کردن زیرمنوی آیتم فعال در لود صفحه
    this.$nextTick(() => {
      const currentPath = this.$route.path
      this.mainMenu.forEach(item => {
        if (item.submenu) {
          const activeSubItem = item.submenu.find(sub => currentPath.includes(sub.path))
          if (activeSubItem && !this.openSubmenus.includes(item.id)) {
            this.openSubmenus.push(item.id)
          }
        }
      })
      this.managementMenu.forEach(item => {
        if (item.submenu) {
          const activeSubItem = item.submenu.find(sub => currentPath.includes(sub.path))
          if (activeSubItem && !this.openSubmenus.includes(item.id)) {
            this.openSubmenus.push(item.id)
          }
        }
      })
    })
  }
}
</script>

<style scoped>
.main-sidebar {
  grid-area: sidebar;
  background: var(--sidebar-bg, white);
  color: var(--sidebar-text, #2c3e50);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 4px 0 25px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-left: 1px solid var(--sidebar-border, #eaeaea);
  width: var(--sidebar-width, 280px);
}

/* ===== هدر سایدبار ===== */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 15px;
  border-bottom: 1px solid var(--sidebar-border, #eaeaea);
  position: relative;
  height: 80px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

.sidebar-logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color, #a17c5a) 0%, var(--primary-dark, #8a5e3a) 100%);
  border-radius: 12px;
  padding: 8px;
  color: white;
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
  color: var(--sidebar-text, #2c3e50);
  line-height: 1.2;
}

.logo-sub {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--sidebar-text-secondary, #7f8c8d);
  letter-spacing: 1px;
}

.collapse-toggle {
  background: var(--sidebar-btn-bg, #f5f5f5);
  border: 1px solid var(--sidebar-border, #eaeaea);
  border-radius: 10px;
  color: var(--sidebar-icon, #a17c5a);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapse-toggle:hover {
  background: var(--sidebar-btn-hover, #eaeaea);
  transform: scale(0.95);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.mobile-close-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--sidebar-text, #2c3e50);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.mobile-close-btn:hover {
  background: var(--sidebar-btn-hover, #eaeaea);
}

/* ===== پروفایل کاربر ===== */
.sidebar-profile {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid var(--sidebar-border, #eaeaea);
  transition: all 0.3s ease;
}

.profile-avatar-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--sidebar-accent, #a17c5a);
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--sidebar-bg, white);
}

.avatar-status.online {
  background: #2ecc71;
  animation: pulse 2s infinite;
}

.profile-level {
  position: absolute;
  top: -5px;
  left: -5px;
}

.level-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.profile-info {
  text-align: center;
  width: 100%;
  animation: slideDown 0.3s ease;
}

.profile-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--sidebar-text, #2c3e50);
}

.profile-role {
  font-size: 0.8rem;
  color: var(--sidebar-text-secondary, #7f8c8d);
  margin-bottom: 16px;
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--sidebar-btn-bg, #f5f5f5);
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
  color: var(--sidebar-accent, #a17c5a);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--sidebar-text-secondary, #7f8c8d);
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 20px;
  background: var(--sidebar-border, #eaeaea);
}

/* ===== منوی اصلی ===== */
.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--sidebar-text-secondary, #7f8c8d);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding: 0 20px;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item-wrapper {
  position: relative;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: var(--sidebar-text, #2c3e50);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  margin: 2px 0;
  border-radius: 0 20px 20px 0;
  cursor: pointer;
}

.nav-item:hover {
  background: var(--sidebar-btn-hover, #eaeaea);
  padding-right: 25px;
}

.nav-item.active {
  background: var(--sidebar-active-bg, rgba(161, 124, 90, 0.1));
  border-right: 3px solid var(--sidebar-accent, #a17c5a);
  color: var(--sidebar-accent, #a17c5a);
}

.nav-item.has-submenu {
  cursor: pointer;
}

.nav-item.submenu-open {
  background: var(--sidebar-active-bg, rgba(161, 124, 90, 0.05));
  border-right: 3px solid var(--sidebar-accent, #a17c5a);
}

.nav-icon-wrapper {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--sidebar-btn-bg, #f5f5f5);
  margin-left: 12px;
  transition: all 0.2s ease;
}

.nav-item.active .nav-icon-wrapper,
.nav-item.submenu-open .nav-icon-wrapper {
  background: var(--sidebar-active-icon, rgba(161, 124, 90, 0.2));
  color: var(--sidebar-accent, #a17c5a);
}

.nav-icon-wrapper i {
  font-size: 1.1rem;
}

.nav-notification {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ff4757;
  border-radius: 50%;
  border: 2px solid var(--sidebar-bg, white);
  animation: pulse 2s infinite;
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
  background: var(--sidebar-accent, #a17c5a);
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.nav-tag {
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
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
  opacity: 0.6;
  margin-right: 8px;
  transition: transform 0.3s ease;
}

/* ===== زیرمنو ===== */
.submenu {
  list-style: none;
  padding: 8px 0 8px 20px;
  margin: 0;
  background: var(--sidebar-submenu-bg, rgba(0, 0, 0, 0.02));
  border-right: 1px dashed var(--sidebar-border, #eaeaea);
  margin-right: 30px;
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  color: var(--sidebar-text-secondary, #7f8c8d);
  text-decoration: none;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  border-radius: 0 20px 20px 0;
  position: relative;
}

.submenu-item:hover {
  background: var(--sidebar-btn-hover, #eaeaea);
  color: var(--sidebar-text, #2c3e50);
  padding-right: 25px;
}

.submenu-item.active {
  background: var(--sidebar-active-bg, rgba(161, 124, 90, 0.1));
  color: var(--sidebar-accent, #a17c5a);
}

.submenu-dot {
  width: 6px;
  height: 6px;
  background: var(--sidebar-text-secondary, #7f8c8d);
  border-radius: 50%;
  margin-left: 12px;
  transition: all 0.2s ease;
}

.submenu-item:hover .submenu-dot,
.submenu-item.active .submenu-dot {
  background: var(--sidebar-accent, #a17c5a);
  transform: scale(1.2);
}

.submenu-title {
  flex: 1;
}

.submenu-badge {
  font-size: 0.6rem;
  padding: 2px 6px;
  background: var(--sidebar-btn-bg, #f5f5f5);
  border-radius: 10px;
  color: var(--sidebar-text-secondary, #7f8c8d);
}

/* ===== انیمیشن زیرمنو ===== */
.submenu-slide-enter-active,
.submenu-slide-leave-active {
  transition: all 0.25s ease;
  max-height: 500px;
  opacity: 1;
}

.submenu-slide-enter-from,
.submenu-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
}

/* ===== حالت جمع شده و tooltip ===== */
.collapsed-submenu-tooltip {
  position: absolute;
  right: 100%;
  top: 0;
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 1000;
}

.nav-item-wrapper:hover .collapsed-submenu-tooltip {
  visibility: visible;
  opacity: 1;
  right: calc(100% + 5px);
}

.tooltip-content {
  background: var(--sidebar-bg, white);
  border: 1px solid var(--sidebar-border, #eaeaea);
  border-radius: 12px;
  padding: 12px;
  min-width: 180px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.tooltip-header {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--sidebar-accent, #a17c5a);
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--sidebar-border, #eaeaea);
}

.tooltip-item {
  display: block;
  padding: 6px 12px;
  color: var(--sidebar-text, #2c3e50);
  text-decoration: none;
  font-size: 0.8rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.tooltip-item:hover {
  background: var(--sidebar-btn-hover, #eaeaea);
  color: var(--sidebar-accent, #a17c5a);
}

/* ===== فوتر سایدبار ===== */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--sidebar-border, #eaeaea);
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fadeIn 0.3s ease;
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
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #2ecc71;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  font-size: 0.8rem;
  color: var(--sidebar-text-secondary, #7f8c8d);
}

.last-login {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--sidebar-text-secondary, #7f8c8d);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background: var(--sidebar-btn-bg, #f5f5f5);
  border: 1px solid var(--sidebar-border, #eaeaea);
  border-radius: 10px;
  color: var(--sidebar-text, #2c3e50);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.logout-btn:hover {
  background: var(--sidebar-btn-hover, #eaeaea);
  border-color: #ff4757;
  color: #ff4757;
}

.footer-collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.logout-btn-collapsed {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sidebar-btn-bg, #f5f5f5);
  border: 1px solid var(--sidebar-border, #eaeaea);
  border-radius: 12px;
  color: var(--sidebar-text, #2c3e50);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
}

.logout-btn-collapsed:hover {
  background: var(--sidebar-btn-hover, #eaeaea);
  color: #ff4757;
  transform: rotate(15deg);
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.quick-action {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sidebar-btn-bg, #f5f5f5);
  border: 1px solid var(--sidebar-border, #eaeaea);
  border-radius: 10px;
  color: var(--sidebar-text, #2c3e50);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.quick-action:hover {
  background: var(--sidebar-btn-hover, #eaeaea);
  transform: scale(1.1);
}

.notification-badge-mini {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: #ff4757;
  color: white;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--sidebar-bg, white);
}

/* ===== حالت حداقل ===== */
.sidebar-minimal {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.minimal-time {
  display: flex;
  align-items: baseline;
  background: var(--sidebar-btn-bg, #f5f5f5);
  border-radius: 10px;
  padding: 8px 12px;
}

.time-hour, .time-minute {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--sidebar-accent, #a17c5a);
}

.time-separator {
  font-size: 1rem;
  color: var(--sidebar-text-secondary, #7f8c8d);
  margin: 0 2px;
  animation: blink 1s infinite;
}

/* ===== حالت جمع شده ===== */
.sidebar-collapsed {
  width: var(--sidebar-collapsed-width, 80px);
}

.sidebar-collapsed .sidebar-header {
  justify-content: center;
  padding: 20px 0;
}

.sidebar-collapsed .collapse-toggle {
  position: static;
  margin: 0 auto;
}

.sidebar-collapsed .sidebar-logo,
.sidebar-collapsed .profile-info,
.sidebar-collapsed .section-label,
.sidebar-collapsed .nav-content,
.sidebar-collapsed .nav-arrow,
.sidebar-collapsed .footer-content,
.sidebar-collapsed .submenu {
  display: none;
}

.sidebar-collapsed .sidebar-profile {
  padding: 20px 0;
}

.sidebar-collapsed .profile-avatar-wrapper {
  margin-bottom: 0;
}

.sidebar-collapsed .profile-avatar {
  width: 50px;
  height: 50px;
}

.sidebar-collapsed .nav-item {
  padding: 12px;
  justify-content: center;
}

.sidebar-collapsed .nav-icon-wrapper {
  margin-left: 0;
}

.sidebar-collapsed .sidebar-footer {
  padding: 20px 0;
}

/* ===== رسپانسیو ===== */
@media (max-width: 992px) {
  .main-sidebar {
    position: fixed;
    top: 0;
    right: -100%;
    height: 100vh;
    z-index: 1001;
    width: var(--sidebar-width, 280px);
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .main-sidebar.sidebar-mobile-open {
    right: 0;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.15);
  }

  .mobile-close-btn {
    display: flex;
    position: absolute;
    left: 20px;
    top: 20px;
  }

  .collapse-toggle {
    display: none;
  }

  .sidebar-collapsed {
    width: var(--sidebar-width, 280px);
  }

  .sidebar-collapsed .sidebar-header {
    padding: 20px;
    justify-content: flex-end;
  }

  .sidebar-collapsed .collapse-toggle {
    display: none;
  }

  .sidebar-collapsed .sidebar-logo {
    display: flex;
  }

  .sidebar-collapsed .sidebar-logo,
  .sidebar-collapsed .profile-info,
  .sidebar-collapsed .section-label,
  .sidebar-collapsed .nav-content,
  .sidebar-collapsed .nav-arrow,
  .sidebar-collapsed .footer-content,
  .sidebar-collapsed .submenu {
    display: block;
  }

  .sidebar-collapsed .sidebar-profile {
    padding: 24px 20px;
  }

  .sidebar-collapsed .profile-avatar {
    width: 90px;
    height: 90px;
  }

  .sidebar-collapsed .nav-item {
    padding: 10px 20px;
    justify-content: flex-start;
  }

  .sidebar-collapsed .nav-icon-wrapper {
    margin-left: 12px;
  }

  .sidebar-collapsed .sidebar-footer {
    padding: 20px;
  }

  .sidebar-collapsed .sidebar-minimal {
    display: none;
  }
}

/* ===== اسکرول بار ===== */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--sidebar-border, #eaeaea);
  border-radius: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--sidebar-accent, #a17c5a);
}

/* ===== انیمیشن‌ها ===== */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== متغیرهای رنگ ===== */
:root {
  --sidebar-width: 280px;
  --sidebar-collapsed-width: 80px;
  --sidebar-bg: #ffffff;
  --sidebar-text: #2c3e50;
  --sidebar-text-secondary: #7f8c8d;
  --sidebar-border: #eaeaea;
  --sidebar-accent: #a17c5a;
  --sidebar-btn-bg: #f5f5f5;
  --sidebar-btn-hover: #eaeaea;
  --sidebar-active-bg: rgba(161, 124, 90, 0.1);
  --sidebar-active-icon: rgba(161, 124, 90, 0.2);
  --sidebar-icon: #a17c5a;
  --sidebar-submenu-bg: rgba(0, 0, 0, 0.02);
}

[data-theme="dark"] {
  --sidebar-bg: #1e1a16;
  --sidebar-text: #f9f5f0;
  --sidebar-text-secondary: #b0a8a0;
  --sidebar-border: #4a4238;
  --sidebar-accent: #d4a574;
  --sidebar-btn-bg: #2d261f;
  --sidebar-btn-hover: #4a4238;
  --sidebar-active-bg: rgba(212, 165, 116, 0.15);
  --sidebar-active-icon: rgba(212, 165, 116, 0.25);
  --sidebar-icon: #d4a574;
  --sidebar-submenu-bg: rgba(255, 255, 255, 0.02);
}

/* ===== آیکون‌ها ===== */
.icon-dashboard::before { content: "📊"; }
.icon-restaurant::before { content: "🏪"; }
.icon-menu::before { content: "📋"; }
.icon-orders::before { content: "🛒"; }
.icon-users::before { content: "👥"; }
.icon-chart::before { content: "📈"; }
.icon-wallet::before { content: "💰"; }
.icon-team::before { content: "👨‍🍳"; }
.icon-settings::before { content: "⚙️"; }
.icon-logout::before { content: "🚪"; }
.icon-bell::before { content: "🔔"; }
.icon-clock::before { content: "🕒"; }
.icon-chevron-left::before { content: "‹"; }
.icon-chevron-right::before { content: "›"; }
.icon-chevron-down::before { content: "⌄"; }
.icon-close::before { content: "✕"; }
.icon-category::before { content: "📑"; }
.icon-edit::before { content: "✏️"; }
.icon-tag::before { content: "🏷️"; }
.icon-warehouse::before { content: "📦"; }
.icon-sales::before { content: "📊"; }
.icon-user-management::before { content: "👤"; }
.icon-admin::before { content: "👑"; }
.icon-user::before { content: "🙍"; }
.icon-role::before { content: "🔑"; }
.icon-shield::before { content: "🛡️"; }
.icon-calendar::before { content: "📅"; }
</style>