<template>
  <section class="dashboard-page" dir="rtl">
    <header class="dashboard-heading">
      <div><h1>داشبورد مدیریت<span v-if="selectedRestaurantName"> · {{ selectedRestaurantName }}</span></h1><p>نمای عملکرد رستوران انتخاب‌شده در بازه زمانی</p></div>
      <button class="admin-button admin-button--secondary admin-button--sm" type="button" :disabled="loading || !restaurantContext.activeRestaurantId" @click="load"><AppIcon name="refresh" />{{ loading ? 'در حال به‌روزرسانی…' : 'به‌روزرسانی' }}</button>
    </header>
    <template v-if="restaurantContext.activeRestaurantId">
      <div class="dashboard-toolbar">
        <div class="dashboard-presets" role="group" aria-label="بازه گزارش">
          <button v-for="option in presets" :key="option.value" type="button" :class="{ selected: mode === option.value }" :aria-pressed="mode === option.value" :disabled="loading" @click="selectPreset(option.value)">{{ option.label }}</button>
        </div>
        <span class="dashboard-range"><AppIcon name="calendar" /><span>{{ rangeLabel }}</span></span>
        <form v-if="mode === 'custom'" class="dashboard-custom" @submit.prevent="applyCustom">
          <label>تاریخ شروع <JalaliDatePicker :model-value="filters.start_date" model-format="jYYYY/jMM/jDD" :clearable="false" placeholder="شروع" @update:model-value="setDate('start_date', $event)" /></label>
          <label>تاریخ پایان <JalaliDatePicker :model-value="filters.end_date" model-format="jYYYY/jMM/jDD" :clearable="false" placeholder="پایان" @update:model-value="setDate('end_date', $event)" /></label>
          <button class="admin-button admin-button--primary" type="submit" :disabled="loading">اعمال بازه</button>
        </form>
        <p v-if="filterError" class="dashboard-filter-error" role="alert">{{ filterError }}</p>
      </div>
      <div v-if="loading && !loaded" class="dashboard-message" role="status"><AppIcon name="clock" />در حال دریافت اطلاعات داشبورد…</div>
      <div v-else-if="error" class="dashboard-message dashboard-message--error" role="alert"><AppIcon name="bell" /><strong>دریافت اطلاعات ناموفق بود</strong><span>{{ error }}</span><button class="admin-button admin-button--primary" type="button" @click="load">تلاش مجدد</button></div>
      <template v-else-if="loaded && dashboard">
        <p v-if="loading" class="dashboard-refresh" role="status">در حال به‌روزرسانی داده‌ها…</p>
        <div class="dashboard-metrics" :aria-busy="loading">
          <DashboardMetricCard label="سفارش‌های در جریان" :value="dashboard.summary.orders.pending" icon="clock" tone="attention" hint="در انتظار، آماده‌سازی و ارسال" to="/dashboard/orders" action="بررسی سفارش‌ها" />
          <DashboardMetricCard v-if="financial" label="فروش سفارش‌های تحویل‌شده" :value="financial.sales" unit="تومان" icon="coins" tone="primary" hint="بر اساس تاریخ ثبت سفارش" />
          <DashboardMetricCard v-else label="در انتظار تأیید" :value="statusCount('pending')" icon="bell" tone="attention" hint="سفارش‌های ثبت‌شده در بازه" to="/dashboard/orders" action="بررسی سفارش‌ها" />
          <DashboardMetricCard label="همه سفارش‌ها" :value="dashboard.summary.orders.total" icon="bag" tone="orders" hint="شامل همه وضعیت‌ها در بازه" to="/dashboard/orders" action="مشاهده سفارش‌ها" />
          <DashboardMetricCard label="مشتریان تازه ثبت‌شده" :value="dashboard.summary.customers" icon="users" tone="customers" hint="ثبت‌نام در بازه؛ نه مشتریان یکتای سفارش‌دهنده" to="/dashboard/user-list" action="مشاهده مشتریان" />
        </div>

        <div class="dashboard-main-grid">
          <section class="dashboard-panel dashboard-attention">
            <div class="dashboard-section-heading"><h2><AppIcon name="bell" />نیازمند توجه</h2></div>
            <div v-if="attentionItems.length" class="dashboard-alerts">
              <div v-for="item in attentionItems" :key="item.key" class="dashboard-alert" :class="'dashboard-alert--' + item.key">
                <span class="dashboard-alert-icon"><AppIcon :name="item.key === 'stock' ? 'box' : item.key === 'pending' ? 'bell' : 'clock'" /></span>
                <div class="dashboard-alert-copy"><strong>{{ formatNumber(item.count) }} {{ item.title }}</strong><small>{{ item.description }}</small></div>
                <a v-if="item.key === 'stock'" href="#inventory-warnings" :aria-label="'مشاهده اقلام با موجودی کم'"><AppIcon name="chevron" /></a>
                <RouterLink v-else :to="item.to" :aria-label="item.action"><AppIcon name="chevron" /></RouterLink>
              </div>
            </div>
            <div v-else class="dashboard-empty dashboard-empty--positive"><AppIcon name="check" /><p>در بازه انتخابی سفارش باز یا هشدار موجودی ثبت نشده است.</p></div>
          </section>

          <section class="dashboard-panel dashboard-quick">
            <div class="dashboard-section-heading"><h2><AppIcon name="bolt" />دسترسی سریع</h2></div>
            <div class="dashboard-actions">
              <RouterLink to="/dashboard/item-list"><span class="dashboard-action-icon"><AppIcon name="plus" /></span><strong>ثبت سفارش حضوری</strong><small>سفارش جدید در کافه</small></RouterLink>
              <RouterLink v-if="auth.isAdmin" to="/dashboard/loyalty/phone-order"><span class="dashboard-action-icon"><AppIcon name="phone" /></span><strong>ثبت سفارش تلفنی</strong><small>ثبت سفارش از طریق تماس</small></RouterLink>
              <RouterLink to="/dashboard/user-list"><span class="dashboard-action-icon"><AppIcon name="users" /></span><strong>جستجوی مشتری</strong><small>مشاهده اطلاعات مشتریان</small></RouterLink>
              <RouterLink to="/dashboard/orders"><span class="dashboard-action-icon"><AppIcon name="orders" /></span><strong>مشاهده سفارش‌ها</strong><small>فهرست یکپارچه سفارش‌ها</small></RouterLink>
            </div>
          </section>

          <section class="dashboard-panel dashboard-trend">
            <div class="dashboard-section-heading"><h2><AppIcon name="chart" />{{ financial ? 'نمودار فروش' : 'نمودار سفارش‌ها' }}</h2><span>{{ financial ? 'سفارش‌های تحویل‌شده' : 'تعداد سفارش‌ها' }}</span></div>
            <DashboardTrendChart :rows="trendRows" :value-key="financial ? 'sales' : 'orders'" :unit="financial ? 'تومان' : 'سفارش'" />
            <div v-if="!trendRows.length" class="dashboard-empty dashboard-empty--chart"><AppIcon name="chart" /><p>{{ dashboard.summary.orders.total === 0 ? 'در این بازه سفارشی ثبت نشده است.' : financial ? 'در این بازه سفارش تحویل‌شده‌ای ثبت نشده است.' : 'داده‌ای برای نمودار وجود ندارد.' }}</p><button type="button" class="dashboard-inline-button" :disabled="loading" @click="selectPreset('last30')">۳۰ روز اخیر را ببینید</button></div>
            <p v-else class="dashboard-chart-caption">{{ rangeLabel }} · روزهای دارای داده</p>
          </section>
        </div>

        <div class="dashboard-data-grid" :class="{ 'has-financial': financial }">
          <section class="dashboard-panel dashboard-activity">
            <div class="dashboard-section-heading"><h2><AppIcon name="users" />فعالیت اخیر</h2><span>آخرین سفارش‌ها</span></div>
            <div v-if="dashboard.recent_activity.length" class="dashboard-list">
              <div v-for="activity in dashboard.recent_activity" :key="activity.id" class="dashboard-row">
                <span class="dashboard-activity-icon"><AppIcon name="orders" /></span>
                <span class="dashboard-activity-copy"><strong>{{ activity.title }}</strong><small>{{ activity.customer }} · {{ formatDate(activity.created) }}</small></span>
                <span class="dashboard-status-label" :class="'status-' + activity.status">{{ statusLabel(activity.status) }}</span>
              </div>
            </div>
            <p v-else class="dashboard-empty">در این بازه فعالیتی ثبت نشده است.</p>
          </section>

          <section v-if="financial" class="dashboard-panel dashboard-finance">
            <div class="dashboard-section-heading"><h2><AppIcon name="wallet" />خلاصه مالی دوره</h2><RouterLink v-if="financial.expenses_available" to="/dashboard/cost-control/reports" class="dashboard-panel-link">گزارش هزینه‌ها <AppIcon name="chevron" /></RouterLink></div>
            <div class="dashboard-financial">
              <div><span>فروش سفارش‌های تحویل‌شده</span><strong>{{ formatMoney(financial.sales) }}</strong></div>
              <div v-if="financial.expenses_available"><span>هزینه‌های ثبت‌شده</span><strong>{{ formatMoney(financial.expenses) }}</strong></div>
              <div v-if="financial.expenses_available"><span>خالص طبق محاسبه سرور</span><strong>{{ formatMoney(financial.net) }}</strong></div>
            </div>
            <p v-if="!financial.expenses_available" class="dashboard-financial-note">هزینه و خالص دوره نمایش داده نمی‌شود؛ هزینه‌های فعلی ارتباط قابل‌اعتماد با رستوران ندارند.</p>
            <div v-if="financial.expenses_available && financial.expense_categories.length" class="dashboard-categories"><h3>هزینه به تفکیک دسته</h3><div v-for="category in financial.expense_categories" :key="category.category__name" class="dashboard-row"><span>{{ category.category__name || 'بدون دسته' }} <small>{{ formatNumber(category.count) }} مورد</small></span><strong>{{ formatMoney(category.total) }}</strong></div></div>
          </section>

          <section class="dashboard-panel dashboard-orders">
            <div class="dashboard-section-heading"><h2><AppIcon name="orders" />وضعیت سفارش‌ها</h2></div>
            <div v-if="dashboard.order_status.length" class="dashboard-statuses">
              <div v-for="row in dashboard.order_status" :key="row.status" class="dashboard-status" :class="'status-' + row.status">
                <span>{{ statusLabel(row.status) }}</span>
                <AppIcon :name="({ pending: 'clock', prep: 'menu', send: 'truck', deliver: 'check', cancel: 'x' })[row.status] || 'orders'" />
                <strong>{{ formatNumber(row.count) }}</strong>
                <div class="dashboard-status-track" aria-hidden="true"><i :style="{ width: statusPercent(row.count) + '%' }"></i></div>
              </div>
            </div>
            <p v-else class="dashboard-empty">در این بازه سفارشی ثبت نشده است.</p>
            <RouterLink to="/dashboard/orders" class="dashboard-panel-link">بررسی سفارش‌ها <AppIcon name="chevron" /></RouterLink>
          </section>

          <section id="inventory-warnings" class="dashboard-panel dashboard-inventory">
            <div class="dashboard-section-heading"><h2><AppIcon name="box" />موجودی کم</h2><span>موجودی فعلی · حداکثر ۵ عدد</span></div>
            <div v-if="dashboard.low_stock_products.length" class="dashboard-list"><div v-for="item in dashboard.low_stock_products" :key="item.id" class="dashboard-row"><span>{{ item.name }}</span><strong>{{ formatNumber(item.inventory) }} عدد</strong></div></div>
            <p v-else class="dashboard-empty">در داده‌های دریافت‌شده هشدار موجودی وجود ندارد.</p>
          </section>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/common/AppIcon.vue'
import DashboardApi from '@/api/dashboard.js'
import { getApiErrorMessage } from '@/api/error'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard.vue'
import DashboardTrendChart from '@/components/dashboard/DashboardTrendChart.vue'
import { useAuthStore } from '@/store/auth'
import { useRestaurantStore } from '@/store/restaurant'
import { isoToJalali, jalaliToday, jalaliToIso, normalizeJalali } from '@/utils/jalaliDate'
import '@/assets/dashboard.css'

const auth = useAuthStore(), restaurantContext = useRestaurantStore()
const presets = [{ value: 'today', label: 'امروز' }, { value: 'last7', label: '۷ روز اخیر' }, { value: 'last30', label: '۳۰ روز اخیر' }, { value: 'custom', label: 'بازه دلخواه' }]
const storageKey = 'dashboard-jalali-range'
function readSaved() { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null') } catch { return null } }
function daysBefore(jalali, count) { const day = new Date(`${jalaliToIso(jalali)}T12:00:00Z`); day.setUTCDate(day.getUTCDate() - count); return isoToJalali(day.toISOString().slice(0, 10)) }
function datesFor(value) { const today = jalaliToday(); return { start_date: value === 'today' ? today : daysBefore(today, value === 'last7' ? 6 : 29), end_date: today } }
const saved = readSaved()
const mode = ref(saved ? (presets.some(item => item.value === saved.mode) ? saved.mode : 'custom') : 'last7')
const filters = ref(saved?.start_date && saved?.end_date ? { start_date: saved.start_date, end_date: saved.end_date } : datesFor('last7'))
const dashboard = ref(null), loaded = ref(false), loading = ref(false), error = ref(''), filterError = ref('')
let requestVersion = 0
const financial = computed(() => auth.canAccessFinancials && dashboard.value?.permissions?.financial === true ? dashboard.value.financial : null)
const selectedRestaurantName = computed(() => dashboard.value?.restaurant?.name || restaurantContext.activeRestaurant?.name || '')
const trendRows = computed(() => (financial.value ? financial.value.sales_chart : dashboard.value?.order_chart) || [])
const rangeLabel = computed(() => dashboard.value?.period?.label || `${filters.value.start_date} تا ${filters.value.end_date}`)
const formatNumber = value => value === null || value === undefined ? '—' : Number(value).toLocaleString('fa-IR')
const formatMoney = value => `${formatNumber(value)} تومان`
const formatDate = value => value ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(value)) : '—'
const statusLabel = value => ({ pending: 'در انتظار تأیید', prep: 'در حال آماده‌سازی', send: 'در حال ارسال', deliver: 'تحویل‌شده', cancel: 'لغوشده' })[value] || value
const statusCount = key => dashboard.value?.order_status?.find(row => row.status === key)?.count ?? 0
const statusPercent = value => dashboard.value?.summary?.orders?.total ? Math.max(3, Number(value) / Number(dashboard.value.summary.orders.total) * 100) : 0
const attentionItems = computed(() => {
  const items = []
  if (statusCount('pending') > 0) items.push({ key: 'pending', title: 'سفارش در انتظار تأیید', description: `در بازه انتخابی · ${selectedRestaurantName.value}`, count: statusCount('pending'), to: '/dashboard/orders', action: 'بررسی سفارش‌ها' })
  const inProgress = statusCount('prep') + statusCount('send')
  if (inProgress > 0) items.push({ key: 'progress', title: 'سفارش در حال انجام', description: 'آماده‌سازی یا ارسال در بازه انتخابی', count: inProgress, to: '/dashboard/orders', action: 'بررسی سفارش‌ها' })
  if (dashboard.value?.summary?.low_stock > 0) items.push({ key: 'stock', title: 'قلم منو با موجودی کم', description: 'موجودی فعلی اقلام فعال؛ حداکثر ۵ عدد', count: dashboard.value.summary.low_stock })
  return items
})
function persist() { sessionStorage.setItem(storageKey, JSON.stringify({ mode: mode.value, ...filters.value })) }
function setDate(key, value) { filters.value[key] = normalizeJalali(value) || ''; filterError.value = '' }
function params() { const start = jalaliToIso(filters.value.start_date), end = jalaliToIso(filters.value.end_date); if (!start || !end || isoToJalali(start) !== filters.value.start_date || isoToJalali(end) !== filters.value.end_date) throw new Error('تاریخ شروع و پایان معتبر انتخاب کنید.'); if (start > end) throw new Error('تاریخ پایان باید پس از تاریخ شروع باشد.'); return { restaurant_id: restaurantContext.activeRestaurantId, start_date: start, end_date: end } }
async function load() {
  if (!restaurantContext.ready || restaurantContext.error || !restaurantContext.activeRestaurantId) return
  let query
  try { query = params() } catch (cause) { filterError.value = cause.message; return }
  const version = ++requestVersion
  loading.value = true; error.value = ''; filterError.value = ''
  try { const { data } = await DashboardApi.dashboard(query); if (version !== requestVersion) return; const result = data?.data; if (!data?.success || String(result?.restaurant?.id) !== String(query.restaurant_id) || !result?.summary?.orders || !Number.isFinite(Number(result.summary.low_stock)) || !Array.isArray(result.order_status) || !Array.isArray(result.order_chart) || !Array.isArray(result.low_stock_products) || !Array.isArray(result.recent_activity) || (result.permissions?.financial && !result.financial)) throw new Error(data?.message || 'پاسخ داشبورد معتبر نیست.'); dashboard.value = result; loaded.value = true }
  catch (cause) { if (version !== requestVersion) return; dashboard.value = null; loaded.value = false; error.value = getApiErrorMessage(cause, cause.message) }
  finally { if (version === requestVersion) loading.value = false }
}
function selectPreset(value) { mode.value = value; filterError.value = ''; if (value !== 'custom') { filters.value = datesFor(value); persist(); load() } else persist() }
function applyCustom() { try { params(); persist(); load() } catch (cause) { filterError.value = cause.message } }
watch(() => [restaurantContext.ready, restaurantContext.contextVersion, restaurantContext.activeRestaurantId], () => { ++requestVersion; dashboard.value = null; loaded.value = false; loading.value = false; error.value = ''; if (restaurantContext.ready && restaurantContext.activeRestaurantId) load() }, { immediate: true })
</script>
