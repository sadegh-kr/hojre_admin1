<template>
  <header class="header" dir="rtl">
    <button class="menu admin-icon-button" @click="$emit('toggle-sidebar')" aria-label="باز کردن منو"><AppIcon name="menu-toggle" /></button>
    <div class="header-title"><strong>خوش آمدید، {{ auth.user?.fullname || 'مدیر عزیز' }}</strong><span>{{ todayLabel }}</span></div>
    <label v-if="restaurantContext.ready && !restaurantContext.error && restaurants.length > 1" class="restaurant-context">
      <span>مجموعه فعال</span>
      <AppIcon name="store" />
      <select v-model="selectedRestaurant" @change="changeRestaurant">
        <option value="" disabled>انتخاب رستوران</option>
        <option v-for="restaurant in restaurants" :key="restaurant.id" :value="restaurant.id">{{ restaurant.name }}</option>
      </select>
    </label>
    <div v-else-if="restaurantContext.ready && !restaurantContext.error && restaurants.length === 1" class="restaurant-context" aria-label="رستوران فعال">
      <span>مجموعه فعال</span><AppIcon name="store" /><strong>{{ restaurants[0].name }}</strong>
    </div>
    <div class="header-actions">
      <button class="theme admin-icon-button" @click="$emit('toggle-theme')" :aria-label="isDarkMode ? 'حالت روشن' : 'حالت تیره'"><AppIcon :name="isDarkMode ? 'sun' : 'moon'" /></button>
      <button class="overflow admin-icon-button" @click="menuOpen = !menuOpen" aria-label="گزینه‌های حساب" :aria-expanded="menuOpen"><AppIcon name="user" /></button>
      <div v-if="menuOpen" class="overflow-menu"><RouterLink v-if="auth.canAccessFinancials" to="/dashboard/cost-control/expenses" @click="menuOpen=false">مدیریت هزینه‌ها</RouterLink><button @click="logout">خروج از حساب</button></div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useRestaurantStore } from '@/store/restaurant'
import AppIcon from '@/components/common/AppIcon.vue'

defineProps({ isDarkMode:Boolean })
defineEmits(['toggle-sidebar','toggle-theme'])
const menuOpen = ref(false)
const todayLabel = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full', timeZone: 'Asia/Tehran' }).format(new Date())
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
.header{grid-area:header;position:sticky;top:0;z-index:50;min-height:76px;display:flex;align-items:center;gap:1rem;padding:12px var(--page-padding);background:color-mix(in srgb,var(--surface) 94%,transparent);border-bottom:1px solid var(--border);box-shadow:0 4px 18px #4d2e1908;backdrop-filter:blur(14px)}
.header-title{display:grid;gap:2px;min-width:0}
.header-title strong{color:var(--text);font:800 .92rem/1.5 var(--font-family-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.header-title span,.restaurant-context>span{font-size:.75rem;color:var(--muted)}
.restaurant-context{display:flex;align-items:center;gap:.55rem;margin-inline-start:auto;color:var(--primary);min-width:0}
.restaurant-context select,.restaurant-context strong{min-height:42px;max-width:220px;border:1px solid var(--border);border-radius:var(--button-radius);background:var(--surface-raised);color:var(--text);padding:8px 16px;font-size:.83rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.restaurant-context select{cursor:pointer}
.header-actions{position:relative;display:flex;gap:.6rem;margin-inline-start:auto;flex:none}
.restaurant-context+.header-actions{margin-inline-start:0}
.header-actions .admin-icon-button{background:var(--surface-raised);color:var(--primary)}
.overflow-menu{position:absolute;top:52px;left:0;min-width:190px;background:var(--surface-elevated);border:1px solid var(--border);box-shadow:var(--shadow);border-radius:16px;padding:.4rem;display:grid}
.overflow-menu>*{padding:.75rem;text-align:right;border:0;border-radius:10px;background:transparent;color:var(--text);text-decoration:none;font:inherit;font-size:.85rem}
.overflow-menu>*:hover{background:var(--surface-subtle)}
@media(min-width:901px){.menu{display:none}}
@media(max-width:700px){.header{gap:.6rem;flex-wrap:wrap;padding:12px 16px}.header-title{flex:1}.restaurant-context{order:4;width:100%;padding-top:8px;border-top:1px solid var(--border)}.restaurant-context select,.restaurant-context strong{max-width:calc(100% - 110px);flex:1}.header-actions{gap:.4rem}.header-title span{font-size:.68rem}.restaurant-context+.header-actions{margin-inline-start:auto}}
</style>
