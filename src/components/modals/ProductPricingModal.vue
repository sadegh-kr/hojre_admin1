<template>
  <BaseModal
    v-model="visible"
    size="md"
    :close-disabled="loading"
    :close-on-esc="!loading"
    :close-on-overlay-click="!loading"
    modal-class="product-pricing-modal"
  >
    <template #header>
      <div class="modal-title">
        <h2>{{ isEditing ? 'ویرایش قیمت محصول' : 'محصول جدید' }}</h2>
        <p v-if="isEditing">{{ product.name }}</p>
      </div>
    </template>

    <form id="product-pricing-form" dir="rtl" novalidate @submit.prevent="submit">
      <div v-if="serverError" class="error-notice" role="alert">{{ serverError }}</div>
      <div class="form-grid">
        <label class="full">
          <span>نام محصول <b>الزامی</b></span>
          <input ref="nameInput" v-model.trim="form.name" maxlength="64" placeholder="نام محصول" required />
          <em v-if="errors.name">{{ errors.name }}</em>
        </label>
        <label>
          <span>دسته‌بندی <b>الزامی</b></span>
          <select v-model="form.category" required>
            <option disabled value="">انتخاب دسته‌بندی</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
          <em v-if="errors.category">{{ errors.category }}</em>
        </label>
        <label>
          <span>قیمت فروش (تومان) <b>الزامی</b></span>
          <div class="money-input"><input v-model="form.price" type="number" min="1" step="1" inputmode="decimal" placeholder="۰" required /><i>تومان</i></div>
          <small v-if="form.price">{{ formattedPrice }}</small>
          <em v-if="errors.price">{{ errors.price }}</em>
        </label>
        <label class="full">
          <span>توضیحات <b>اختیاری</b></span>
          <textarea v-model.trim="form.description" rows="3" maxlength="500" placeholder="توضیحات محصول"></textarea>
          <em v-if="errors.description">{{ errors.description }}</em>
        </label>
        <label class="status-field full">
          <span><strong>محصول فعال باشد</strong><small>محصول غیرفعال در فهرست فروش نمایش داده نمی‌شود.</small></span>
          <input v-model="form.is_active" type="checkbox" />
        </label>
      </div>
    </form>

    <template #footer>
      <button type="button" class="secondary" :disabled="loading" @click="visible = false">انصراف</button>
      <button type="submit" form="product-pricing-form" class="primary" :disabled="loading">
        {{ loading ? 'در حال ذخیره…' : isEditing ? 'ذخیره تغییرات' : 'ایجاد محصول' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'

const props = defineProps({ modelValue: Boolean, product: { type: Object, default: null }, categories: { type: Array, default: () => [] }, loading: Boolean, serverError: { type: String, default: '' }, fieldErrors: { type: Object, default: () => ({}) } })
const emit = defineEmits(['update:modelValue', 'submit'])
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const isEditing = computed(() => Boolean(props.product?.id))
const nameInput = ref(null)
const errors = reactive({})
const form = reactive({ name: '', category: '', price: '', description: '', is_active: true })
const formattedPrice = computed(() => `${Number(form.price || 0).toLocaleString('fa-IR')} تومان`)

function clearErrors() { Object.keys(errors).forEach(key => delete errors[key]) }
function hydrate() {
  clearErrors()
  Object.assign(form, { name: props.product?.name || '', category: props.product?.category || '', price: props.product?.price || '', description: props.product?.description || '', is_active: props.product?.is_active ?? true })
  if (props.modelValue) nextTick(() => nameInput.value?.focus())
}
function submit() {
  clearErrors()
  if (!form.name) errors.name = 'نام محصول را وارد کنید.'
  if (!form.category) errors.category = 'دسته‌بندی را انتخاب کنید.'
  if (!form.price || Number(form.price) <= 0) errors.price = 'قیمت فروش باید بزرگ‌تر از صفر باشد.'
  if (!Object.keys(errors).length) emit('submit', { ...form, price: Number(form.price) })
}

watch(() => [props.modelValue, props.product], hydrate, { immediate: true, deep: true })
watch(() => props.fieldErrors, value => { clearErrors(); for (const [key, messages] of Object.entries(value || {})) errors[key] = Array.isArray(messages) ? messages[0] : messages }, { deep: true })
</script>

<style scoped>
.modal-title h2,.modal-title p{margin:0}.modal-title h2{font-size:1.2rem}.modal-title p{margin-top:4px;color:var(--muted,#6b7280);font-size:.76rem;font-weight:400}#product-pricing-form{display:grid;gap:16px}.error-notice{padding:12px 14px;border:1px solid #fecaca;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:.8rem}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.form-grid label{display:grid;align-content:start;gap:6px;color:var(--text,#1f2937);font-size:.8rem;font-weight:700}.form-grid .full{grid-column:1/-1}label>span b{color:var(--muted,#6b7280);font-size:.66rem;font-weight:400}input,select,textarea{width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--border-strong,#d1d5db);border-radius:9px;background:var(--input,#fff);color:var(--text,#1f2937);font:inherit;box-sizing:border-box}textarea{resize:vertical}input:focus,select:focus,textarea:focus{outline:3px solid color-mix(in srgb,var(--primary,#8a5e3a) 16%,transparent);border-color:var(--primary,#8a5e3a)}label small{color:var(--muted,#6b7280);font-size:.68rem;font-weight:400}label em{color:#b91c1c;font-size:.72rem;font-style:normal}.money-input{position:relative}.money-input input{padding-left:58px}.money-input i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted,#6b7280);font-size:.67rem;font-style:normal}.status-field{display:flex!important;align-items:center;justify-content:space-between;padding:13px 14px;border:1px solid var(--border,#e5e7eb);border-radius:10px}.status-field>span{display:grid;gap:3px}.status-field input{width:20px;min-height:20px;accent-color:var(--primary,#8a5e3a)}.primary,.secondary{min-width:120px;padding:10px 16px;border:0;border-radius:9px;font:inherit;font-weight:700;cursor:pointer}.primary{background:var(--primary,#8a5e3a);color:#fff}.secondary{background:var(--surface-subtle,#f3f4f6);color:var(--text,#1f2937)}button:disabled{opacity:.55;cursor:not-allowed}@media(max-width:640px){.form-grid{grid-template-columns:1fr}.form-grid .full{grid-column:auto}}
</style>
