<template>
  <div id="app" :class="appTheme">
    <!-- نمایش صفحه فعلی -->
    <router-view />


    <div style="z-index: 0" class="app-status-bar">
      <div class="status-content">
        <span v-if="isOnline" class="online-status">
          <i class="fas fa-wifi"></i> آنلاین
        </span>
        <span v-else class="offline-status">
          <i class="fas fa-exclamation-triangle"></i> آفلاین
        </span>
        <span class="app-version">کافه حجره v1.0.0</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isOnline: navigator.onLine,
      isDarkMode: false
    }
  },
  computed: {
    appTheme() {
      return this.isDarkMode ? 'dark-theme' : 'light-theme'
    }
  },
  mounted() {
    // بررسی وضعیت اتصال اینترنت
    window.addEventListener('online', this.updateOnlineStatus)
    window.addEventListener('offline', this.updateOnlineStatus)

    // بررسی حالت تاریک از localStorage
    const savedTheme = localStorage.getItem('cafeHojre-theme')
    if (savedTheme === 'dark') {
      this.isDarkMode = true
    }
  },
  beforeUnmount() {
    window.removeEventListener('online', this.updateOnlineStatus)
    window.removeEventListener('offline', this.updateOnlineStatus)
  },
  methods: {
    updateOnlineStatus() {
      this.isOnline = navigator.onLine
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

/* تم‌های کلی برنامه */
.light-theme {
  background-color: #f9f5f0;
  color: #333;
}

.dark-theme {
  background-color: #1a1a1a;
  color: #f0f0f0;
}

/* نوار وضعیت */
.app-status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(139, 69, 19, 0.9);
  color: white;
  padding: 8px 20px;
  font-size: 0.8rem;
  z-index: 1000;
}

.dark-theme .app-status-bar {
  background: rgba(58, 40, 35, 0.9);
}

.status-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #4CAF50;
}

.offline-status {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #FF9800;
}

.app-version {
  opacity: 0.8;
}

/* انیمیشن‌های تغییر صفحه */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* حالت‌های مختلف برای صفحات */
.page-container {
  min-height: calc(100vh - 40px);
  padding: 20px;
}

/* رسپانسیو */
@media (max-width: 768px) {
  .app-status-bar {
    padding: 6px 15px;
    font-size: 0.75rem;
  }

  .status-content {
    flex-direction: column;
    gap: 3px;
    text-align: center;
  }
}
</style>