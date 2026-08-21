<template>
  <BaseModal v-model="visible" size="lg" :close-disabled="saving" :close-on-esc="!saving" :close-on-overlay-click="!saving">
    <template #header><div class="title"><h2>دسته‌بندی محصولات</h2><p>دسته‌بندی‌های قابل استفاده در فرم و فیلتر محصولات</p></div></template>

    <div dir="rtl" class="manager">
      <div v-if="error" class="notice" role="alert">{{ error }}</div>
      <form id="product-category-form" novalidate @submit.prevent="submit">
        <div class="form-heading"><strong>{{ editing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید' }}</strong><button v-if="editing" type="button" @click="resetForm">انصراف از ویرایش</button></div>
        <div class="grid">
          <label>نام دسته‌بندی <b>الزامی</b><input ref="nameInput" v-model.trim="form.name" maxlength="64" placeholder="مثلاً نوشیدنی گرم"><em v-if="fieldErrors.name">{{ fieldErrors.name }}</em></label>
          <label>منو <b>الزامی</b><select v-model="form.menu"><option value="" disabled>انتخاب منو</option><option v-for="menu in menus" :key="menu.id" :value="menu.id">{{ menu.name }}<template v-if="menu.branch_name"> — {{ menu.branch_name }}</template></option></select><em v-if="fieldErrors.menu">{{ fieldErrors.menu }}</em></label>
          <label>ترتیب نمایش <b>اختیاری</b><input v-model="form.arrange" type="number" min="0" step="1" inputmode="numeric"></label>
          <label>رنگ <b>اختیاری</b><div class="color-field"><input v-model="form.color" type="color"><input v-model.trim="form.color" dir="ltr" maxlength="7" placeholder="#8a5e3a"></div><em v-if="fieldErrors.color">{{ fieldErrors.color }}</em></label>
          <label class="wide">توضیحات <b>اختیاری</b><textarea v-model.trim="form.description" rows="2" maxlength="500" placeholder="توضیح کوتاه درباره این گروه"></textarea></label>
        </div>
        <button class="save" :disabled="saving || !menus.length">{{ saving ? 'در حال ذخیره…' : editing ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی' }}</button>
      </form>

      <section class="category-section">
        <div class="list-heading"><strong>دسته‌بندی‌های موجود</strong><input v-model.trim="search" placeholder="جستجو…"></div>
        <div v-if="loading" class="empty">در حال دریافت دسته‌بندی‌ها…</div>
        <div v-else-if="!filtered.length" class="empty">دسته‌بندی‌ای پیدا نشد.</div>
        <div v-else class="list">
          <article v-for="category in filtered" :key="category.id">
            <span class="swatch" :style="{ background: category.color || '#cbd5e1' }"></span>
            <div><strong>{{ category.name }}</strong><small>{{ category.menu_name }} · {{ category.items_count || 0 }} محصول</small></div>
            <button type="button" @click="edit(category)">ویرایش</button>
            <button type="button" class="danger" :disabled="category.items_count > 0 || category.subs_count > 0" :title="category.items_count > 0 || category.subs_count > 0 ? 'دسته دارای محصول یا زیردسته است' : 'حذف دسته‌بندی'" @click="$emit('delete', category)">حذف</button>
          </article>
        </div>
      </section>
    </div>
    <template #footer><button type="button" class="close" :disabled="saving" @click="visible=false">بستن</button></template>
  </BaseModal>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'

const props = defineProps({ modelValue: Boolean, categories: { type: Array, default: () => [] }, menus: { type: Array, default: () => [] }, loading: Boolean, saving: Boolean, error: { type: String, default: '' }, errors: { type: Object, default: () => ({}) } })
const emit = defineEmits(['update:modelValue', 'save', 'delete'])
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const editing = ref(null), search = ref(''), nameInput = ref(null), fieldErrors = reactive({})
const blank = () => ({ name: '', menu: props.menus.length === 1 ? props.menus[0].id : '', arrange: 0, color: '#8a5e3a', description: '' })
const form = reactive(blank())
const filtered = computed(() => props.categories.filter(item => !search.value || item.name.includes(search.value) || item.menu_name?.includes(search.value)))
function clearErrors() { Object.keys(fieldErrors).forEach(key => delete fieldErrors[key]) }
function resetForm() { editing.value = null; clearErrors(); Object.assign(form, blank()); nextTick(() => nameInput.value?.focus()) }
function edit(category) { editing.value = category; clearErrors(); Object.assign(form, { name: category.name, menu: category.menu, arrange: category.arrange || 0, color: category.color || '#8a5e3a', description: category.description || '' }); nextTick(() => nameInput.value?.focus()) }
function submit() { clearErrors(); if (!form.name) fieldErrors.name = 'نام دسته‌بندی را وارد کنید.'; if (!form.menu) fieldErrors.menu = 'منو را انتخاب کنید.'; if (!Object.keys(fieldErrors).length) emit('save', { id: editing.value?.id, data: { ...form, arrange: Number(form.arrange || 0), color: form.color || null } }) }
watch(() => props.modelValue, open => { if (open) resetForm() })
watch(() => props.categories, () => { if (props.modelValue) resetForm() })
watch(() => props.errors, value => { clearErrors(); for (const [key, messages] of Object.entries(value || {})) fieldErrors[key] = Array.isArray(messages) ? messages[0] : String(messages) }, { deep: true })
</script>

<style scoped>
.title h2,.title p{margin:0}.title h2{font-size:1.15rem}.title p{margin-top:3px;color:#64748b;font-size:.76rem}.manager{display:grid;gap:1.25rem}.notice{padding:.75rem 1rem;border-radius:9px;background:#fef2f2;color:#b91c1c}form{padding:1rem;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}.form-heading,.list-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}.form-heading button{border:0;background:transparent;color:#8a5e3a;cursor:pointer}.grid{display:grid;grid-template-columns:1fr 1fr;gap:.9rem}.grid label{display:grid;gap:.4rem;font-size:.8rem;font-weight:700}.grid b{color:#64748b;font-size:.68rem;font-weight:400}.wide{grid-column:1/-1}input,select,textarea{width:100%;box-sizing:border-box;padding:.68rem .75rem;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#1e293b;font:inherit}textarea{resize:vertical}input:focus,select:focus,textarea:focus{outline:3px solid #8a5e3a22;border-color:#8a5e3a}.color-field{display:grid;grid-template-columns:44px 1fr;gap:.5rem}.color-field input[type=color]{height:42px;padding:3px}em{color:#b91c1c;font-size:.7rem;font-style:normal}.save{margin-top:1rem;padding:.65rem 1rem;border:0;border-radius:8px;background:#8a5e3a;color:#fff;font:inherit;font-weight:700;cursor:pointer}.save:disabled{opacity:.55;cursor:not-allowed}.category-section{min-height:180px}.list-heading input{max-width:220px}.list{display:grid;gap:.5rem;max-height:310px;overflow:auto}.list article{display:grid;grid-template-columns:14px minmax(0,1fr) auto auto;align-items:center;gap:.7rem;padding:.7rem;border:1px solid #e2e8f0;border-radius:9px}.swatch{width:12px;height:32px;border-radius:6px}.list article>div{display:grid;gap:.2rem}.list small{color:#64748b}.list button,.close{padding:.5rem .7rem;border:0;border-radius:7px;background:#f1f5f9;color:#334155;font:inherit;cursor:pointer}.list .danger{background:#fef2f2;color:#b91c1c}.list button:disabled{opacity:.45;cursor:not-allowed}.empty{display:grid;place-items:center;min-height:130px;color:#64748b}.close{min-width:100px;font-weight:700}@media(max-width:640px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}.list-heading{align-items:stretch;flex-direction:column}.list-heading input{max-width:none}.list article{grid-template-columns:10px minmax(0,1fr) auto}.list article .danger{grid-column:3}.swatch{grid-row:1/3}}
</style>
