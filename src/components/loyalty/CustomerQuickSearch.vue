<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import loyaltyApi from '@/api/loyalty.api'
import { getApiErrorMessage } from '@/api/error'

const props = defineProps({ modelValue: Object, registrationSource: { type: String, default: 'admin' } })
const emit = defineEmits(['update:modelValue', 'register'])
const query = ref('')
const results = ref([])
const loading = ref(false)
const error = ref('')
const showRegistration = ref(false)
const registering = ref(false)
const registration = ref({ phone_number: '', name: '' })
let timer

watch(query, value => {
  clearTimeout(timer)
  results.value = []
  error.value = ''
  if (value.trim().length < 2) return
  timer = setTimeout(async () => {
    loading.value = true
    try {
      const data = await loyaltyApi.searchCustomers(value.trim())
      results.value = data.results || []
    } catch (cause) {
      error.value = getApiErrorMessage(cause)
    } finally { loading.value = false }
  }, 350)
})
onBeforeUnmount(() => clearTimeout(timer))
function openRegistration(){registration.value.phone_number=query.value;showRegistration.value=true}
async function register(){registering.value=true;error.value='';try{const data=await loyaltyApi.createCustomer({...registration.value,registration_source:props.registrationSource});emit('update:modelValue',data.customer);showRegistration.value=false}catch(cause){error.value=getApiErrorMessage(cause)}finally{registering.value=false}}
</script>

<template>
  <section class="customer-search" aria-label="انتخاب مشتری">
    <div v-if="modelValue" class="selected-customer">
      <div><strong>{{ modelValue.name || 'مشتری بدون نام' }}</strong><span>{{ modelValue.masked_phone }} · {{ modelValue.tier_name || 'بدون سطح' }}</span></div>
      <div><span>{{ Number(modelValue.points || 0).toLocaleString('fa-IR') }} امتیاز</span><button type="button" class="admin-button admin-button--ghost admin-button--sm" @click="emit('update:modelValue', null)">تغییر</button></div>
    </div>
    <template v-else>
      <div class="quick-search-row">
        <input v-model="query" type="search" inputmode="search" autocomplete="off" placeholder="جستجوی مشتری با نام، موبایل، کد عضویت یا ۴ رقم آخر" aria-label="جستجوی مشتری">
        <button type="button" class="admin-button admin-button--secondary" @click="openRegistration">ثبت مشتری جدید</button>
      </div>
      <p v-if="loading" class="hint">در حال جستجو…</p>
      <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else-if="query.length >= 2 && !results.length" class="hint">مشتری یافت نشد؛ برای ثبت جدید شماره کامل را وارد کنید.</p>
      <div v-if="results.length" class="search-results" role="listbox">
        <p v-if="results.length > 1" class="ambiguity">چند نتیجه یافت شد؛ مشتری صحیح را صریحاً انتخاب کنید.</p>
        <button v-for="customer in results" :key="customer.customer_id" type="button" @click="emit('update:modelValue', customer)">
          <span><strong>{{ customer.name || 'بدون نام' }}</strong><small>{{ customer.masked_phone }} · {{ customer.membership_code }}</small></span>
          <span>{{ customer.tier_name || 'عادی' }} · {{ Number(customer.points).toLocaleString('fa-IR') }} امتیاز</span>
        </button>
      </div>
      <form v-if="showRegistration" class="quick-register" @submit.prevent="register">
        <strong>ثبت سریع مشتری</strong>
        <input v-model="registration.phone_number" required inputmode="tel" placeholder="شماره کامل موبایل">
        <input v-model="registration.name" placeholder="نام (اختیاری)">
        <div><button class="admin-button admin-button--primary admin-button--sm" :disabled="registering">{{registering?'در حال ثبت…':'ثبت و انتخاب'}}</button><button type="button" class="admin-button admin-button--ghost admin-button--sm" @click="showRegistration=false">انصراف</button></div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.customer-search{position:relative;padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-bottom:12px}.quick-search-row,.selected-customer{display:flex;align-items:center;gap:10px}.quick-search-row input{flex:1}.selected-customer{justify-content:space-between}.selected-customer>div{display:flex;align-items:center;gap:10px}.selected-customer span,.hint{color:var(--muted);font-size:.84rem}.search-results{position:absolute;z-index:20;top:calc(100% - 8px);right:14px;left:14px;background:var(--surface);border:1px solid var(--border-strong);border-radius:10px;box-shadow:var(--shadow);padding:6px}.search-results button{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:right;padding:10px;border:0;border-radius:8px;background:transparent;color:var(--text)}.search-results button:hover,.search-results button:focus{background:var(--surface-hover)}.search-results button span:first-child{display:grid}.search-results small{color:var(--muted)}.ambiguity{margin:4px 8px 8px;color:#9a6700;font-size:.8rem}.form-error{color:var(--danger);margin:.5rem 0 0}@media(max-width:700px){.quick-search-row,.selected-customer,.selected-customer>div{align-items:stretch;flex-direction:column}.search-results button{align-items:flex-start;gap:8px;flex-direction:column}}
</style>
