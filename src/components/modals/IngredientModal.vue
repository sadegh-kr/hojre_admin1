<template>
  <BaseModal v-model="visible" size="md" :close-disabled="loading" :close-on-esc="!loading" :close-on-overlay-click="!loading">
    <template #header>
      <div class="title">
        <h2>{{ costMode ? 'ثبت هزینه ماده' : ingredient ? 'ویرایش ماده اولیه' : 'ماده اولیه جدید' }}</h2>
        <p v-if="ingredient">{{ ingredient.name }} · {{ ingredient.unit_display }}</p>
      </div>
    </template>

    <form id="ingredient-form" dir="rtl" novalidate @submit.prevent="submit">
      <div v-if="serverError" class="error" role="alert">{{ serverError }}</div>

      <div v-if="costMode" class="cost-context">
        <div><span>قیمت مرجع فعلی</span><strong>{{ money(ingredient?.purchase_price) }}</strong></div>
        <div><span>میانگین موجودی</span><strong>{{ hasAverageCost ? money(ingredient.inventory_average_cost) : 'ثبت نشده' }}</strong></div>
        <p>{{ hasAverageCost ? 'محاسبه رسپی فعلاً از میانگین موجودی استفاده می‌کند؛ تغییر قیمت مرجع تا رسید خرید بعدی جای آن را نمی‌گیرد.' : 'چون میانگین موجودی ثبت نشده، این قیمت مرجع مبنای محاسبه رسپی خواهد بود.' }}</p>
      </div>

      <div class="grid">
        <template v-if="!costMode">
          <label class="wide">نام ماده اولیه <b>الزامی</b><input ref="nameInput" v-model.trim="form.name" maxlength="100" placeholder="مثلاً شیر"/><em v-if="errors.name">{{ errors.name }}</em></label>
          <label>واحد اندازه‌گیری <b>الزامی</b><select v-model="form.unit"><option v-for="unit in units" :key="unit[0]" :value="unit[0]">{{ unit[1] }}</option></select><em v-if="errors.unit">{{ errors.unit }}</em></label>
          <label>دسته‌بندی <b>اختیاری</b><select v-model="form.category"><option value="">بدون دسته‌بندی</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select><em v-if="errors.category">{{ errors.category }}</em></label>
          <label class="active wide"><span><strong>ماده اولیه فعال باشد</strong><small>فقط مواد فعال در دستور ساخت قابل انتخاب‌اند.</small></span><input v-model="form.is_active" type="checkbox"/></label>
        </template>

        <label v-else class="wide">قیمت مرجع هر {{ unitLabel }} <b>تومان · الزامی</b><input ref="priceInput" v-model="form.purchase_price" type="number" min="0.01" step="0.01" inputmode="decimal"/><small v-if="form.purchase_price">{{ Number(form.purchase_price).toLocaleString('fa-IR') }} تومان برای هر {{ unitLabel }}</small><em v-if="errors.purchase_price">{{ errors.purchase_price }}</em></label>
      </div>
    </form>

    <template #footer>
      <button type="button" class="secondary" :disabled="loading" @click="visible=false">انصراف</button>
      <button class="primary" form="ingredient-form" :disabled="loading">{{ loading ? 'در حال ذخیره…' : costMode ? 'ثبت قیمت مرجع' : ingredient ? 'ذخیره تغییرات' : 'ایجاد ماده اولیه' }}</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'
import { formatMoney } from '@/utils/costControl'

const props = defineProps({
  modelValue: Boolean,
  ingredient: { type: Object, default: null },
  mode: { type: String, default: 'catalog', validator: value => ['catalog', 'cost'].includes(value) },
  units: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  loading: Boolean,
  serverError: { type: String, default: '' },
  fieldErrors: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue', 'submit'])
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const costMode = computed(() => props.mode === 'cost')
const form = reactive({ name: '', unit: 'g', category: '', purchase_price: '', is_active: true })
const errors = reactive({})
const nameInput = ref(null)
const priceInput = ref(null)
const unitLabel = computed(() => props.ingredient?.unit_display || props.units.find(item => item[0] === form.unit)?.[1] || 'واحد')
const hasAverageCost = computed(() => Number(props.ingredient?.inventory_average_cost || 0) > 0)
const money = value => Number(value || 0) > 0 ? formatMoney(value) : 'ثبت نشده'

function clear() {
  Object.keys(errors).forEach(key => delete errors[key])
}

function hydrate() {
  clear()
  Object.assign(form, {
    name: props.ingredient?.name || '',
    unit: props.ingredient?.unit || props.units[0]?.[0] || 'g',
    category: props.ingredient?.category || '',
    purchase_price: props.ingredient?.purchase_price || '',
    is_active: props.ingredient?.is_active ?? true,
  })
  if (props.modelValue) nextTick(() => (costMode.value ? priceInput.value : nameInput.value)?.focus())
}

function submit() {
  clear()
  if (costMode.value) {
    if (!form.purchase_price || Number(form.purchase_price) <= 0) errors.purchase_price = 'قیمت باید بزرگ‌تر از صفر باشد.'
    if (!Object.keys(errors).length) emit('submit', { purchase_price: Number(form.purchase_price) })
    return
  }
  if (!form.name) errors.name = 'نام ماده اولیه را وارد کنید.'
  if (!form.unit) errors.unit = 'واحد را انتخاب کنید.'
  if (!Object.keys(errors).length) emit('submit', {
    name: form.name,
    unit: form.unit,
    category: form.category || null,
    is_active: form.is_active,
  })
}

watch(() => [props.modelValue, props.ingredient, props.units, props.mode], hydrate, { immediate: true, deep: true })
watch(() => props.fieldErrors, value => {
  clear()
  for (const [key, messages] of Object.entries(value || {})) errors[key] = Array.isArray(messages) ? messages[0] : messages
}, { deep: true })
</script>

<style scoped>
.title h2,.title p{margin:0}.title h2{font-size:1.15rem}.title p{margin-top:3px;color:var(--muted);font-size:.72rem}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.wide{grid-column:1/-1}label{display:grid;gap:6px;font-size:.78rem;font-weight:700}label>b{color:var(--muted);font-size:.64rem;font-weight:400}input,select{width:100%;min-height:43px;padding:9px 11px;border:1px solid var(--border-strong);border-radius:9px;background:var(--input);color:var(--text);font:inherit;box-sizing:border-box}input:focus,select:focus{outline:3px solid var(--focus);border-color:var(--primary)}label small{color:var(--muted);font-size:.65rem;font-weight:400}em{color:var(--danger);font-size:.7rem;font-style:normal}.active{display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border);border-radius:9px}.active span{display:grid;gap:3px}.active input{width:20px;min-height:20px;accent-color:var(--primary)}.cost-context{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:15px;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--surface-subtle)}.cost-context div{display:grid;gap:3px}.cost-context span,.cost-context p{color:var(--muted);font-size:.68rem}.cost-context strong{font-size:.82rem}.cost-context p{grid-column:1/-1;margin:0;line-height:1.8}.error{margin-bottom:14px;padding:10px;border:1px solid color-mix(in srgb,var(--danger) 35%,transparent);border-radius:8px;background:var(--color-danger-subtle);color:var(--danger);font-size:.74rem}.primary,.secondary{min-width:110px;padding:10px 14px;border:0;border-radius:9px;font:inherit;font-weight:700}.primary{background:var(--primary);color:var(--on-primary)}.secondary{background:var(--surface-subtle);color:var(--text)}@media(max-width:600px){.grid,.cost-context{grid-template-columns:1fr}.wide,.cost-context p{grid-column:auto}}
</style>
