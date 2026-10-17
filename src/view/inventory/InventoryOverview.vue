<template>
  <section class="cost-page inventory-page">
    <header class="cost-page-heading">
      <div>
        <h2>{{ isWasteView ? 'ضایعات' : 'موجودی و گردش انبار' }}</h2>
        <p>{{ isWasteView ? 'گزارش ضایعات ثبت‌شده و هزینه مرتبط با آن‌ها.' : 'نمای فقط‌خواندنی موجودی مواد و آخرین گردش‌های ثبت‌شده.' }}</p>
      </div>
      <button class="cost-secondary" type="button" :disabled="loading" @click="load">به‌روزرسانی</button>
    </header>

    <div class="inventory-scope" role="note">
      این اطلاعات در معماری فعلی به شعبه تفکیک نمی‌شود و نباید به‌عنوان موجودی اختصاصی شعبه طالقانی تفسیر شود.
      ثبت ورود، خروج و اصلاح موجودی همچنان باید از گردش‌های مجاز سامانه انجام شود؛ ویرایش قیمت ماده، رسید انبار نیست.
    </div>

    <nav class="inventory-tabs" aria-label="بخش‌های انبار">
      <RouterLink to="/dashboard/inventory">موجودی و گردش</RouterLink>
      <RouterLink to="/dashboard/inventory/waste">ضایعات</RouterLink>
      <RouterLink to="/dashboard/inventory/materials">تعریف مواد اولیه</RouterLink>
    </nav>

    <div v-if="error" class="cost-notice" role="alert">{{ error }} <button type="button" @click="load">تلاش مجدد</button></div>
    <div v-if="loading" class="dashboard-loading">در حال دریافت اطلاعات انبار…</div>

    <template v-else-if="!isWasteView">
      <div class="inventory-summary" aria-label="خلاصه موجودی تجمیعی">
        <article><span>اقلام فعال</span><strong>{{ number(summary.total_items) }}</strong></article>
        <article><span>موجود</span><strong>{{ number(summary.available) }}</strong></article>
        <article><span>کم‌موجود</span><strong>{{ number(summary.low) }}</strong></article>
        <article><span>ناموجود یا منفی</span><strong>{{ number(Number(summary.zero || 0) + Number(summary.negative || 0)) }}</strong></article>
      </div>

      <form class="cost-filter" @submit.prevent="applyFilters">
        <input v-model.trim="draftSearch" aria-label="جستجوی ماده اولیه" placeholder="جستجوی نام، کد یا دسته‌بندی" />
        <select v-model="draftStatus" aria-label="وضعیت موجودی">
          <option value="">همه وضعیت‌ها</option>
          <option value="available">موجود</option>
          <option value="low">کم‌موجود</option>
          <option value="zero">ناموجود</option>
          <option value="negative">موجودی منفی</option>
        </select>
        <button class="cost-primary" type="submit">اعمال فیلتر</button>
      </form>

      <section class="inventory-card">
        <header><h3>موجودی ثبت‌شده مواد</h3><small>مقادیر پایه و تجمیعی سامانه</small></header>
        <div class="inventory-table inventory-items">
          <div class="table-head"><span>ماده</span><span>موجودی</span><span>حد هشدار</span><span>وضعیت</span><span>آخرین فعالیت</span></div>
          <article v-for="item in items" :key="item.id">
            <strong>{{ item.name }}</strong>
            <span>{{ quantity(item.current_quantity) }} {{ item.unit_display }}</span>
            <span>{{ quantity(item.low_stock_threshold) }} {{ item.unit_display }}</span>
            <span :class="['stock-status', item.stock_status]">{{ stockLabel(item.stock_status) }}</span>
            <span>{{ date(item.last_activity) }}</span>
          </article>
          <p v-if="!items.length" class="empty-resource">ماده‌ای با این فیلتر پیدا نشد.</p>
        </div>
        <div v-if="itemPagination.total_pages > 1" class="resource-pagination">
          <button class="cost-secondary" type="button" :disabled="!itemPagination.has_previous" @click="changeItemPage(itemPagination.page - 1)">قبلی</button>
          <span>صفحه {{ number(itemPagination.page) }} از {{ number(itemPagination.total_pages) }}</span>
          <button class="cost-secondary" type="button" :disabled="!itemPagination.has_next" @click="changeItemPage(itemPagination.page + 1)">بعدی</button>
        </div>
      </section>

      <section class="inventory-card">
        <header><h3>آخرین گردش‌ها</h3><small>بدون امکان ثبت یا اصلاح از این نمای محدود</small></header>
        <div class="inventory-table inventory-movements">
          <div class="table-head"><span>ماده</span><span>نوع گردش</span><span>مقدار</span><span>مانده پس از گردش</span><span>زمان</span></div>
          <article v-for="movement in movements" :key="movement.id">
            <strong>{{ movement.ingredient_name }}</strong>
            <span>{{ movement.movement_type_display }}</span>
            <span :class="Number(movement.movement_quantity) < 0 ? 'negative-quantity' : 'positive-quantity'">{{ signedQuantity(movement.movement_quantity) }} {{ movement.unit_display }}</span>
            <span>{{ quantity(movement.balance_after) }} {{ movement.unit_display }}</span>
            <span>{{ date(movement.occurred_at) }}</span>
          </article>
          <p v-if="!movements.length" class="empty-resource">گردش موجودی ثبت نشده است.</p>
        </div>
      </section>
    </template>

    <template v-else>
      <div class="inventory-summary waste-summary" aria-label="خلاصه ضایعات تجمیعی">
        <article><span>تعداد ثبت‌ها</span><strong>{{ number(wasteRows.length) }}</strong></article>
        <article><span>مقدار تجمیعی</span><strong>{{ quantity(wasteSummary.quantity) }}</strong><small>ممکن است شامل واحدهای متفاوت باشد</small></article>
        <article><span>هزینه ضایعات</span><strong>{{ money(wasteSummary.cost) }}</strong></article>
      </div>
      <section class="inventory-card">
        <header><h3>ضایعات ثبت‌شده</h3><small>این صفحه گزارش است و گردش جدید ایجاد نمی‌کند.</small></header>
        <div class="inventory-table waste-table">
          <div class="table-head"><span>ماده</span><span>مقدار</span><span>علت</span><span>هزینه</span><span>زمان</span></div>
          <article v-for="row in wasteRows" :key="row.id">
            <strong>{{ row.ingredient }}</strong>
            <span>{{ quantity(row.quantity) }} {{ unitLabel(row.unit) }}</span>
            <span>{{ wasteReason(row.reason) }}</span>
            <strong>{{ money(row.cost) }}</strong>
            <span>{{ date(row.occurred_at) }}</span>
          </article>
          <p v-if="!wasteRows.length" class="empty-resource">ضایعاتی ثبت نشده است.</p>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import API from '@/api/product-cost.api.js'
import { costErrorMessage, formatCostNumber as number, formatMoney as money } from '@/utils/costControl'

const route = useRoute()
const isWasteView = computed(() => route.meta.inventoryView === 'waste')
const loading = ref(false)
const error = ref('')
const items = ref([])
const movements = ref([])
const wasteRows = ref([])
const draftSearch = ref('')
const draftStatus = ref('')
const filters = reactive({ search: '', stock_status: '' })
const summary = reactive({ total_items: 0, available: 0, low: 0, zero: 0, negative: 0 })
const wasteSummary = reactive({ quantity: 0, cost: 0 })
const itemPagination = reactive({ page: 1, page_size: 20, total_pages: 1, has_next: false, has_previous: false })
let requestVersion = 0

async function load() {
  const version = ++requestVersion
  loading.value = true
  error.value = ''
  try {
    if (isWasteView.value) {
      const [overview, waste] = await Promise.all([API.inventoryOverview(), API.inventoryWaste()])
      if (version !== requestVersion) return
      Object.assign(summary, overview.summary || {})
      Object.assign(wasteSummary, waste.summary || {})
      wasteRows.value = waste.results || []
    } else {
      const [overview, itemData, movementData] = await Promise.all([
        API.inventoryOverview(),
        API.inventoryItems({ ...filters, page: itemPagination.page, page_size: itemPagination.page_size }),
        API.inventoryMovements({ page: 1, page_size: 12 }),
      ])
      if (version !== requestVersion) return
      Object.assign(summary, overview.summary || {})
      items.value = itemData.results || []
      movements.value = movementData.results || []
      Object.assign(itemPagination, itemData)
    }
  } catch (cause) {
    if (version === requestVersion) error.value = costErrorMessage(cause)
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

function applyFilters() {
  filters.search = draftSearch.value
  filters.stock_status = draftStatus.value
  itemPagination.page = 1
  load()
}

function changeItemPage(page) {
  itemPagination.page = page
  load()
}

const quantity = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 3 }).format(Number(value || 0))
const signedQuantity = value => `${Number(value) > 0 ? '+' : ''}${quantity(value)}`
const date = value => value ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(value)) : '—'
const stockLabel = value => ({ available: 'موجود', low: 'کم‌موجود', zero: 'ناموجود', negative: 'منفی' }[value] || 'نامشخص')
const unitLabel = value => ({ g: 'گرم', kg: 'کیلوگرم', ml: 'میلی‌لیتر', l: 'لیتر', each: 'عدد', item: 'عدد', package: 'بسته' }[value] || value || '')
const wasteReason = value => ({ expired: 'منقضی', spoiled: 'فاسد', preparation: 'آماده‌سازی', overproduction: 'تولید اضافه', burned: 'سوختگی', damaged: 'آسیب‌دیده', staff_error: 'خطای پرسنل', customer_return: 'برگشت مشتری', remake: 'ساخت مجدد', other: 'سایر' }[value] || value)

onMounted(load)
watch(() => route.fullPath, load)
</script>

<style scoped>
.inventory-page{min-width:0}.inventory-scope{padding:.85rem 1rem;border:1px solid color-mix(in srgb,var(--color-warning,#b7791f) 35%,var(--border));border-right:4px solid var(--color-warning,#b7791f);border-radius:var(--card-radius);background:color-mix(in srgb,var(--color-warning-subtle,#fff7df) 72%,var(--surface));color:var(--text);font-size:.8rem;line-height:1.9}.inventory-tabs{display:flex;gap:.5rem;flex-wrap:wrap}.inventory-tabs a{display:inline-flex;align-items:center;min-height:var(--control-height-sm);padding:.45rem .75rem;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface);color:var(--muted);text-decoration:none;font-size:.8rem;font-weight:700}.inventory-tabs a.router-link-exact-active{border-color:var(--primary);background:var(--primary);color:var(--on-primary)}.inventory-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.7rem}.inventory-summary article{display:grid;gap:.35rem;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--card-radius)}.inventory-summary span,.inventory-summary small{color:var(--muted);font-size:.75rem}.inventory-summary strong{font-size:1.15rem;color:var(--text)}.waste-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.inventory-card{min-width:0;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--card-radius)}.inventory-card>header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.75rem}.inventory-card h3{margin:0;font-size:1rem}.inventory-card header small{color:var(--muted);font-size:.72rem}.inventory-table{overflow-x:auto}.table-head,.inventory-table article{display:grid;grid-template-columns:minmax(150px,1.3fr) repeat(4,minmax(120px,1fr));align-items:center;gap:.75rem;min-width:720px;padding:.75rem}.table-head{background:var(--surface-subtle);color:var(--muted);font-size:.7rem;border-radius:var(--control-radius)}.inventory-table article{border-bottom:1px solid var(--border);font-size:.78rem}.stock-status{justify-self:start;padding:.2rem .55rem;border-radius:999px;font-weight:700}.stock-status.available{background:var(--color-success-subtle);color:var(--success-text)}.stock-status.low{background:color-mix(in srgb,var(--color-warning-subtle,#fff7df) 80%,var(--surface));color:var(--color-warning,#9a6700)}.stock-status.zero,.stock-status.negative{background:var(--color-danger-subtle);color:var(--danger-text)}.positive-quantity{color:var(--success-text)}.negative-quantity{color:var(--danger-text)}@media(max-width:800px){.inventory-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.cost-page-heading,.inventory-card>header{align-items:flex-start;flex-direction:column}}@media(max-width:480px){.inventory-summary,.waste-summary{grid-template-columns:1fr}.inventory-tabs{display:grid}.inventory-tabs a{width:100%}}
</style>
