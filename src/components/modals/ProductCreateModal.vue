<template>
  <BaseModal v-model="visible" size="lg" :close-disabled="loading" :close-on-esc="!loading" :close-on-overlay-click="!loading">
    <template #header>
      <div class="modal-title"><h2>محصول جدید</h2><p>اطلاعات محصول را وارد کنید.</p></div>
    </template>
    <form id="product-create-form" dir="rtl" novalidate @submit.prevent="submit">
      <div v-if="serverError" class="server-error" role="alert">{{ serverError }}</div>

      <section class="image-field">
        <div class="preview" :class="{ empty: !previewUrl }">
          <img v-if="previewUrl" :src="previewUrl" alt="پیش‌نمایش تصویر محصول">
          <span v-else aria-hidden="true">تصویر</span>
        </div>
        <div class="image-actions">
          <strong>تصویر محصول <small>اختیاری</small></strong>
          <p>JPG، PNG یا WebP، حداکثر ۵ مگابایت</p>
          <div><label class="upload-button">{{ previewUrl ? 'تغییر تصویر' : 'انتخاب تصویر' }}<input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="selectImage"></label><button v-if="previewUrl" type="button" class="remove-button" @click="removeImage">حذف</button></div>
          <em v-if="errors.image">{{ errors.image }}</em>
        </div>
      </section>

      <div class="form-grid">
        <label class="wide">نام محصول <b>الزامی</b><input ref="nameInput" v-model.trim="form.name" maxlength="64" placeholder="مثلاً لاته" autocomplete="off"><em v-if="errors.name">{{ errors.name }}</em></label>
        <label>دسته‌بندی <b>الزامی</b><select v-model="form.category"><option value="" disabled>انتخاب دسته‌بندی</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select><em v-if="errors.category">{{ errors.category }}</em></label>
        <label>قیمت فروش <b>تومان · الزامی</b><input v-model="form.price" type="number" min="1" step="1" inputmode="numeric" placeholder="0"><small v-if="Number(form.price) > 0">{{ Number(form.price).toLocaleString('fa-IR') }} تومان</small><em v-if="errors.price">{{ errors.price }}</em></label>
        <label>وزن <b>گرم · اختیاری</b><input v-model.trim="form.weight" maxlength="16" inputmode="decimal" placeholder="مثلاً ۳۵۰"><em v-if="errors.weight">{{ errors.weight }}</em></label>
        <label>زمان آماده‌سازی <b>دقیقه · اختیاری</b><input v-model="form.preparation_time" type="number" min="0" step="1" inputmode="numeric" placeholder="مثلاً ۱۰"><em v-if="errors.preparation_time">{{ errors.preparation_time }}</em></label>
        <label>موجودی اولیه <b>اختیاری</b><input v-model="form.inventory" type="number" min="0" step="1" inputmode="numeric" placeholder="۰"><em v-if="errors.inventory">{{ errors.inventory }}</em></label>
        <label class="wide">توضیحات <b>اختیاری</b><textarea v-model.trim="form.description" rows="3" placeholder="توضیحی که برای محصول نمایش داده می‌شود"></textarea><em v-if="errors.description">{{ errors.description }}</em></label>
        <label class="wide">مواد تشکیل‌دهنده <b>اختیاری</b><textarea v-model.trim="form.ingredient" rows="2" placeholder="مواد اصلی محصول"></textarea><em v-if="errors.ingredient">{{ errors.ingredient }}</em></label>
        <label class="wide">مواد حساسیت‌زا <b>اختیاری</b><input v-model.trim="form.allergy" placeholder="مثلاً شیر و مغزها"><em v-if="errors.allergy">{{ errors.allergy }}</em></label>
      </div>

      <div class="switches">
        <label><span><strong>محصول فعال باشد</strong><small>محصول فعال در فهرست قابل استفاده است.</small></span><input v-model="form.is_active" type="checkbox"></label>
        <label><span><strong>نمایش موجودی</strong><small>تعداد موجودی محصول نمایش داده شود.</small></span><input v-model="form.show_inventory" type="checkbox"></label>
      </div>
    </form>
    <template #footer><button type="button" class="secondary" :disabled="loading" @click="visible=false">انصراف</button><button class="primary" form="product-create-form" :disabled="loading">{{ loading ? 'در حال ذخیره…' : 'ایجاد محصول' }}</button></template>
  </BaseModal>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'

const props = defineProps({ modelValue: Boolean, categories: { type: Array, default: () => [] }, loading: Boolean, serverError: { type: String, default: '' }, fieldErrors: { type: Object, default: () => ({}) } })
const emit = defineEmits(['update:modelValue', 'submit'])
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const nameInput = ref(null), fileInput = ref(null), imageFile = ref(null), previewUrl = ref('')
const errors = reactive({})
const blank = () => ({ name: '', category: '', price: '', weight: '', inventory: 0, show_inventory: false, preparation_time: '', description: '', ingredient: '', allergy: '', is_active: true })
const form = reactive(blank())

function clearErrors() { Object.keys(errors).forEach(key => delete errors[key]) }
function clearPreview() { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value); previewUrl.value = ''; imageFile.value = null; if (fileInput.value) fileInput.value.value = '' }
function reset() { clearErrors(); clearPreview(); Object.assign(form, blank()); nextTick(() => nameInput.value?.focus()) }
function selectImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { errors.image = 'فرمت تصویر باید JPG، PNG یا WebP باشد.'; event.target.value = ''; return }
  if (file.size > 5 * 1024 * 1024) { errors.image = 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد.'; event.target.value = ''; return }
  delete errors.image; clearPreview(); imageFile.value = file; previewUrl.value = URL.createObjectURL(file)
}
function removeImage() { clearPreview(); delete errors.image }
function submit() {
  clearErrors()
  if (!form.name) errors.name = 'نام محصول را وارد کنید.'
  if (!form.category) errors.category = 'دسته‌بندی را انتخاب کنید.'
  if (!form.price || Number(form.price) <= 0) errors.price = 'قیمت باید بیشتر از صفر باشد.'
  if (Number(form.inventory) < 0) errors.inventory = 'موجودی نمی‌تواند منفی باشد.'
  if (form.preparation_time !== '' && Number(form.preparation_time) < 0) errors.preparation_time = 'زمان آماده‌سازی نمی‌تواند منفی باشد.'
  if (Object.keys(errors).length) return
  emit('submit', { data: { ...form, price: Number(form.price), inventory: Number(form.inventory || 0), preparation_time: form.preparation_time === '' ? null : Number(form.preparation_time) }, image: imageFile.value })
}
watch(() => props.modelValue, open => { if (open) reset() })
watch(() => props.fieldErrors, value => { for (const [key, messages] of Object.entries(value || {})) errors[key] = Array.isArray(messages) ? messages[0] : String(messages) }, { deep: true })
onBeforeUnmount(clearPreview)
</script>

<style scoped>
.modal-title h2{margin:0;font-size:1.2rem}.modal-title p{margin:.25rem 0 0;color:#64748b;font-size:.85rem}.server-error{padding:.75rem 1rem;margin-bottom:1rem;border-radius:10px;background:#fef2f2;color:#b91c1c}.image-field{display:flex;align-items:center;gap:1rem;padding:1rem;margin-bottom:1.25rem;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}.preview{width:112px;height:112px;flex:0 0 112px;overflow:hidden;border-radius:12px;background:#fff;border:1px solid #e2e8f0}.preview img{width:100%;height:100%;object-fit:cover}.preview.empty{display:grid;place-items:center;color:#94a3b8;font-size:.8rem}.image-actions strong{display:block;color:#1e293b}.image-actions strong small,label b{color:#64748b;font-size:.72rem;font-weight:500}.image-actions p{margin:.35rem 0 .75rem;color:#64748b;font-size:.8rem}.image-actions>div{display:flex;gap:.5rem}.upload-button,.remove-button{padding:.55rem .8rem;border-radius:8px;font:inherit;font-size:.82rem;cursor:pointer}.upload-button{background:#334155;color:#fff}.upload-button input{display:none}.remove-button{border:1px solid #fecaca;background:#fff;color:#b91c1c}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.form-grid label{display:flex;flex-direction:column;gap:.4rem;color:#334155;font-size:.86rem}.wide{grid-column:1/-1}input,select,textarea{width:100%;box-sizing:border-box;padding:.7rem .8rem;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#1e293b;font:inherit}textarea{resize:vertical}input:focus,select:focus,textarea:focus{outline:3px solid #8a5e3a22;border-color:#8a5e3a}em{display:block;color:#b91c1c;font-size:.76rem;font-style:normal}label small{color:#64748b;font-size:.74rem}.switches{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:1rem}.switches label{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem;border:1px solid #e2e8f0;border-radius:10px}.switches span{display:grid;gap:.2rem}.switches small{color:#64748b}.switches input{width:18px;height:18px}.secondary,.primary{min-width:110px;padding:.7rem 1rem;border-radius:9px;border:0;font:inherit;font-weight:700;cursor:pointer}.secondary{background:#f1f5f9;color:#475569}.primary{background:#8a5e3a;color:#fff}.secondary:disabled,.primary:disabled{opacity:.6;cursor:not-allowed}@media(max-width:640px){.image-field{align-items:flex-start}.preview{width:88px;height:88px;flex-basis:88px}.form-grid,.switches{grid-template-columns:1fr}.wide{grid-column:auto}.image-actions>div{flex-wrap:wrap}}
</style>
