<template>
  <header class="header" dir="rtl">
    <button class="menu admin-icon-button" @click="$emit('toggle-sidebar')" aria-label="باز کردن منو">☰</button>
    <div class="header-title"><strong>کافه‌حجره</strong><span>مدیریت رستوران</span></div>
    <label v-if="restaurants.length > 1" class="restaurant-context">
      <span>مجموعه فعال</span>
      <select v-model="selectedRestaurant" @change="changeRestaurant">
        <option value="" disabled>انتخاب رستوران</option>
        <option v-for="restaurant in restaurants" :key="restaurant.id" :value="restaurant.id">{{ restaurant.name }}</option>
      </select>
    </label>
    <div class="header-actions">
      <button class="theme admin-icon-button" @click="$emit('toggle-theme')" :aria-label="isDarkMode ? 'حالت روشن' : 'حالت تیره'">{{ isDarkMode ? '☀' : '◐' }}</button>
      <button class="overflow admin-icon-button" @click="menuOpen = !menuOpen" aria-label="گزینه‌های بیشتر">⋮</button>
      <div v-if="menuOpen" class="overflow-menu"><RouterLink v-if="auth.canAccessFinancials" to="/dashboard/cost-control/expenses" @click="menuOpen=false">مدیریت هزینه‌ها</RouterLink><button @click="logout">خروج از حساب</button></div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useRestaurantStore } from '@/store/restaurant'

defineProps({ isDarkMode:Boolean })
defineEmits(['toggle-sidebar','toggle-theme'])
const menuOpen = ref(false)
const router = useRouter()
const auth = useAuthStore()
const restaurantContext = useRestaurantStore()
const restaurants = computed(() => restaurantContext.restaurants)
const selectedRestaurant = computed({
  get: () => restaurantContext.activeRestaurantId,
  set: value => restaurantContext.setActiveRestaurant(value),
})

function changeRestaurant() {
  // A full route reload guarantees that no component keeps data from the
  // previously selected tenant in memory.
  router.go(0)
}
function logout(){restaurantContext.reset();auth.logout();router.push('/login')}
</script>

<style scoped>
.header{grid-area:header;position:sticky;top:0;z-index:50;height:72px;display:flex;align-items:center;gap:1rem;padding:0 1.25rem;background:var(--surface);border-bottom:1px solid var(--border)}.header-title{display:grid;gap:.1rem}.header-title strong{color:var(--primary)}.header-title span,.restaurant-context span{font-size:.75rem;color:var(--muted)}.restaurant-context{display:flex;align-items:center;gap:.5rem;margin-right:auto}.restaurant-context select{min-height:36px;max-width:220px;border:1px solid var(--border);border-radius:8px;background:var(--surface-subtle);color:var(--text);padding:0 .6rem}.header-actions{position:relative;display:flex;gap:.5rem;margin-right:auto}.restaurant-context+.header-actions{margin-right:0}.overflow-menu{position:absolute;top:44px;left:0;min-width:170px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow);border-radius:9px;padding:.4rem;display:grid}.overflow-menu>*{padding:.65rem;text-align:right;border:0;background:transparent;color:var(--text);text-decoration:none;font:inherit}.overflow-menu>*:hover{background:var(--surface-subtle)}@media(min-width:901px){.menu{display:none}}@media(max-width:700px){.header-title span,.restaurant-context span{display:none}.restaurant-context{min-width:0}.restaurant-context select{max-width:130px}.header{padding:0 .7rem;gap:.5rem}}
</style>
