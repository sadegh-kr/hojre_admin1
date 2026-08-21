<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed, open: isMobileOpen }" dir="rtl">
    <div class="sidebar-brand"><div v-if="!isCollapsed || isMobileOpen"><strong>کافه‌حجره</strong><span>پنل مدیریت</span></div><button class="icon-btn" @click="toggle" :aria-label="isCollapsed ? 'باز کردن سایدبار' : 'بستن سایدبار'">☰</button></div>
    <nav><template v-for="section in visibleSections" :key="section.label"><p v-if="!isCollapsed || isMobileOpen" class="section-title">{{ section.label }}</p><template v-for="item in section.items" :key="item.key || item.to"><div v-if="item.children" class="nav-group" :class="{ active: isCurrent(item) }"><button type="button" class="nav-link nav-parent" :class="{ active: isCurrent(item) }" :aria-expanded="isGroupOpen(item)" @click="toggleGroup(item)"><span class="nav-icon">{{ item.icon }}</span><span v-if="!isCollapsed || isMobileOpen" class="parent-label">{{ item.label }}</span><span v-if="!isCollapsed || isMobileOpen" class="chevron">{{ isGroupOpen(item) ? '⌃' : '⌄' }}</span></button><div v-if="isGroupOpen(item) && (!isCollapsed || isMobileOpen)" class="submenu"><RouterLink v-for="child in item.children" :key="child.to" :to="child.to" class="submenu-link" :class="{ active: isCurrent(child) }" @click="$emit('close-mobile-sidebar')"><span>{{ child.label }}</span></RouterLink></div></div><RouterLink v-else :to="item.to" class="nav-link" :class="{ active: isCurrent(item) }" @click="$emit('close-mobile-sidebar')"><span class="nav-icon">{{ item.icon }}</span><span v-if="!isCollapsed || isMobileOpen">{{ item.label }}</span></RouterLink></template></template></nav>
    <div class="sidebar-footer"><span v-if="!isCollapsed || isMobileOpen">{{ userName }}</span><button class="logout" @click="logout">خروج</button></div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
const props = defineProps({ isMobileOpen: Boolean, isCollapsed: Boolean })
const emit = defineEmits(['sidebar-collapsed', 'close-mobile-sidebar'])
const router = useRouter(), route = useRoute(), auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)
const canAccessFinancials = computed(() => auth.canAccessFinancials)
const userName = computed(() => auth.user?.fullname || auth.user?.full_name || auth.user?.phone_number || 'مدیر')
const sections = [
  { label: 'اصلی', items: [{ label: 'داشبورد', to: '/dashboard', icon: '⌂', exact: true }, { label: 'سفارش‌ها', to: '/dashboard/restaurant_list', icon: '☕' }, { label: 'مشتریان', to: '/dashboard/user-list', icon: '♙' }, { label: 'اقلام منو', to: '/dashboard/item-list', icon: '☷' }] },
  { label: 'مالی', owner: true, items: [{ key: 'cost-management', label: 'مدیریت هزینه', icon: '◈', children: [
    { label: 'داشبورد هزینه', to: '/dashboard/cost-control/overview' },
    { label: 'هزینه‌ها', to: '/dashboard/cost-control/expenses' },
    { label: 'دسته‌بندی هزینه', to: '/dashboard/cost-control/expense-categories' },
    { label: 'قیمت مواد اولیه', to: '/dashboard/cost-control/materials' },
    { label: 'دستور تولید', to: '/dashboard/cost-control/products' },
    { label: 'هزینه تولید', to: '/dashboard/cost-control/production-costs' },
    { label: 'گزارش هزینه', to: '/dashboard/cost-control/reports' },
    { label: 'هزینه‌های سربار', to: '/dashboard/cost-control/overheads' },
  ] }] },
  { label: 'دسترسی‌ها', owner: true, items: [{ label: 'مدیریت مدیران', to: '/dashboard/admin-access', icon: '⚿' }] },
]
const visibleSections = computed(() => sections.filter(section => (!section.admin || isAdmin.value) && (!section.owner || canAccessFinancials.value)))
const openGroups = ref(new Set(route.path.startsWith('/dashboard/cost-control') ? ['cost-management'] : []))
function toggle() { emit('sidebar-collapsed', !props.isCollapsed) }
function isCurrent(item) { if (item.children) return item.children.some(isCurrent); return item.exact ? route.path === item.to : route.path === item.to || route.path.startsWith(`${item.to}/`) }
function isGroupOpen(item) { return openGroups.value.has(item.key) }
function toggleGroup(item) { if (props.isCollapsed && !props.isMobileOpen) emit('sidebar-collapsed', false); const next = new Set(openGroups.value); if (next.has(item.key) && !props.isCollapsed) next.delete(item.key); else next.add(item.key); openGroups.value = next }
watch(() => route.path, path => { if (path.startsWith('/dashboard/cost-control')) { const next = new Set(openGroups.value); next.add('cost-management'); openGroups.value = next } })
function logout() { auth.logout(); emit('close-mobile-sidebar'); router.push('/login') }
</script>

<style scoped>.sidebar{grid-area:sidebar;position:sticky;top:0;z-index:30;height:100vh;width:var(--sidebar-width);display:flex;flex-direction:column;background:var(--surface);border-left:1px solid var(--border);transition:width .2s ease;overflow:hidden}.sidebar.collapsed{width:var(--sidebar-collapsed-width)}.sidebar-brand{height:72px;display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:0 1rem;border-bottom:1px solid var(--border);white-space:nowrap}.sidebar-brand strong{display:block;color:var(--primary)}.sidebar-brand span,.section-title{font-size:.75rem;color:var(--muted)}.icon-btn,.logout{border:0;background:var(--surface-subtle);color:var(--text);border-radius:8px;cursor:pointer;padding:.5rem}.sidebar nav{flex:1;overflow-y:auto;padding:.8rem .55rem}.section-title{margin:1rem .55rem .45rem;font-size:.72rem;font-weight:bold}.nav-link{width:100%;display:flex;align-items:center;gap:.75rem;min-height:44px;padding:.65rem .75rem;margin:.2rem 0;border:0;border-radius:9px;background:transparent;color:var(--text);text-decoration:none;white-space:nowrap;font:inherit;text-align:right;cursor:pointer}.nav-link:hover{background:var(--surface-subtle)}.nav-link.active{background:var(--focus);color:var(--primary);font-weight:700}.nav-icon{width:22px;text-align:center;font-size:1.1rem}.parent-label{flex:1}.chevron{color:var(--muted);font-size:.75rem}.nav-group.active>.nav-parent{color:var(--primary)}.submenu{display:grid;gap:2px;margin:.15rem 2.15rem .45rem .2rem;padding-right:.65rem;border-right:1px solid var(--border)}.submenu-link{display:flex;align-items:center;min-height:34px;padding:.4rem .65rem;border-radius:7px;color:var(--muted);text-decoration:none;font-size:.76rem}.submenu-link:hover{background:var(--surface-subtle);color:var(--text)}.submenu-link.active{background:var(--focus);color:var(--primary);font-weight:700}.sidebar-footer{padding:1rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem;border-top:1px solid var(--border);white-space:nowrap;font-size:.8rem}.logout{color:var(--danger)}@media(max-width:900px){.sidebar{position:fixed;right:0;transform:translateX(100%);width:min(300px,84vw);box-shadow:var(--shadow)}.sidebar.open{transform:translateX(0)}.sidebar.collapsed{width:min(300px,84vw)}.sidebar.collapsed .sidebar-brand>div,.sidebar.collapsed .nav-link span:not(.nav-icon),.sidebar.collapsed .section-title,.sidebar.collapsed .sidebar-footer span{display:block}}</style>
