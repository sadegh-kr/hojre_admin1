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
      <p v-if="!costMode" class="catalog-explanation">با ثبت ماده اولیه، قیمت هر واحد محاسبه و ذخیره می‌شود و ماده برای استفاده در دستور تولید در دسترس خواهد بود.</p>
      <div v-if="ingredient" class="cost-context">
        <div><span>قیمت مرجع فعلی</span><strong>{{ money(ingredient.purchase_price) }}</strong></div>
        <div><span>مبنای مؤثر رسپی</span><strong>{{ money(effectiveCost) }}</strong></div>
        <div><span>میانگین موجودی</span><strong>{{ hasAverageCost ? money(ingredient.inventory_average_cost) : 'ثبت نشده' }}</strong></div>
        <p v-if="hasCostDifference">در دستورهای فعلی، میانگین ثبت‌شدهٔ قبلی مبنای هزینه است و با قیمت مرجع تفاوت دارد.</p>
      </div>

      <div class="grid">
        <template v-if="!costMode">
          <label class="wide">نام ماده اولیه <b>الزامی</b><input ref="nameInput" v-model.trim="form.name" maxlength="100" placeholder="مثلاً شیر"/><em v-if="errors.name">{{ errors.name }}</em></label>
          <label>واحد پایه <b>الزامی</b><select v-model="form.unit"><option v-for="unit in units" :key="unit[0]" :value="unit[0]">{{ unit[1] }}</option></select><small>ذخیره‌سازی به گرم، میلی‌لیتر یا عدد انجام می‌شود.</small><em v-if="errors.unit">{{ errors.unit }}</em></label>
          <div class="category-field">
            <label>دسته‌بندی <b>اختیاری</b><select v-model="form.category"><option value="">بدون دسته‌بندی</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select><em v-if="errors.category">{{ errors.category }}</em></label>
            <button type="button" class="category-plus" aria-label="ایجاد دسته‌بندی مواد" title="دسته‌بندی جدید" @click="showCategoryCreator = !showCategoryCreator">+</button>
          </div>
          <div v-if="showCategoryCreator" class="category-create wide">
            <label>نام دسته‌بندی جدید<input v-model.trim="newCategoryName" maxlength="80" placeholder="مثلاً لبنیات" @keydown.enter.prevent="createCategory"/></label>
            <button type="button" :disabled="categorySaving" @click="createCategory">{{ categorySaving ? 'در حال ثبت…' : 'ثبت دسته' }}</button>
            <em v-if="categoryError" role="alert">{{ categoryError }}</em>
          </div>
          <label class="active wide"><span><strong>ماده اولیه فعال باشد</strong><small>فقط مواد فعال در دستور تولید قابل انتخاب‌اند.</small></span><input v-model="form.is_active" type="checkbox"/></label>

          <fieldset class="reference-basis wide">
            <legend>مبنای قیمت مرجع</legend>
            <div class="basis-grid">
              <label>مبلغ کل <b>تومان</b><input v-model="form.reference_total_amount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="مثلاً ۱۲۰۰۰۰۰"/><em v-if="errors.reference_total_amount">{{ errors.reference_total_amount }}</em></label>
              <label>مقدار متناظر<input v-model="form.reference_quantity" type="number" min="0.001" step="0.001" inputmode="decimal"/><em v-if="errors.reference_quantity">{{ errors.reference_quantity }}</em></label>
              <label>واحد مقدار<select v-model="form.reference_unit"><option v-for="unit in availableReferenceUnits" :key="unit.code" :value="unit.code">{{ unit.label }}</option></select><em v-if="errors.reference_unit">{{ errors.reference_unit }}</em></label>
            </div>
            <div class="reference-result"><span>قیمت محاسبه‌شده برای هر {{ unitLabel }}</span><strong>{{ referencePreview === null ? '—' : money(referencePreview) }}</strong></div>
          </fieldset>
        </template>
        <label v-else class="wide">قیمت مرجع هر {{ unitLabel }} <b>تومان · الزامی</b><input ref="priceInput" v-model="form.purchase_price" type="number" min="0" step="0.01" inputmode="decimal"/><em v-if="errors.purchase_price">{{ errors.purchase_price }}</em></label>
      </div>
    </form>

    <template #footer>
      <button type="button" class="secondary" :disabled="loading" @click="visible=false">انصراف</button>
      <button class="primary" form="ingredient-form" :disabled="loading">{{ loading ? 'در حال ذخیره…' : costMode ? 'ثبت قیمت مرجع' : ingredient ? 'ذخیره ماده و قیمت' : 'ایجاد ماده اولیه' }}</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'
import API from '@/api/product-cost.api.js'
import { costErrorMessage, formatMoney } from '@/utils/costControl'

const props = defineProps({
  modelValue: Boolean,
  ingredient: { type: Object, default: null },
  mode: { type: String, default: 'catalog', validator: value => ['catalog', 'cost'].includes(value) },
  units: { type: Array, default: () => [] },
  referenceUnits: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  loading: Boolean,
  serverError: { type: String, default: '' },
  fieldErrors: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue', 'submit', 'category-created'])
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const costMode = computed(() => props.mode === 'cost')
const form = reactive({ name: '', unit: 'g', category: '', purchase_price: '', is_active: true, reference_total_amount: '', reference_quantity: '1', reference_unit: 'g' })
const errors = reactive({})
const nameInput = ref(null)
const priceInput = ref(null)
const showCategoryCreator = ref(false)
const newCategoryName = ref('')
const categorySaving = ref(false)
const categoryError = ref('')
const unitLabel = computed(() => props.units.find(item => item[0] === form.unit)?.[1] || props.ingredient?.unit_display || 'واحد')
const hasAverageCost = computed(() => Number(props.ingredient?.inventory_average_cost || 0) > 0)
const effectiveCost = computed(() => hasAverageCost.value ? props.ingredient.inventory_average_cost : props.ingredient?.purchase_price)
const hasCostDifference = computed(() => hasAverageCost.value && Math.abs(Number(props.ingredient?.inventory_average_cost || 0) - Number(props.ingredient?.purchase_price || 0)) >= 0.01)
const selectedMeasurementType = computed(() => props.referenceUnits.find(unit => unit.code === form.unit)?.measurement_type)
const availableReferenceUnits = computed(() => props.referenceUnits.filter(unit => unit.measurement_type === selectedMeasurementType.value))
const referencePreview = computed(() => {
  if (form.reference_total_amount === '' || Number(form.reference_quantity) <= 0) return null
  const input = props.referenceUnits.find(unit => unit.code === form.reference_unit)
  const base = props.referenceUnits.find(unit => unit.code === form.unit)
  if (!input || !base || input.measurement_type !== base.measurement_type) return null
  const baseQuantity = Number(form.reference_quantity) * Number(input.factor) / Number(base.factor)
  return baseQuantity > 0 ? Number(form.reference_total_amount) / baseQuantity : null
})
const money = value => value === null || value === undefined || value === '' ? 'ثبت نشده' : formatMoney(value)

function clear() { Object.keys(errors).forEach(key => delete errors[key]) }
function hydrate() {
  clear()
  const unit = props.ingredient?.unit || props.units[0]?.[0] || 'g'
  Object.assign(form, {
    name: props.ingredient?.name || '', unit, category: props.ingredient?.category || '',
    purchase_price: props.ingredient?.purchase_price ?? '', is_active: props.ingredient?.is_active ?? true,
    reference_total_amount: props.ingredient?.purchase_price ?? '', reference_quantity: '1', reference_unit: unit,
  })
  showCategoryCreator.value = false
  newCategoryName.value = ''
  categoryError.value = ''
  if (props.modelValue) nextTick(() => (costMode.value ? priceInput.value : nameInput.value)?.focus())
}

async function createCategory() {
  categoryError.value = ''
  if (!newCategoryName.value) { categoryError.value = 'نام دسته‌بندی را وارد کنید.'; return }
  categorySaving.value = true
  try {
    const category = await API.createMaterialCategory({ name: newCategoryName.value })
    emit('category-created', category)
    form.category = category.id
    newCategoryName.value = ''
    showCategoryCreator.value = false
  } catch (cause) {
    categoryError.value = cause.cost?.errors?.name?.[0] || costErrorMessage(cause)
  } finally { categorySaving.value = false }
}

function submit() {
  clear()
  if (costMode.value) {
    if (form.purchase_price === '' || Number(form.purchase_price) < 0) errors.purchase_price = 'قیمت نمی‌تواند منفی باشد.'
    if (!Object.keys(errors).length) emit('submit', { purchase_price: Number(form.purchase_price) })
    return
  }
  if (!form.name) errors.name = 'نام ماده اولیه را وارد کنید.'
  if (!form.unit) errors.unit = 'واحد را انتخاب کنید.'
  const hasReferenceBasis = form.reference_total_amount !== ''
  if (hasReferenceBasis && Number(form.reference_total_amount) < 0) errors.reference_total_amount = 'مبلغ نمی‌تواند منفی باشد.'
  if (hasReferenceBasis && Number(form.reference_quantity) <= 0) errors.reference_quantity = 'مقدار باید بیشتر از صفر باشد.'
  if (hasReferenceBasis && referencePreview.value === null) errors.reference_unit = 'واحد مقدار با واحد پایه سازگار نیست.'
  if (!Object.keys(errors).length) {
    const payload = { name: form.name, unit: form.unit, category: form.category || null, is_active: form.is_active }
    if (hasReferenceBasis) Object.assign(payload, { reference_total_amount: form.reference_total_amount, reference_quantity: form.reference_quantity, reference_unit: form.reference_unit })
    emit('submit', payload)
  }
}

watch(() => [props.modelValue, props.ingredient, props.units, props.referenceUnits, props.mode], hydrate, { immediate: true, deep: true })
watch(() => form.unit, () => {
  if (!availableReferenceUnits.value.some(unit => unit.code === form.reference_unit)) form.reference_unit = availableReferenceUnits.value[0]?.code || form.unit
})
watch(() => props.fieldErrors, value => {
  clear()
  for (const [key, messages] of Object.entries(value || {})) errors[key] = Array.isArray(messages) ? messages[0] : messages
}, { deep: true })
</script>

<style scoped>
.title h2,.title p{margin:0}.title h2{font-size:1.15rem}.title p{margin-top:3px;color:var(--muted);font-size:.72rem}.catalog-explanation{margin:0 0 14px;padding:10px 12px;border-radius:9px;background:var(--surface-subtle);color:var(--muted);font-size:.73rem;line-height:1.8}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.wide{grid-column:1/-1}label{display:grid;gap:6px;font-size:.78rem;font-weight:700}label>b{color:var(--muted);font-size:.64rem;font-weight:400}input,select{width:100%;min-height:43px;padding:9px 11px;border:1px solid var(--border-strong);border-radius:9px;background:var(--input);color:var(--text);font:inherit;box-sizing:border-box}input:focus,select:focus{outline:3px solid var(--focus);border-color:var(--primary)}label small,.reference-basis small{color:var(--muted);font-size:.65rem;font-weight:400}em{color:var(--danger);font-size:.7rem;font-style:normal}.active{display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border);border-radius:9px}.active span{display:grid;gap:3px}.active input{width:20px;min-height:20px;accent-color:var(--primary)}.cost-context{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:15px;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--surface-subtle)}.cost-context div{display:grid;gap:3px}.cost-context span,.cost-context p{color:var(--muted);font-size:.68rem}.cost-context strong{font-size:.82rem}.cost-context p{grid-column:1/-1;margin:0;line-height:1.8}.category-field{display:grid;grid-template-columns:minmax(0,1fr) 42px;align-items:end;gap:7px}.category-plus{width:42px;height:43px;border:1px solid var(--primary);border-radius:9px;background:var(--surface);color:var(--primary);font-size:1.25rem;cursor:pointer}.category-create{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px;padding:10px;border:1px solid var(--border);border-radius:9px;background:var(--surface-subtle)}.category-create button{min-height:43px;padding:8px 13px;border:0;border-radius:9px;background:var(--primary);color:var(--on-primary);font:inherit}.category-create em{grid-column:1/-1}.reference-basis{min-width:0;margin:0;padding:14px;border:1px solid var(--border);border-radius:11px;background:var(--surface-subtle)}.reference-basis legend{padding:0 6px;font-size:.82rem;font-weight:800}.reference-basis>p{margin:0 0 10px;color:var(--muted);font-size:.7rem}.basis-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.reference-result{display:flex;justify-content:space-between;gap:10px;margin:10px 0 7px;padding:9px;border-radius:8px;background:var(--surface);font-size:.76rem}.error{margin-bottom:14px;padding:10px;border:1px solid color-mix(in srgb,var(--danger) 35%,transparent);border-radius:8px;background:var(--color-danger-subtle);color:var(--danger);font-size:.74rem}.primary,.secondary{min-width:110px;padding:10px 14px;border:0;border-radius:9px;font:inherit;font-weight:700}.primary{background:var(--primary);color:var(--on-primary)}.secondary{background:var(--surface-subtle);color:var(--text)}@media(max-width:600px){.grid,.cost-context,.basis-grid{grid-template-columns:1fr}.wide,.cost-context p{grid-column:auto}.category-create{grid-template-columns:1fr}.category-create button{width:100%}.reference-result{align-items:flex-start;flex-direction:column}}
</style>
