<template>
  <section class="admin-list-page" dir="rtl">
    <header class="page-heading"><div><h2>سفارش‌ها</h2><p>مدیریت و پیگیری سفارش‌های این شعبه</p></div><button class="icon-button" :disabled="loading" @click="fetchOrders" title="به‌روزرسانی">↻</button></header>
    <form class="filter-panel" @submit.prevent="applyFilters"><label class="search-field"><span>جستجو در سفارش یا مشتری</span><input v-model.trim="draft.search" placeholder="شماره سفارش، نام یا تلفن" @input="debouncedApply" /></label><label><span>نوع سفارش</span><select v-model="draft.order_type" @change="applyFilters"><option value="online">آنلاین</option><option value="in_store">داخل فروشگاه</option></select></label><label><span>وضعیت</span><select v-model="draft.status" @change="applyFilters"><option value="">همه وضعیت‌ها</option><option value="pending">در انتظار تأیید</option><option value="prep">در حال آماده‌سازی</option><option value="send">در حال ارسال</option><option value="deliver">تحویل‌شده</option><option value="cancel">لغوشده</option></select></label><label><span>روش تحویل</span><select v-model="draft.delivery" @change="applyFilters"><option value="">همه روش‌ها</option><option value="takeoutN">حضوری (آنی)</option><option value="takeoutP">حضوری (پیش‌سفارش)</option><option value="dine-in">مصرف در محل</option></select></label><label><span>حداقل مبلغ</span><input v-model="draft.min_total" type="number" min="0" @input="debouncedApply" /></label><label><span>حداکثر مبلغ</span><input v-model="draft.max_total" type="number" min="0" @input="debouncedApply" /></label><button class="primary-button" type="submit">اعمال فیلتر</button><button v-if="hasFilters" class="text-button" type="button" @click="clearFilters">پاک کردن</button></form>
    <AdminDataTable title="فهرست سفارش‌ها" :rows="rows" :columns="columns" :total="total" :page="page" :page-size="pageSize" :sort="ordering" :loading="loading" :initial-loading="initialLoading" :error="error" :has-filters="hasFilters" empty-title="سفارشی پیدا نشد" empty-description="فیلترها را تغییر دهید یا بعداً دوباره تلاش کنید." @sort="setSort" @page="setPage" @page-size="setPageSize" @retry="fetchOrders" @clear="clearFilters">
      <template #cell-order_number="{ row }"><strong>#{{ formatNumber(row.order_number) }}</strong><small>{{ row.customer?.name || 'مشتری ثبت‌نشده' }}</small></template>
      <template #cell-customer_phone="{ row }"><a v-if="row.customer?.phone_number" class="phone" :href="`tel:${row.customer.phone_number}`">{{ row.customer.phone_number }}</a><span v-else>—</span></template>
      <template #cell-status="{ row }"><span :class="['status', row.status]">{{ statusLabel(row.status) }}</span></template>
      <template #cell-delivery="{ row }">{{ deliveryLabel(row.delivery) }}</template>
      <template #cell-total_cost="{ row }"><span class="money">{{ formatMoney(row.total_cost) }}</span></template>
      <template #cell-net_cost="{ row }"><span class="money">{{ formatMoney(row.net_cost) }}</span></template>
      <template #cell-created="{ row }">{{ formatDate(row.created) }}</template>
      <template #mobile-title="{ row }">سفارش #{{ formatNumber(row.order_number) }}</template>
      <template #actions="{ row }"><button class="row-action" @click="openOrder(row.id)">جزئیات</button><button v-if="hasLocation(row)" class="map-action" @click="openMap(row)">نقشه</button></template>
    </AdminDataTable>
    <OrderDetailsModal v-if="selectedId" v-model="showModal" :order-id="selectedId" @close="selectedId = null" @status-updated="handleStatusUpdated" />
    <CostToastHost />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import OrderDetailsModal from '@/components/modals/orderes/OrderDetailsModal.vue'
import CostToastHost from '@/components/cost/CostToastHost.vue'
import OrderAPI from '@/api/order.api.js'

const route = useRoute(), restaurantId = computed(() => route.params.restaurantId)
const rows = ref([]), total = ref(0), page = ref(1), pageSize = ref(10), ordering = ref('-created'), loading = ref(false), initialLoading = ref(true), error = ref(''), selectedId = ref(null), showModal = ref(false)
const draft = reactive({ search: '', order_type: 'online', status: '', delivery: '', min_total: '', max_total: '' })
const applied = reactive({ ...draft })
const columns = [{ key: 'order_number', label: 'سفارش', sortable: true }, { key: 'customer_phone', label: 'تماس مشتری', mobile: false }, { key: 'status', label: 'وضعیت', sortable: true }, { key: 'delivery', label: 'تحویل', sortable: true }, { key: 'total_cost', label: 'مبلغ کل', sortable: true }, { key: 'net_cost', label: 'مبلغ نهایی', sortable: true, mobile: false }, { key: 'created', label: 'تاریخ ثبت', sortable: true }]
let timer
const hasFilters = computed(() => applied.search || applied.status || applied.delivery || applied.min_total || applied.max_total)
function params() { const value = { page: page.value, page_size: pageSize.value, ordering: ordering.value, order_type: applied.order_type }; if (applied.search) { if (/^\d+$/.test(applied.search)) value.order_number = applied.search; else value.customer = applied.search } if (applied.status) value.status = applied.status; if (applied.delivery) value.delivery = applied.delivery; if (applied.min_total !== '') value.total_cost__gte = applied.min_total; if (applied.max_total !== '') value.total_cost__lte = applied.max_total; return value }
async function fetchOrders() { if (!restaurantId.value) { error.value = 'شناسه شعبه مشخص نیست.'; initialLoading.value = false; return } loading.value = true; error.value = ''; try { const { data } = await OrderAPI.getOrdersByRestaurant(restaurantId.value, params()); rows.value = data.results || []; total.value = data.count || 0; page.value = data.page || page.value } catch (err) { error.value = err.response?.data?.message || err.response?.data?.error || 'ارتباط با سرور برقرار نشد.' } finally { loading.value = false; initialLoading.value = false } }
function applyFilters() { Object.assign(applied, draft); page.value = 1; fetchOrders() }
function debouncedApply() { clearTimeout(timer); timer = setTimeout(applyFilters, 450) }
function clearFilters() { Object.assign(draft, { search: '', order_type: draft.order_type, status: '', delivery: '', min_total: '', max_total: '' }); Object.assign(applied, draft); page.value = 1; fetchOrders() }
function setPage(value) { page.value = value; fetchOrders() }
function setPageSize(value) { pageSize.value = value; page.value = 1; fetchOrders() }
function setSort(value) { ordering.value = value; page.value = 1; fetchOrders() }
function openOrder(id) { selectedId.value = id; showModal.value = true }
function handleStatusUpdated(order) { const index = rows.value.findIndex(row => row.id === order.id); if (index >= 0) rows.value[index] = { ...rows.value[index], status: order.status }; fetchOrders() }
function hasLocation(row) { return Boolean(row.address?.location?.latitude && row.address?.location?.longitude) }
function openMap(row) { window.open(`https://www.google.com/maps?q=${row.address.location.latitude},${row.address.location.longitude}&hl=fa`, '_blank', 'noopener') }
function formatNumber(value) { return Number(value || 0).toLocaleString('fa-IR') }
function formatMoney(value) { return `${formatNumber(value)} تومان` }
function formatDate(value) { return value ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(value)) : '—' }
const statusLabel = value => ({ pending: 'در انتظار تأیید', prep: 'در حال آماده‌سازی', send: 'در حال ارسال', deliver: 'تحویل‌شده', cancel: 'لغوشده' })[value] || value
const deliveryLabel = value => ({ takeoutN: 'حضوری (آنی)', takeoutP: 'حضوری (پیش‌سفارش)', 'dine-in': 'مصرف در محل', delivery: 'ارسال' })[value] || value
onMounted(fetchOrders); onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.admin-list-page{display:grid;gap:1rem}.page-heading{display:flex;align-items:center;justify-content:space-between}.page-heading h2{margin:0;color:var(--text);font-size:1.4rem}.page-heading p{margin:.35rem 0 0;color:var(--muted);font-size:.88rem}.filter-panel{display:flex;align-items:end;gap:.75rem;flex-wrap:wrap;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow)}label{display:grid;gap:.35rem;min-width:145px;flex:1;color:var(--muted);font-size:.8rem}.search-field{min-width:min(100%,260px);flex:2}input,select{width:100%;min-height:40px;padding:.55rem .65rem;border:1px solid var(--border-strong);border-radius:8px;background:var(--input);color:var(--text);outline:0}input:focus,select:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--focus)}.primary-button,.icon-button,.text-button,.row-action,.map-action{min-height:40px;border-radius:8px;padding:.55rem .8rem;cursor:pointer;font:inherit}.primary-button{border:1px solid var(--primary);background:var(--primary);color:#fff}.text-button{border:0;background:transparent;color:var(--primary)}.icon-button{width:40px;border:1px solid var(--border);background:var(--surface);color:var(--text)}.row-action{border:1px solid var(--primary);background:transparent;color:var(--primary);white-space:nowrap}.map-action{border:1px solid var(--border-strong);background:var(--surface-subtle);color:var(--text);margin-right:.4rem}.phone{color:var(--primary);text-decoration:none;direction:ltr;display:inline-block}.money{font-weight:700;white-space:nowrap}.status{display:inline-block;padding:.3rem .55rem;border-radius:999px;font-size:.78rem;font-weight:700;white-space:nowrap}.status.pending{color:#a16207;background:#fef3c7}.status.prep{color:#1d4ed8;background:#dbeafe}.status.send{color:#7c3aed;background:#ede9fe}.status.deliver{color:#15803d;background:#dcfce7}.status.cancel{color:#b91c1c;background:#fee2e2}small{display:block;color:var(--muted);margin-top:.25rem}@media(max-width:720px){.filter-panel{display:grid;grid-template-columns:1fr}.filter-panel>*{width:100%}.map-action{margin-right:0}}
</style>
