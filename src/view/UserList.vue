<template>
  <section class="admin-list-page" dir="rtl">
    <header class="page-heading"><div><h2>مشتریان</h2><p>جستجو، فیلتر و مشاهده اطلاعات مشتریان</p></div><button class="icon-button" :disabled="loading" @click="fetchCustomers" title="به‌روزرسانی">↻</button></header>
    <form class="filter-panel" @submit.prevent="applyFilters"><label class="search-field"><span>جستجو</span><input v-model.trim="draft.search" placeholder="نام یا شماره تلفن" @input="debouncedApply" /></label><label><span>وضعیت آدرس</span><select v-model="draft.has_address" @change="applyFilters"><option value="">همه مشتریان</option><option value="true">دارای آدرس</option><option value="false">بدون آدرس</option></select></label><label><span>حداقل سفارش تحویل‌شده</span><input v-model="draft.min_delivered_orders" type="number" min="0" @input="debouncedApply" /></label><button class="primary-button" type="submit">اعمال فیلتر</button><button v-if="hasFilters" class="text-button" type="button" @click="clearFilters">پاک کردن</button></form>
    <AdminDataTable title="فهرست مشتریان" :rows="rows" :columns="columns" :total="total" :page="page" :page-size="pageSize" :sort="ordering" :loading="loading" :initial-loading="initialLoading" :error="error" :has-filters="hasFilters" empty-title="مشتری‌ای پیدا نشد" empty-description="فیلترها را تغییر دهید یا بعداً دوباره تلاش کنید." @sort="setSort" @page="setPage" @page-size="setPageSize" @retry="fetchCustomers" @clear="clearFilters">
      <template #cell-name="{ row }"><strong>{{ row.name || 'بدون نام' }}</strong><small v-if="row.restaurant_name">{{ row.restaurant_name }}</small></template>
      <template #cell-phone_number="{ row }"><a class="phone" :href="`tel:${row.phone_number}`">{{ row.phone_number }}</a></template>
      <template #cell-address_count="{ row }"><span class="count-pill">{{ formatNumber(row.address_count) }} آدرس</span></template>
      <template #cell-delivered_orders_count="{ row }"><span class="count-pill">{{ formatNumber(row.delivered_orders_count) }} سفارش</span></template>
      <template #cell-wallet_balance="{ row }"><span :class="['money', { negative: Number(row.wallet_balance) < 0 }]">{{ formatMoney(row.wallet_balance) }}</span></template>
      <template #cell-created="{ row }">{{ formatDate(row.created) }}</template>
      <template #mobile-title="{ row }">{{ row.name || row.phone_number }}</template>
      <template #actions="{ row }"><button class="row-action" @click="openCustomer(row.id)">مشاهده</button></template>
    </AdminDataTable>
    <UserDetailsModal v-if="selectedId" v-model="showModal" :user-id="selectedId" @close="selectedId = null" />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import UserDetailsModal from '@/components/modals/user/UserDetailsModal.vue'
import UserAPI from '@/api/user.api.js'

const rows = ref([]), total = ref(0), page = ref(1), pageSize = ref(10), ordering = ref('-created'), loading = ref(false), initialLoading = ref(true), error = ref(''), selectedId = ref(null), showModal = ref(false)
const draft = reactive({ search: '', has_address: '', min_delivered_orders: '' })
const applied = reactive({ search: '', has_address: '', min_delivered_orders: '' })
const columns = [{ key: 'name', label: 'مشتری', sortable: true }, { key: 'phone_number', label: 'شماره تماس', sortable: true }, { key: 'address_count', label: 'آدرس‌ها', mobile: false }, { key: 'delivered_orders_count', label: 'سفارش تحویل‌شده', sortable: true }, { key: 'wallet_balance', label: 'کیف پول', sortable: true }, { key: 'created', label: 'عضویت', sortable: true, mobile: false }]
let timer
const hasFilters = computed(() => Object.values(applied).some(Boolean))
function params() { const value = { page: page.value, page_size: pageSize.value, ordering: ordering.value }; Object.entries(applied).forEach(([key, item]) => { if (item !== '') value[key] = item }); return value }
async function fetchCustomers() { loading.value = true; error.value = ''; try { const { data } = await UserAPI.getCustomerList(params()); rows.value = data.results || []; total.value = data.count || 0; page.value = data.page || page.value } catch (err) { error.value = err.response?.data?.message || err.response?.data?.error || 'ارتباط با سرور برقرار نشد.' } finally { loading.value = false; initialLoading.value = false } }
function applyFilters() { Object.assign(applied, draft); page.value = 1; fetchCustomers() }
function debouncedApply() { clearTimeout(timer); timer = setTimeout(applyFilters, 450) }
function clearFilters() { Object.keys(draft).forEach(key => { draft[key] = ''; applied[key] = '' }); page.value = 1; fetchCustomers() }
function setPage(value) { page.value = value; fetchCustomers() }
function setPageSize(value) { pageSize.value = value; page.value = 1; fetchCustomers() }
function setSort(value) { ordering.value = value; page.value = 1; fetchCustomers() }
function openCustomer(id) { selectedId.value = id; showModal.value = true }
function formatDate(value) { return value ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeZone: 'Asia/Tehran' }).format(new Date(value)) : '—' }
function formatNumber(value) { return Number(value || 0).toLocaleString('fa-IR') }
function formatMoney(value) { return `${formatNumber(value)} تومان` }
onMounted(fetchCustomers); onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.admin-list-page{display:grid;gap:1rem}.page-heading{display:flex;align-items:center;justify-content:space-between}.page-heading h2{margin:0;color:var(--text);font-size:1.4rem}.page-heading p{margin:.35rem 0 0;color:var(--muted);font-size:.88rem}.filter-panel{display:flex;align-items:end;gap:.75rem;flex-wrap:wrap;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow)}label{display:grid;gap:.35rem;min-width:150px;flex:1;color:var(--muted);font-size:.8rem}.search-field{min-width:min(100%,280px);flex:2}input,select{width:100%;min-height:40px;padding:.55rem .65rem;border:1px solid var(--border-strong);border-radius:8px;background:var(--input);color:var(--text);outline:0}input:focus,select:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--focus)}.primary-button,.icon-button,.text-button,.row-action{min-height:40px;border-radius:8px;padding:.55rem .8rem;cursor:pointer;font:inherit}.primary-button{border:1px solid var(--primary);background:var(--primary);color:#fff}.text-button{border:0;background:transparent;color:var(--primary)}.icon-button{width:40px;border:1px solid var(--border);background:var(--surface);color:var(--text)}.row-action{border:1px solid var(--primary);background:transparent;color:var(--primary);white-space:nowrap}.phone{color:var(--primary);text-decoration:none;direction:ltr;display:inline-block}.count-pill{padding:.3rem .5rem;border-radius:99px;background:var(--surface-subtle);color:var(--muted);white-space:nowrap}.money{font-weight:700;white-space:nowrap}.money.negative{color:var(--danger)}small{display:block;color:var(--muted);margin-top:.25rem}@media(max-width:720px){.filter-panel{display:grid;grid-template-columns:1fr}.filter-panel>*{width:100%}}
</style>
