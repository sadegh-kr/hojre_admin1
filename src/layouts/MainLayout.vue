<template>
  <div class="admin-shell" :class="{ collapsed, mobileOpen, dark: isDark }" dir="rtl">
    <HeaderComponent :is-dark-mode="isDark" @toggle-theme="toggleTheme" @toggle-sidebar="mobileOpen = !mobileOpen" />
    <SidebarComponent :is-mobile-open="mobileOpen" :is-collapsed="collapsed" @sidebar-collapsed="setCollapsed" @close-mobile-sidebar="mobileOpen=false" />
    <main class="admin-main">
      <div class="admin-content">
        <p v-if="!restaurantContext.ready" class="context-state">در حال دریافت رستوران‌های مجاز…</p>
        <p v-else-if="restaurantContext.error" class="context-state context-state--error">{{ restaurantContext.error }}</p>
        <template v-else>
          <nav v-if="route.meta.backTo" class="page-back-navigation" aria-label="پیمایش صفحه">
            <AppBackButton :fallback="route.meta.backTo" :label="route.meta.backLabel || 'بازگشت'" />
          </nav>
          <RouterView />
        </template>
      </div>
    </main>
    <div v-if="mobileOpen" class="overlay" @click="mobileOpen=false" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import HeaderComponent from '@/components/main/Header.vue'
import SidebarComponent from '@/components/main/Sidebar.vue'
import AppBackButton from '@/components/common/AppBackButton.vue'
import { useRestaurantStore } from '@/store/restaurant'

const restaurantContext = useRestaurantStore()
const route = useRoute()
const isDark = ref(localStorage.getItem('cafeHojre-theme') === 'dark')
const collapsed = ref(localStorage.getItem('cafeHojre-sidebar') === 'collapsed')
const mobileOpen = ref(false)

// Revalidate persisted selection on every authenticated layout mount. This
// also prevents a restaurant from a previous account surviving re-login.
restaurantContext.initialize(true)

function toggleTheme() { isDark.value = !isDark.value }
function setCollapsed(value) { collapsed.value = value }

watch(isDark, value => {
  localStorage.setItem('cafeHojre-theme', value ? 'dark' : 'light')
  document.documentElement.dataset.theme = value ? 'dark' : 'light'
}, { immediate: true })
watch(collapsed, value => localStorage.setItem('cafeHojre-sidebar', value ? 'collapsed' : 'expanded'))
</script>

<style>
.admin-shell{--sidebar-width:260px;--sidebar-collapsed-width:72px;min-height:100vh;display:grid;grid-template-columns:var(--sidebar-width) minmax(0,1fr);grid-template-rows:72px minmax(0,1fr);grid-template-areas:"header header" "sidebar main";background:var(--app-bg);color:var(--text)}.admin-shell.collapsed{grid-template-columns:var(--sidebar-collapsed-width) minmax(0,1fr)}.admin-main{grid-area:main;min-width:0;padding:1.25rem;overflow:hidden}.admin-content{max-width:1500px;margin:auto}.page-back-navigation{display:flex;align-items:center;margin-bottom:.85rem}.context-state{padding:2rem;text-align:center;color:var(--muted)}.context-state--error{color:var(--danger,#b42318)}.overlay{display:none}@media(max-width:900px){.admin-shell,.admin-shell.collapsed{grid-template-columns:minmax(0,1fr);grid-template-areas:"header" "main"}.admin-main{padding:1rem}.overlay{display:block;position:fixed;inset:0;z-index:25;background:#11182766}}
</style>
