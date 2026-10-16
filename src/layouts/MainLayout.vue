<template>
  <div class="admin-shell" :class="{ collapsed, mobileOpen, dark: isDark }" dir="rtl">
    <HeaderComponent :is-dark-mode="isDark" @toggle-theme="toggleTheme" @toggle-sidebar="mobileOpen = !mobileOpen" />
    <SidebarComponent :is-mobile-open="mobileOpen" :is-collapsed="collapsed" @sidebar-collapsed="setCollapsed" @close-mobile-sidebar="mobileOpen=false" />
    <main class="admin-main">
      <div class="admin-content">
        <p v-if="!restaurantContext.ready" class="context-state" role="status">در حال دریافت رستوران‌های مجاز…</p>
        <section v-else-if="restaurantContext.error" class="context-state context-state--error" role="alert">
          <p>{{ restaurantContext.error }}</p>
          <button v-if="restaurantContext.errorKind === 'authentication'" class="admin-button admin-button--primary" type="button" @click="startNewSession">ورود دوباره</button>
          <button v-else class="admin-button admin-button--primary" type="button" @click="restaurantContext.initialize(true)">تلاش مجدد</button>
        </section>
        <section v-else-if="!restaurantContext.restaurants.length" class="context-state">
          <h1>هیچ رستورانی برای حساب شما در دسترس نیست.</h1>
          <p v-if="auth.canAccessFinancials">اگر انتظار دارید رستورانی ببینید، از مسئول استقرار بخواهید دیتابیس فعال و مالکیت رستوران را بررسی کند. ایجاد رستوران در این پنل در دسترس نیست.</p>
          <p v-else>برای دسترسی به رستوران، از مالک یا مدیر مجاز بخواهید دسترسی شما را ثبت کند.</p>
          <button class="admin-button admin-button--secondary" type="button" @click="restaurantContext.initialize(true)">بررسی دوباره</button>
        </section>
        <section v-else-if="restaurantContext.requiresSelection" class="context-state">
          <h1>انتخاب رستوران</h1>
          <p>برای نمایش اطلاعات، یکی از رستوران‌های مجاز خود را انتخاب کنید.</p>
          <label class="context-picker">رستوران
            <select :value="restaurantContext.activeRestaurantId" @change="restaurantContext.setActiveRestaurant($event.target.value)">
              <option value="" disabled>انتخاب رستوران</option>
              <option v-for="restaurant in restaurantContext.restaurants" :key="restaurant.id" :value="restaurant.id">{{ restaurant.name }}</option>
            </select>
          </label>
        </section>
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
import { onUnmounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import HeaderComponent from '@/components/main/Header.vue'
import SidebarComponent from '@/components/main/Sidebar.vue'
import AppBackButton from '@/components/common/AppBackButton.vue'
import { useRestaurantStore } from '@/store/restaurant'
import { useAuthStore } from '@/store/auth'

const restaurantContext = useRestaurantStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isDark = ref(localStorage.getItem('cafeHojre-theme') === 'dark')
const collapsed = ref(localStorage.getItem('cafeHojre-sidebar') === 'collapsed')
const mobileOpen = ref(false)

// Revalidate persisted selection on every authenticated layout mount. This
// also prevents a restaurant from a previous account surviving re-login.
restaurantContext.initialize(true)
onUnmounted(() => restaurantContext.cancelInitialization())

function startNewSession() {
  restaurantContext.reset()
  auth.logout()
  router.push('/login')
}

function toggleTheme() { isDark.value = !isDark.value }
function setCollapsed(value) { collapsed.value = value }

watch(isDark, value => {
  localStorage.setItem('cafeHojre-theme', value ? 'dark' : 'light')
  document.documentElement.dataset.theme = value ? 'dark' : 'light'
}, { immediate: true })
watch(collapsed, value => localStorage.setItem('cafeHojre-sidebar', value ? 'collapsed' : 'expanded'))
</script>

<style>
.admin-shell{--sidebar-width:245px;--sidebar-collapsed-width:76px;min-height:100vh;display:grid;grid-template-columns:var(--sidebar-width) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);grid-template-areas:"sidebar header" "sidebar main";align-items:start;background:var(--app-bg);color:var(--text)}
.admin-shell.collapsed{grid-template-columns:var(--sidebar-collapsed-width) minmax(0,1fr)}
.admin-main{grid-area:main;min-width:0;padding:22px var(--page-padding) 36px}
.admin-content{max-width:1600px;margin:auto;min-width:0}
.page-back-navigation{display:flex;align-items:center;margin-bottom:1rem}
.context-state{padding:clamp(24px,5vw,60px);text-align:center;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:var(--card-radius);box-shadow:var(--shadow)}
.context-state h1{font-size:1.25rem;color:var(--text)}
.context-state p{line-height:1.9;max-width:620px;margin:0 auto 20px}
.context-state--error{color:var(--danger)}
.context-picker{display:grid;gap:.5rem;max-width:380px;margin:1rem auto;text-align:right;color:var(--text)}
.context-picker select{min-height:44px;width:100%;padding:.5rem;border:1px solid var(--border-strong);border-radius:var(--control-radius);background:var(--input);color:var(--text);font:inherit}
.overlay{display:none}
@media(max-width:1200px){.admin-shell{--page-padding:20px;--sidebar-width:230px}}
@media(max-width:900px){.admin-shell,.admin-shell.collapsed{grid-template-columns:minmax(0,1fr);grid-template-areas:"header" "main"}.admin-main{padding:20px 16px}.overlay{display:block;position:fixed;inset:0;z-index:55;background:#241a1266}}
@media(max-width:480px){.admin-main{padding:16px 12px}}
</style>
