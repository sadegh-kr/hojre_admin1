<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import loyaltyApi from '@/api/loyalty.api'
import { getApiErrorMessage } from '@/api/error'
import { useRestaurantStore } from '@/store/restaurant'

const props = defineProps({ modelValue: Object, registrationSource: { type: String, default: 'admin' } })
const emit = defineEmits(['update:modelValue'])
const query = ref('')
const results = ref([])
const recentCustomers = ref([])
const loading = ref(false)
const recentLoading = ref(false)
const error = ref('')
const showRegistration = ref(false)
const registering = ref(false)
const registration = ref({ phone_number: '', name: '' })
const restaurantStore = useRestaurantStore()
let timer
let searchRequestId = 0
let recentRequestId = 0

function uniqueCustomers(customers) {
  const seen = new Set()
  return customers.filter(customer => {
    if (!customer?.customer_id || seen.has(customer.customer_id)) return false
    seen.add(customer.customer_id)
    return true
  })
}

function clearSearch() {
  clearTimeout(timer)
  searchRequestId += 1
  query.value = ''
  results.value = []
  loading.value = false
  error.value = ''
}

function selectCustomer(customer) {
  clearSearch()
  emit('update:modelValue', customer)
}

async function loadRecentCustomers() {
  const requestId = ++recentRequestId
  recentLoading.value = true
  try {
    const data = await loyaltyApi.customers({ page_size: 3, ordering: '-last_purchase' })
    if (requestId === recentRequestId) recentCustomers.value = uniqueCustomers(data.results || []).slice(0, 3)
  } catch (_) {
    // Search and order registration remain available even when the optional
    // recent-customer request cannot be completed.
    if (requestId === recentRequestId) recentCustomers.value = []
  } finally {
    if (requestId === recentRequestId) recentLoading.value = false
  }
}

watch(query, value => {
  const requestId = ++searchRequestId
  clearTimeout(timer)
  results.value = []
  loading.value = false
  error.value = ''
  if (value.trim().length < 2) return
  timer = setTimeout(async () => {
    loading.value = true
    try {
      const data = await loyaltyApi.searchCustomers(value.trim())
      if (requestId === searchRequestId) results.value = (data.results || []).slice(0, 4)
    } catch (cause) {
      if (requestId === searchRequestId) error.value = getApiErrorMessage(cause)
    } finally {
      if (requestId === searchRequestId) loading.value = false
    }
  }, 350)
})

watch(() => restaurantStore.activeRestaurantId, restaurantId => {
  if (restaurantId) loadRecentCustomers()
  else {
    recentRequestId += 1
    recentCustomers.value = []
    recentLoading.value = false
  }
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))

function openRegistration() {
  registration.value = { phone_number: query.value, name: '' }
  error.value = ''
  showRegistration.value = true
}

function closeRegistration() {
  showRegistration.value = false
  error.value = ''
  registration.value = { phone_number: '', name: '' }
}

async function register() {
  registering.value = true
  error.value = ''
  try {
    const data = await loyaltyApi.createCustomer({
      ...registration.value,
      registration_source: props.registrationSource,
    })
    recentCustomers.value = uniqueCustomers([data.customer, ...recentCustomers.value]).slice(0, 3)
    closeRegistration()
    selectCustomer(data.customer)
  } catch (cause) {
    error.value = getApiErrorMessage(cause)
  } finally {
    registering.value = false
  }
}
</script>

<template>
  <section class="customer-search" aria-label="انتخاب مشتری">
    <template v-if="modelValue">
      <div class="selected-customer">
        <div class="selected-customer__identity">
          <strong>{{ modelValue.name || 'مشتری بدون نام' }}</strong>
          <span>{{ modelValue.masked_phone }} · {{ modelValue.tier_name || 'بدون سطح' }}</span>
        </div>
        <div class="selected-customer__actions">
          <span>{{ Number(modelValue.points || 0).toLocaleString('fa-IR') }} امتیاز</span>
          <button type="button" class="admin-button admin-button--ghost admin-button--sm" @click="emit('update:modelValue', null)">تغییر</button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="quick-search-row">
        <input v-model="query" type="search" inputmode="search" autocomplete="off" placeholder="جستجوی نام، موبایل یا کد عضویت" aria-label="جستجوی مشتری">
        <button type="button" class="new-customer-button" @click="openRegistration">مشتری جدید</button>
      </div>

      <p v-if="loading" class="hint">در حال جستجو…</p>
      <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else-if="query.length >= 2 && !results.length" class="hint">یافت نشد؛ شماره کامل را برای ثبت مشتری جدید وارد کنید.</p>

      <div v-if="results.length" class="search-results" role="listbox">
        <p v-if="results.length > 1" class="ambiguity">مشتری صحیح را انتخاب کنید.</p>
        <button v-for="customer in results" :key="customer.customer_id" type="button" @click="selectCustomer(customer)">
          <span class="customer-result__identity"><strong>{{ customer.name || 'بدون نام' }}</strong><small>{{ customer.masked_phone }} · {{ customer.membership_code }}</small></span>
          <span class="customer-result__meta">{{ customer.tier_name || 'عادی' }} · {{ Number(customer.points).toLocaleString('fa-IR') }}</span>
        </button>
      </div>

      <div v-if="!query.trim() && (recentLoading || recentCustomers.length)" class="recent-customers">
        <span class="recent-customers__label">مشتریان اخیر</span>
        <div class="recent-customers__list">
          <button v-for="customer in recentCustomers" :key="customer.customer_id" type="button" @click="selectCustomer(customer)">
            <strong>{{ customer.name || 'بدون نام' }}</strong><small>{{ customer.masked_phone }}</small>
          </button>
          <span v-if="recentLoading" class="hint">در حال دریافت…</span>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="showRegistration" class="quick-registration-modal" role="dialog" aria-modal="true" aria-labelledby="quick-registration-title" @click.self="closeRegistration">
        <form class="quick-register" @submit.prevent="register">
          <div class="quick-register__header"><h2 id="quick-registration-title">ثبت سریع مشتری</h2><button type="button" aria-label="بستن" @click="closeRegistration">×</button></div>
          <p>پس از ثبت، مشتری به همین فاکتور انتخاب می‌شود.</p>
          <label>شمارهٔ موبایل<input v-model="registration.phone_number" required inputmode="tel" autocomplete="tel" placeholder="09123456789"></label>
          <label>نام و نام خانوادگی <span>اختیاری</span><input v-model="registration.name" autocomplete="name" placeholder="نام مشتری"></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <div class="quick-register__actions"><button type="button" class="admin-button admin-button--ghost" @click="closeRegistration">انصراف</button><button class="admin-button admin-button--primary" :disabled="registering">{{ registering ? 'در حال ثبت…' : 'ثبت و انتخاب' }}</button></div>
        </form>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.customer-search{position:relative;min-width:0;padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:12px}
.quick-search-row{display:flex;align-items:center;gap:8px;min-width:0}.quick-search-row input{min-width:0;flex:1;width:100%;height:36px;padding:0 10px;border:1px solid var(--border-strong);border-radius:9px;background:var(--input);color:var(--text);font:inherit;font-size:12px}.quick-search-row input:focus{outline:0;border-color:var(--primary);box-shadow:0 0 0 2px var(--focus)}
.new-customer-button{flex:0 0 auto;height:36px;padding:0 9px;border:1px solid var(--primary);border-radius:9px;background:var(--surface);color:var(--primary);font:inherit;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer}.new-customer-button:hover{background:var(--color-success-subtle)}
.selected-customer{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}.selected-customer__identity{display:grid;min-width:0;gap:2px}.selected-customer__identity strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.selected-customer span,.hint{color:var(--muted);font-size:10px}.selected-customer__actions{display:flex;align-items:center;gap:6px;flex:0 0 auto;font-size:10px}.selected-customer__actions .admin-button{padding-inline:7px}
.search-results{position:absolute;z-index:30;top:calc(100% + 4px);right:0;left:0;max-height:min(224px,34vh);overflow-y:auto;background:var(--surface-elevated,var(--surface));border:1px solid var(--border-strong);border-radius:10px;box-shadow:var(--shadow);padding:5px}.search-results button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;min-width:0;text-align:right;padding:8px;border:0;border-radius:7px;background:transparent;color:var(--text);font:inherit;font-size:10px;cursor:pointer}.search-results button:hover,.search-results button:focus{background:var(--surface-hover);outline:0}.customer-result__identity{display:grid;min-width:0;gap:2px}.customer-result__identity strong,.customer-result__identity small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.customer-result__identity small{color:var(--muted)}.customer-result__meta{flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:9px}.ambiguity{margin:3px 5px 6px;color:#9a6700;font-size:10px}.form-error{margin:6px 0 0;color:var(--danger);font-size:10px}
.recent-customers{display:flex;align-items:center;gap:7px;min-width:0;margin-top:8px}.recent-customers__label{flex:0 0 auto;color:var(--muted);font-size:10px}.recent-customers__list{display:flex;min-width:0;gap:5px;overflow-x:auto;padding-bottom:1px}.recent-customers__list button{display:grid;flex:0 0 auto;gap:1px;max-width:100px;padding:4px 7px;border:1px solid var(--border);border-radius:7px;background:var(--surface-subtle);color:var(--text);text-align:right;font:inherit;font-size:9px;cursor:pointer}.recent-customers__list button:hover{border-color:var(--primary)}.recent-customers__list strong,.recent-customers__list small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.recent-customers__list small{color:var(--muted);font-size:8px}
:global(.quick-registration-modal){position:fixed;z-index:1200;inset:0;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.42)}+:global(.quick-register){width:min(100%,400px);display:grid;gap:12px;padding:18px;border:1px solid var(--border);border-radius:16px;background:var(--surface-elevated,var(--surface));box-shadow:0 24px 64px rgba(0,0,0,.22);direction:rtl;color:var(--text)}+:global(.quick-register__header){display:flex;align-items:center;justify-content:space-between;gap:12px}+:global(.quick-register__header h2){margin:0;font-size:16px}+:global(.quick-register__header button){width:30px;height:30px;border:0;border-radius:8px;background:var(--surface-subtle);color:var(--text);font:inherit;font-size:20px;cursor:pointer}+:global(.quick-register>p){margin:0;color:var(--muted);font-size:11px}+:global(.quick-register label){display:grid;gap:5px;color:var(--text);font-size:12px;font-weight:700}+:global(.quick-register label span){font-weight:400;color:var(--muted);font-size:10px}+:global(.quick-register input){width:100%;min-height:40px;border:1px solid var(--border-strong);border-radius:9px;padding:7px 10px;background:var(--input);color:var(--text);font:inherit;box-sizing:border-box}+:global(.quick-register__actions){display:flex;justify-content:flex-end;gap:8px;padding-top:3px}
@media(max-width:700px){.quick-search-row{align-items:stretch}.new-customer-button{height:auto;min-height:36px}.search-results{max-height:min(190px,30vh)}.customer-result__meta{display:none}:global(.quick-registration-modal){align-items:end;padding:12px}:global(.quick-register){width:100%;max-height:calc(100dvh - 24px);overflow:auto;border-radius:16px 16px 12px 12px}}
</style>
