<script setup>
import { onMounted, ref } from 'vue'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'
import loyaltyApi from '@/api/loyalty.api'
import { getApiErrorMessage } from '@/api/error'
import { isoToJalali, jalaliToIso, normalizeJalali } from '@/utils/jalaliDate'

const data = ref(null), loading = ref(false), error = ref('')
const FILTER_STORAGE_KEY = 'loyalty-overview-filters'
const dateOnlyIso = /^\d{4}-\d{2}-\d{2}$/
const numbers = new Intl.NumberFormat('fa-IR')

function displayJalaliDate(value) {
  if (dateOnlyIso.test(String(value || ''))) return isoToJalali(value) || ''
  return normalizeJalali(value) || ''
}

function readStoredFilters() {
  try { return JSON.parse(sessionStorage.getItem(FILTER_STORAGE_KEY) || '{}') || {} } catch { return {} }
}

function createFilters() {
  const stored = readStoredFilters()
  return {
    start_date: displayJalaliDate(stored.start_date),
    end_date: displayJalaliDate(stored.end_date),
    inactive_days: Number(stored.inactive_days) > 0 ? Number(stored.inactive_days) : 60
  }
}

const filters = ref(createFilters())

function setDate(key, value) {
  filters.value[key] = normalizeJalali(value) || ''
}

function requestFilters() {
  const { start_date: startDisplay, end_date: endDisplay, inactive_days } = filters.value
  const startDate = startDisplay ? jalaliToIso(startDisplay) : ''
  const endDate = endDisplay ? jalaliToIso(endDisplay) : ''
  if (startDisplay && !startDate) throw new Error('تاریخ شروع معتبر نیست.')
  if (endDisplay && !endDate) throw new Error('تاریخ پایان معتبر نیست.')
  if (startDate && endDate && startDate > endDate) throw new Error('تاریخ پایان باید بعد از تاریخ شروع باشد.')
  return { start_date: startDate, end_date: endDate, inactive_days }
}

function persistFilters(apiFilters) {
  try { sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(apiFilters)) } catch { /* Storage may be unavailable. */ }
}

async function load(){
  if (loading.value) return
  loading.value=true
  error.value=''
  try {
    const apiFilters = requestFilters()
    data.value=await loyaltyApi.overview(apiFilters)
    persistFilters(apiFilters)
  } catch(e) { error.value=getApiErrorMessage(e, e.message) } finally { loading.value=false }
}
onMounted(load)
</script>
<template><div class="loyalty-page"><header class="loyalty-header"><div><h1>نمای کلی باشگاه مشتریان</h1><p>شاخص‌های واقعی مشتری، سفارش، امتیاز و تعهد کیف پول</p></div><button type="button" class="admin-button admin-button--secondary" :disabled="loading" @click="load">به‌روزرسانی</button></header><form class="loyalty-card loyalty-filters" @submit.prevent="load"><label>از تاریخ<JalaliDatePicker :model-value="filters.start_date" model-format="jYYYY/jMM/jDD" :clearable="true" :max="filters.end_date" placeholder="تاریخ شروع" @update:model-value="setDate('start_date',$event)"/></label><label>تا تاریخ<JalaliDatePicker :model-value="filters.end_date" model-format="jYYYY/jMM/jDD" :clearable="true" :min="filters.start_date" placeholder="تاریخ پایان" @update:model-value="setDate('end_date',$event)"/></label><label>عدم فعالیت (روز)<input v-model.number="filters.inactive_days" type="number" min="1"></label><button class="admin-button admin-button--primary" :disabled="loading">اعمال فیلتر</button></form><p v-if="error" class="loyalty-error" role="alert">{{ error }}</p><p v-if="loading" class="loyalty-empty">در حال دریافت آمار…</p><template v-else-if="data"><section class="loyalty-stats"><article v-for="item in [
['کل اعضا',data.total_members],['اعضای جدید',data.new_members],['مشتریان خریدار',data.customers_with_verified_order],['مشتریان بازگشتی',data.returning_customers],['سفارش‌های تأییدشده',data.completed_orders],['فروش تأییدشده',data.verified_revenue],['امتیاز در گردش',data.outstanding_points],['تعهد کیف پول',data.wallet_liability],['مشتریان غیرفعال',data.inactive_customers]
].filter(item => item[1] !== null)" :key="item[0]" class="loyalty-stat"><small>{{ item[0] }}</small><strong>{{ numbers.format(item[1] || 0) }}</strong></article></section><section class="loyalty-grid-2"><article class="loyalty-card"><h2>توزیع کانال سفارش</h2><div v-if="!data.channel_distribution?.length" class="loyalty-empty">سفارش تأییدشده‌ای وجود ندارد.</div><div v-for="row in data.channel_distribution" :key="row.order_type" class="loyalty-bar"><span>{{ {online:'آنلاین',in_store:'حضوری',phone:'تلفنی'}[row.order_type] }}</span><i :style="{width:`${Math.max(5,row.orders/Math.max(...data.channel_distribution.map(x=>x.orders))*100)}%`}"></i><b>{{ numbers.format(row.orders) }}</b></div></article><article class="loyalty-card"><h2>توزیع سطوح</h2><div v-if="!data.tier_distribution?.length" class="loyalty-empty">سطحی تخصیص نیافته است.</div><div v-for="row in data.tier_distribution" :key="row.tier__name || 'none'" class="loyalty-bar"><span>{{ row.tier__name || 'بدون سطح' }}</span><i :style="{width:`${Math.max(5,row.customers/Math.max(...data.tier_distribution.map(x=>x.customers))*100)}%`}"></i><b>{{ numbers.format(row.customers) }}</b></div></article></section></template></div></template>
