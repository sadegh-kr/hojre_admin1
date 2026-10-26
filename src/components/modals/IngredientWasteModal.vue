<template>
  <BaseModal v-model="visible" size="md" :close-disabled="loading" :close-on-esc="!loading" :close-on-overlay-click="!loading">
    <template #header>
      <div class="title"><h2>ثبت ضایعات واقعی</h2><p>{{ ingredient?.name }}</p></div>
    </template>

    <form id="ingredient-waste-form" dir="rtl" novalidate @submit.prevent="submit">
      <div class="notice">این ثبت فقط یک رویداد هزینه‌ای و قابل پیگیری است و از موجودی فیزیکی کم نمی‌کند.</div>
      <div v-if="serverError" class="error" role="alert">{{ serverError }}</div>
      <div class="grid">
        <label>مقدار ضایعات <b>الزامی</b><input v-model="form.quantity" type="number" min="0.001" step="0.001" inputmode="decimal"/><em v-if="errors.quantity">{{ errors.quantity }}</em></label>
        <label>واحد <b>الزامی</b><select v-model="form.unit"><option v-for="unit in availableUnits" :key="unit.code" :value="unit.code">{{ unit.label }}</option></select><em v-if="errors.unit">{{ errors.unit }}</em></label>
        <label class="wide">علت <b>الزامی</b><select v-model="form.reason"><option value="expired">منقضی‌شده</option><option value="spoiled">فاسدشده</option><option value="damaged">آسیب‌دیده</option><option value="preparation_loss">پرت آماده‌سازی</option><option value="other">سایر</option></select><em v-if="errors.reason">{{ errors.reason }}</em></label>
        <label>تاریخ رویداد <b>شمسی</b><JalaliDatePicker v-model="form.date" :clearable="false"/><em v-if="errors.occurred_at">{{ errors.occurred_at }}</em></label>
        <label>زمان رویداد<input v-model="form.time" type="time" step="60"/></label>
        <label class="wide">یادداشت <b>اختیاری</b><textarea v-model.trim="form.note" maxlength="1000" rows="3" placeholder="توضیح کوتاه برای پیگیری بعدی"></textarea><em v-if="errors.note">{{ errors.note }}</em></label>
      </div>
      <div v-if="normalizedQuantity !== null" class="estimate">
        <div><span>مقدار ذخیره‌شده</span><strong>{{ number(normalizedQuantity) }} {{ ingredient?.unit_display }}</strong></div>
        <div><span>هزینه برآوردی با قیمت مرجع فعلی</span><strong>{{ estimatedCost === null ? 'فاقد قیمت معتبر' : money(estimatedCost) }}</strong></div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="secondary" :disabled="loading" @click="visible=false">انصراف</button>
      <button class="primary" form="ingredient-waste-form" :disabled="loading">{{ loading ? 'در حال ثبت…' : 'ثبت ضایعات' }}</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'
import { formatCostNumber as number, formatMoney as money } from '@/utils/costControl'

const props = defineProps({
  modelValue: Boolean,
  ingredient: { type: Object, default: null },
  referenceUnits: { type: Array, default: () => [] },
  loading: Boolean,
  serverError: { type: String, default: '' },
  fieldErrors: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue', 'submit'])
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const form = reactive({ quantity: '', unit: '', reason: 'spoiled', note: '', date: '', time: '', idempotency_key: '' })
const errors = reactive({})
const measurementType = computed(() => props.referenceUnits.find(unit => unit.code === props.ingredient?.unit)?.measurement_type)
const availableUnits = computed(() => props.referenceUnits.filter(unit => unit.measurement_type === measurementType.value))
const normalizedQuantity = computed(() => {
  if (!form.quantity || Number(form.quantity) <= 0) return null
  const input = props.referenceUnits.find(unit => unit.code === form.unit)
  const base = props.referenceUnits.find(unit => unit.code === props.ingredient?.unit)
  if (!input || !base || input.measurement_type !== base.measurement_type) return null
  return Number(form.quantity) * Number(input.factor) / Number(base.factor)
})
const estimatedCost = computed(() => {
  const cost = Number(props.ingredient?.purchase_price || 0)
  return normalizedQuantity.value !== null && cost > 0 ? normalizedQuantity.value * cost : null
})

function nowInTehran() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).filter(part => part.type !== 'literal').map(part => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}
function newKey() {
  return globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16)
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}
function clearErrors() { Object.keys(errors).forEach(key => delete errors[key]) }
function reset() {
  clearErrors()
  const now = nowInTehran()
  Object.assign(form, { quantity: '', unit: props.ingredient?.unit || '', reason: 'spoiled', note: '', date: now.date, time: now.time, idempotency_key: newKey() })
}
function submit() {
  clearErrors()
  if (!form.quantity || Number(form.quantity) <= 0) errors.quantity = 'مقدار باید بیشتر از صفر باشد.'
  if (!availableUnits.value.some(unit => unit.code === form.unit)) errors.unit = 'واحد انتخاب‌شده با ماده سازگار نیست.'
  if (!form.date || !form.time) errors.occurred_at = 'تاریخ و زمان رویداد را وارد کنید.'
  if (!Object.keys(errors).length) emit('submit', {
    ingredient: props.ingredient.id,
    quantity: form.quantity,
    unit: form.unit,
    reason: form.reason,
    note: form.note,
    occurred_at: `${form.date}T${form.time}:00`,
    idempotency_key: form.idempotency_key,
  })
}

watch(() => [props.modelValue, props.ingredient], ([open]) => { if (open) reset() }, { deep: true })
watch(() => props.fieldErrors, value => {
  clearErrors()
  for (const [key, messages] of Object.entries(value || {})) errors[key] = Array.isArray(messages) ? messages[0] : messages
}, { deep: true })
</script>

<style scoped>
.title h2,.title p{margin:0}.title h2{font-size:1.12rem}.title p{margin-top:4px;color:var(--muted);font-size:.74rem}.notice,.error{margin-bottom:14px;padding:10px 12px;border-radius:9px;font-size:.74rem;line-height:1.8}.notice{border:1px solid color-mix(in srgb,var(--primary) 28%,var(--border));background:color-mix(in srgb,var(--primary) 6%,var(--surface))}.error{border:1px solid #fecaca;background:#fef2f2;color:var(--danger)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.wide{grid-column:1/-1}label{display:grid;gap:6px;font-size:.78rem;font-weight:700}label b{color:var(--muted);font-size:.64rem;font-weight:400}input,select,textarea,:deep(.jalali-input){width:100%;min-height:43px;padding:9px 11px!important;border:1px solid var(--border-strong)!important;border-radius:9px!important;background:var(--input)!important;color:var(--text)!important;font:inherit!important;box-sizing:border-box}textarea{resize:vertical}em{color:var(--danger);font-size:.69rem;font-style:normal}.estimate{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}.estimate>div{display:grid;gap:4px;padding:11px;border-radius:9px;background:var(--surface-subtle)}.estimate span{color:var(--muted);font-size:.68rem}.estimate strong{font-size:.8rem}.primary,.secondary{min-width:115px;padding:10px 14px;border:0;border-radius:9px;font:inherit;font-weight:700}.primary{background:var(--primary);color:var(--on-primary)}.secondary{background:var(--surface-subtle);color:var(--text)}@media(max-width:580px){.grid,.estimate{grid-template-columns:1fr}.wide{grid-column:auto}}
</style>
