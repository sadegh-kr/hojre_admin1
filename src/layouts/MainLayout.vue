<template>
  <div :class="['app-container', themeClass]">
    <!-- هدر جداگانه -->
    <HeaderComponent
        :isDarkMode="isDarkMode"
        @toggle-theme="toggleTheme"
    />

    <!-- سایدبار جداگانه -->
    <SidebarComponent />

    <!-- محتوای اصلی -->
    <main class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>


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
      isDarkMode: localStorage.getItem("cafeHojre-theme") === "dark"
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
  --primary-color: #8b4513;
  --primary-light: #a0522d;
  --primary-dark: #5d2906;
  --secondary-color: #d4a574;
  --accent-color: #c19a6b;
  --text-light: #f9f5f0;
  --text-dark: #2c1810;
  --bg-light: #f9f5f0;
  --bg-dark: #1a1a1a;
  --card-light: #ffffff;
  --card-dark: #2d2d2d;
  --border-light: #e0d6cc;
  --border-dark: #444444;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --radius: 12px;
  --transition: all 0.3s ease;
}

[data-theme="dark"] {
  --primary-color: #a0522d;
  --primary-light: #8b4513;
  --primary-dark: #5d2906;
  --secondary-color: #c19a6b;
  --accent-color: #d4a574;
  --text-color: #f9f5f0;
  --bg-color: #1a1a1a;
  --card-bg: #2d2d2d;
  --border-color: #444444;
}

[data-theme="light"] {
  --primary-color: #8b4513;
  --primary-light: #a0522d;
  --primary-dark: #5d2906;
  --secondary-color: #d4a574;
  --accent-color: #c19a6b;
  --text-color: #2c1810;
  --bg-color: #f9f5f0;
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
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "sidebar footer";
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: 'Vazir', 'IRANSans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
  padding: 30px;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
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

/* استایل فوتر */
.main-footer {
  grid-area: footer;
  text-align: center;
  padding: 20px;
  background-color: var(--primary-dark);
  color: var(--text-light);
  font-size: 0.9rem;
  border-top: 1px solid var(--border-color);
}

/* رسپانسیو */
@media (max-width: 992px) {
  .app-container {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "footer";
  }

  .main-content {
    max-height: calc(100vh - 180px);
    padding: 20px;
  }

  .content-wrapper {
    padding: 20px;
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