<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed, open: isMobileOpen }" dir="rtl">
    <div class="sidebar-brand"><div v-if="!isCollapsed || isMobileOpen"><strong>کافه‌حجره</strong><span>مدیریت رستوران</span></div><button class="icon-btn admin-icon-button" @click="toggle" :aria-label="isCollapsed ? 'باز کردن سایدبار' : 'بستن سایدبار'"><AppIcon name="menu-toggle" /></button></div>
    <nav aria-label="منوی مدیریت"><template v-for="section in visibleSections" :key="section.label"><p v-if="!isCollapsed || isMobileOpen" class="section-title">{{ section.label }}</p><template v-for="item in section.items" :key="item.key || item.to"><div v-if="item.children" class="nav-group" :class="{ active: isCurrent(item) }"><button type="button" class="nav-link nav-parent" :class="{ active: isCurrent(item) }" :aria-label="item.label" :aria-expanded="isGroupOpen(item)" @click="toggleGroup(item)"><AppIcon :name="item.icon" class="nav-icon" /><span v-if="!isCollapsed || isMobileOpen" class="parent-label">{{ item.label }}</span><AppIcon v-if="!isCollapsed || isMobileOpen" name="chevron" class="chevron" :class="{ expanded: isGroupOpen(item) }" /></button><div v-if="isGroupOpen(item) && (!isCollapsed || isMobileOpen)" class="submenu"><RouterLink v-for="child in item.children" :key="child.to" :to="child.to" class="submenu-link" :class="{ active: isCurrent(child) }" @click="$emit('close-mobile-sidebar')"><span>{{ child.label }}</span></RouterLink></div></div><RouterLink v-else :to="item.to" class="nav-link" :class="{ active: isCurrent(item) }" :aria-label="item.label" @click="$emit('close-mobile-sidebar')"><AppIcon :name="item.icon" class="nav-icon" /><span v-if="!isCollapsed || isMobileOpen">{{ item.label }}</span></RouterLink></template></template></nav>
    <div class="sidebar-footer"><span v-if="!isCollapsed || isMobileOpen" class="sidebar-user"><AppIcon name="user" />{{ userName }}</span><HojrehSidebarArt v-if="!isCollapsed || isMobileOpen" /><button class="logout admin-button admin-button--ghost admin-button--sm" @click="logout" aria-label="خروج از حساب"><AppIcon name="logout" /><span v-if="!isCollapsed || isMobileOpen">خروج</span></button></div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import AppIcon from '@/components/common/AppIcon.vue'
import HojrehSidebarArt from '@/components/main/HojrehSidebarArt.vue'
const props = defineProps({ isMobileOpen: Boolean, isCollapsed: Boolean })
const emit = defineEmits(['sidebar-collapsed', 'close-mobile-sidebar'])
const router = useRouter(), route = useRoute(), auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)
const canAccessFinancials = computed(() => auth.canAccessFinancials)
const userName = computed(() => auth.user?.fullname || auth.user?.full_name || auth.user?.phone_number || 'مدیر')
const sections = [
  { label: 'اصلی', items: [{ label: 'داشبورد', to: '/dashboard', icon: 'home', exact: true }, { label: 'سفارش‌ها', to: '/dashboard/orders', icon: 'orders' }, { label: 'مشتریان', to: '/dashboard/user-list', icon: 'users' }, { label: 'اقلام منو', to: '/dashboard/item-list', icon: 'menu' }] },
  { label: 'باشگاه مشتریان', items: [{ key: 'loyalty-club', label: 'باشگاه مشتریان', icon: 'star', children: [
    { label: 'نمای کلی', to: '/dashboard/loyalty' },
    { label: 'اعضای باشگاه', to: '/dashboard/loyalty/customers' },
    { label: 'ثبت مشتری جدید', to: '/dashboard/loyalty/customers/new' },
    { label: 'ثبت سفارش تلفنی', to: '/dashboard/loyalty/phone-order' },
    { label: 'امتیازات مشتریان', to: '/dashboard/loyalty/points' },
    { label: 'کیف پول مشتریان', to: '/dashboard/loyalty/wallets' },
    { label: 'سطوح عضویت', to: '/dashboard/loyalty/tiers', owner: true },
    { label: 'جوایز و پاداش‌ها', to: '/dashboard/loyalty/rewards' },
    { label: 'گزارش باشگاه', to: '/dashboard/loyalty/reports', owner: true },
    { label: 'تنظیمات باشگاه', to: '/dashboard/loyalty/settings', owner: true },
  ].filter(item => !item.owner || canAccessFinancials.value) }] },
  { label: 'مالی', owner: true, items: [{ key: 'cost-management', label: 'مدیریت هزینه', icon: 'wallet', children: [
    { label: 'داشبورد هزینه', to: '/dashboard/cost-control/overview' },
    { label: 'هزینه‌ها', to: '/dashboard/cost-control/expenses' },
    { label: 'دسته‌بندی هزینه', to: '/dashboard/cost-control/expense-categories' },
    { label: 'قیمت مواد اولیه', to: '/dashboard/cost-control/materials' },
    { label: 'دستور تولید', to: '/dashboard/cost-control/products' },
    { label: 'هزینه تولید', to: '/dashboard/cost-control/production-costs' },
    { label: 'گزارش هزینه', to: '/dashboard/cost-control/reports' },
    { label: 'هزینه‌های سربار', to: '/dashboard/cost-control/overheads' },
  ] }] },
  { label: 'دسترسی‌ها', owner: true, items: [{ label: 'مدیریت مدیران', to: '/dashboard/admin-access', icon: 'admin' }] },
]
const visibleSections = computed(() => sections.filter(section => (!section.admin || isAdmin.value) && (!section.owner || canAccessFinancials.value)))
const initialGroups = []
if (route.path.startsWith('/dashboard/cost-control')) initialGroups.push('cost-management')
if (route.path.startsWith('/dashboard/loyalty')) initialGroups.push('loyalty-club')
const openGroups = ref(new Set(initialGroups))
function toggle() { emit('sidebar-collapsed', !props.isCollapsed) }
function isCurrent(item) { if (item.children) return item.children.some(isCurrent); return item.exact ? route.path === item.to : route.path === item.to || route.path.startsWith(`${item.to}/`) }
function isGroupOpen(item) { return openGroups.value.has(item.key) }
function toggleGroup(item) { if (props.isCollapsed && !props.isMobileOpen) emit('sidebar-collapsed', false); openGroups.value = openGroups.value.has(item.key) && !props.isCollapsed ? new Set() : new Set([item.key]) }
watch(() => route.path, path => { if (path.startsWith('/dashboard/cost-control')) openGroups.value = new Set(['cost-management']); else if (path.startsWith('/dashboard/loyalty')) openGroups.value = new Set(['loyalty-club']) })
function logout() { auth.logout(); emit('close-mobile-sidebar'); router.push('/login') }
</script>

<style scoped>
.sidebar{grid-area:sidebar;position:sticky;top:0;z-index:30;height:100vh;height:100dvh;width:var(--sidebar-width);display:flex;flex-direction:column;background:var(--surface-raised);border-left:1px solid var(--border);box-shadow:-5px 0 22px #30201306;transition:width .18s ease;overflow:hidden}
.sidebar.collapsed{width:var(--sidebar-collapsed-width)}
.sidebar-brand{min-height:104px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:18px 20px;background:var(--brand-panel);color:var(--on-brand);border-radius:0 0 0 28px;white-space:nowrap}
.sidebar-brand strong{display:block;font-size:1.45rem;line-height:1.55;color:var(--on-brand);letter-spacing:-.04em}
.sidebar-brand span{display:block;font-size:.75rem;color:var(--on-brand);opacity:.78}
.sidebar-brand .icon-btn.admin-icon-button{width:32px!important;height:32px!important;border-color:#ffffff26!important;background:#ffffff0c;color:var(--on-brand)}
.sidebar nav{flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;padding:10px 14px 24px;scrollbar-width:thin}
.section-title{display:flex;align-items:center;gap:.6rem;margin:22px 8px 10px;font-size:.68rem;color:var(--muted);font-weight:600}
.section-title::after{content:'';height:1px;background:var(--border);flex:1}
.section-title:first-child{margin-top:8px}
.nav-link{width:100%;display:flex;align-items:center;gap:13px;min-height:48px;padding:12px 14px;margin:5px 0;border:1px solid transparent;border-radius:14px;background:transparent;color:var(--text);text-decoration:none;white-space:nowrap;font:700 .86rem/1.5 var(--font-family-primary);text-align:right;cursor:pointer;transition:var(--control-transition)}
.nav-link:hover{background:var(--surface-hover)}
.nav-link.active{background:var(--primary);color:var(--on-primary);border-color:var(--primary);box-shadow:0 7px 16px #47301d18}
.nav-icon{width:21px;height:21px;color:var(--primary)}
.nav-link.active .nav-icon,.nav-link.active .chevron{color:inherit}
.parent-label{flex:1}
.chevron{width:14px;height:14px;color:var(--muted);transform:rotate(-90deg);transition:transform .16s ease}
.chevron.expanded{transform:rotate(90deg)}
.submenu{display:grid;gap:3px;margin:6px 24px 10px 0;padding-right:15px;border-right:1px solid var(--border-strong)}
.submenu-link{display:flex;align-items:center;min-height:36px;padding:7px 10px;border-radius:10px;color:var(--muted);text-decoration:none;font-size:.8rem}
.submenu-link:hover{background:var(--surface-hover);color:var(--text)}
.submenu-link.active{background:var(--surface-hover);color:var(--primary);font-weight:700}
.sidebar-footer{flex:0 0 auto;margin-top:auto;padding:6px 14px 14px;display:flex;flex-direction:column;gap:8px;overflow:hidden;border-top:0;font-size:.8rem;background:var(--surface-raised)}
.sidebar-user{display:flex;align-items:center;gap:.5rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);padding-inline:8px}
.sidebar-footer .logout{width:100%;flex:none;justify-content:flex-start;gap:12px;background:var(--surface);border:1px solid var(--border);color:var(--primary);border-radius:14px!important;min-height:46px!important;font-weight:800}
.sidebar-footer .logout:hover{background:var(--surface-hover)}
.sidebar.collapsed .sidebar-brand{padding:20px;justify-content:center}
.sidebar.collapsed nav{padding-inline:10px}
.sidebar.collapsed .nav-link{justify-content:center;padding:12px}
.sidebar.collapsed .sidebar-footer{padding:10px}
.sidebar.collapsed .logout{justify-content:center}
@media(max-width:900px){.sidebar{position:fixed;right:0;z-index:60;transform:translateX(100%);width:min(300px,84vw);box-shadow:var(--shadow);transition:transform .18s ease}.sidebar.open{transform:translateX(0)}.sidebar.collapsed{width:min(300px,84vw)}.sidebar.collapsed .sidebar-brand{justify-content:space-between}.sidebar.collapsed .nav-link,.sidebar.collapsed .logout{justify-content:flex-start}}
@media(prefers-reduced-motion:reduce){.sidebar,.chevron{transition:none}}
</style>
