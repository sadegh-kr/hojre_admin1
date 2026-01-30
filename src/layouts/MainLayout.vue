<template>
  <div :class="['app-container', themeClass]">
    <!-- هدر جداگانه -->
    <HeaderComponent
        :isDarkMode="isDarkMode"
        @toggle-theme="toggleTheme"
        @toggle-sidebar="toggleMobileSidebar"
    />

    <!-- سایدبار جداگانه -->
    <SidebarComponent
        :isMobileOpen="isMobileSidebarOpen"
        @close-mobile-sidebar="closeMobileSidebar"
    />

    <!-- محتوای اصلی -->
    <main class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>

    <!-- Overlay برای موبایل -->
    <div
        v-if="isMobileSidebarOpen"
        class="mobile-sidebar-overlay"
        @click="closeMobileSidebar"
    ></div>
  </div>
</template>

<script>
import HeaderComponent from '../components/main/Header.vue';
import SidebarComponent from '../components/main/Sidebar.vue';

export default {
  name: "MainLayout",
  components: {
    HeaderComponent,
    SidebarComponent
  },
  data() {
    return {
      isDarkMode: localStorage.getItem("cafeHojre-theme") === "dark",
      isMobileSidebarOpen: false
    }
  },
  computed: {
    themeClass() {
      return this.isDarkMode ? "dark-theme" : "light-theme";
    }
  },
  methods: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem("cafeHojre-theme", this.isDarkMode ? "dark" : "light");
    },
    toggleMobileSidebar() {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    },
    closeMobileSidebar() {
      this.isMobileSidebarOpen = false;
    }
  },
  mounted() {
    // اعمال تم در سطح HTML برای دسترسی بهتر CSS
    document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
  },
  watch: {
    isDarkMode(newVal) {
      document.documentElement.setAttribute('data-theme', newVal ? 'dark' : 'light');
    }
  }
}
</script>

<style>
:root {
  /* رنگ‌های ملایم‌تر برای قهوه‌ای */
  --primary-color: #a17c5a;
  --primary-light: #b89a7a;
  --primary-dark: #8a5e3a;
  --secondary-color: #d4b896;
  --accent-color: #c8a87c;
  --text-light: #f9f5f0;
  --text-dark: #3a2c1c;
  --bg-light: #f8f4ef;
  --bg-dark: #1e1a16;
  --card-light: #ffffff;
  --card-dark: #2d261f;
  --border-light: #e0d6cc;
  --border-dark: #4a4238;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --radius: 12px;
  --transition: all 0.3s ease;
}

[data-theme="dark"] {
  --primary-color: #b89a7a;
  --primary-light: #a17c5a;
  --primary-dark: #8a5e3a;
  --secondary-color: #c8a87c;
  --accent-color: #d4b896;
  --text-color: #f9f5f0;
  --bg-color: #1e1a16;
  --card-bg: #2d261f;
  --border-color: #4a4238;
}

[data-theme="light"] {
  --primary-color: #a17c5a;
  --primary-light: #b89a7a;
  --primary-dark: #8a5e3a;
  --secondary-color: #d4b896;
  --accent-color: #c8a87c;
  --text-color: #3a2c1c;
  --bg-color: #f8f4ef;
  --card-bg: #ffffff;
  --border-color: #e0d6cc;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.app-container {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "header header"
    "sidebar main";
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: 'Vazir', 'IRANSans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
}

/* استایل‌های مربوط به تم */
.light-theme {
  background-color: var(--bg-color);
  color: var(--text-color);
}

.dark-theme {
  background-color: var(--bg-color);
  color: var(--text-color);
}

/* استایل محتوای اصلی */
.main-content {
  grid-area: main;
  padding: 10px;
  overflow-y: auto;
  //max-height: calc(100vh - 80px);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--card-bg);
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

/* Overlay برای موبایل */
.mobile-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

/* رسپانسیو */
@media (max-width: 992px) {
  .app-container {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main";
  }

  .main-content {
    max-height: calc(100vh - 80px);
    padding: 20px;
  }

  .content-wrapper {
    padding: 20px;
  }

  .mobile-sidebar-overlay {
    display: block;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .content-wrapper {
    padding: 15px;
  }
}

/* انیمیشن‌ها */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s;
}

.slide-enter, .slide-leave-to {
  transform: translateX(-20px);
}
</style>