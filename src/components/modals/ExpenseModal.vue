<template>
  <BaseModal
    v-model="visible"
    size="lg"
    modal-class="expense-entry-modal"
    :close-disabled="loading"
    :close-on-esc="!loading"
    :close-on-overlay-click="!loading"
  >
    <template #header>
      <div class="modal-title">
        <h2>{{ isEditing ? 'ویرایش هزینه' : 'ثبت هزینه' }}</h2>
        <p>{{ isEditing ? 'اطلاعات هزینه را اصلاح کنید.' : 'مشخص کنید مبلغ برای چه موردی هزینه شده است.' }}</p>
      </div>
    </template>

    <form id="expense-form" dir="rtl" novalidate @submit.prevent="submit">
      <div v-if="serverError" class="server-error" role="alert">{{ serverError }}</div>

      <section aria-labelledby="expense-main-fields">
        <h3 id="expense-main-fields">مشخصات هزینه</h3>
        <div class="form-grid">
          <label class="full">
            <span>هزینه بابت چه بود؟ <b>الزامی</b></span>
            <input ref="titleInput" v-model.trim="form.title" maxlength="150" placeholder="مثلاً خرید ۱۰ کیلو قهوه" required />
            <small>نام کالا، خدمت یا دلیل پرداخت را مشخص و کوتاه بنویسید.</small>
            <em v-if="errors.title">{{ errors.title }}</em>
          </label>
          <label>
            <span>دسته‌بندی <b>الزامی</b></span>
            <select v-model="form.category" required>
              <option value="" disabled>انتخاب دسته‌بندی</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
            <button v-if="!categories.length" type="button" class="inline-action" @click="$emit('request-category')">ایجاد دسته‌بندی</button>
            <em v-if="errors.category">{{ errors.category }}</em>
          </label>
          <label>
            <span>مبلغ (تومان) <b>الزامی</b></span>
            <div class="money-input"><input v-model="form.amount" type="number" min="1" step="1" inputmode="decimal" placeholder="۰" required /><i>تومان</i></div>
            <small v-if="form.amount">{{ formattedAmount }}</small>
            <em v-if="errors.amount">{{ errors.amount }}</em>
          </label>
          <label>
            <span>تاریخ هزینه <b>الزامی</b></span>
            <JalaliDatePicker v-model="form.date" :clearable="false" />
            <em v-if="errors.date">{{ errors.date }}</em>
          </label>
        </div>
      </section>

      <section aria-labelledby="expense-payment-fields">
        <h3 id="expense-payment-fields">پرداخت</h3>
        <div class="payment-statuses">
          <label :class="{ selected: form.payment_status === 'paid' }"><input v-model="form.payment_status" type="radio" value="paid" /><strong>پرداخت‌شده</strong><small>مبلغ تسویه شده است</small></label>
          <label :class="{ selected: form.payment_status === 'pending' }"><input v-model="form.payment_status" type="radio" value="pending" /><strong>در انتظار پرداخت</strong><small>هنوز باید پرداخت شود</small></label>
          <label :class="{ selected: form.payment_status === 'cancelled' }"><input v-model="form.payment_status" type="radio" value="cancelled" /><strong>لغوشده</strong><small>فقط در سوابق نمایش داده می‌شود</small></label>
        </div>
        <label class="payment-method"><span>روش پرداخت <b>اختیاری</b></span><select v-model="form.payment_method"><option value="">انتخاب نشده</option><option value="cash">نقدی</option><option value="card">کارت‌خوان</option><option value="transfer">انتقال بانکی</option><option value="online">پرداخت آنلاین</option><option value="other">سایر</option></select></label>
      </section>

      <section aria-labelledby="expense-details-fields">
        <h3 id="expense-details-fields">جزئیات تکمیلی <small>اختیاری</small></h3>
        <div class="form-grid">
          <label class="full"><span>توضیحات</span><textarea v-model.trim="form.description" maxlength="200" rows="3" placeholder="جزئیاتی که برای بررسی بعدی مفید است"></textarea><small>{{ form.description.length.toLocaleString('fa-IR') }} از ۲۰۰ کاراکتر</small><em v-if="errors.description">{{ errors.description }}</em></label>
          <label class="full"><span>شماره فاکتور یا مرجع</span><input v-model.trim="form.reference_number" maxlength="50" placeholder="مثلاً INV-1405-024" dir="ltr" /><em v-if="errors.reference_number">{{ errors.reference_number }}</em></label>
        </div>
      </section>
    </form>

    <template #footer>
      <button type="button" class="secondary" :disabled="loading" @click="visible = false">انصراف</button>
      <button type="submit" form="expense-form" class="primary" :disabled="loading || !categories.length">{{ loading ? 'در حال ذخیره…' : isEditing ? 'ذخیره تغییرات' : 'ثبت هزینه' }}</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'

const props = defineProps({ modelValue: Boolean, categories: { type: Array, default: () => [] }, expense: { type: Object, default: null }, loading: Boolean, serverError: String, fieldErrors: { type: Object, default: () => ({}) } })
const emit = defineEmits(['update:modelValue', 'submit', 'request-category'])
const errors = reactive({})
const titleInput = ref(null)
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const isEditing = computed(() => Boolean(props.expense?.id))
const formattedAmount = computed(() => `${Number(form.amount || 0).toLocaleString('fa-IR')} تومان`)

function tehranYmd() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const value = type => parts.find(part => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}
const fresh = () => ({ title: '', category: '', amount: '', date: tehranYmd(), payment_status: 'paid', payment_method: '', description: '', reference_number: '' })
const form = reactive(fresh())
function clearErrors() { Object.keys(errors).forEach(key => delete errors[key]) }
function hydrate() {
  clearErrors()
  Object.assign(form, fresh(), props.expense ? { title: props.expense.title || '', category: props.expense.category || '', amount: props.expense.amount || '', date: props.expense.date?.slice(0, 10) || tehranYmd(), payment_status: props.expense.payment_status || 'paid', payment_method: props.expense.payment_method || '', description: props.expense.description || '', reference_number: props.expense.reference_number || '' } : {})
  if (props.modelValue) nextTick(() => titleInput.value?.focus())
}
function submit() {
  clearErrors()
  if (!form.title) errors.title = 'موضوع هزینه را وارد کنید.'
  if (!form.category) errors.category = 'دسته‌بندی را انتخاب کنید.'
  if (!form.amount || Number(form.amount) <= 0) errors.amount = 'مبلغ باید بزرگ‌تر از صفر باشد.'
  if (!form.date) errors.date = 'تاریخ هزینه را وارد کنید.'
  if (!Object.keys(errors).length) emit('submit', { ...form })
}
watch(() => [props.modelValue, props.expense], hydrate, { immediate: true, deep: true })
watch(() => props.fieldErrors, value => { clearErrors(); for (const [key, messages] of Object.entries(value || {})) errors[key] = Array.isArray(messages) ? messages[0] : messages }, { deep: true })
</script>

<style scoped>
.modal-title h2,.modal-title p{margin:0}.modal-title h2{font-size:1.2rem}.modal-title p{margin-top:4px;color:var(--muted,#6b7280);font-size:.78rem;font-weight:400}
#expense-form{display:grid;gap:20px}.server-error{padding:12px 14px;border:1px solid #fecaca;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:.82rem}
section{padding:18px;border:1px solid var(--border,#e5e7eb);border-radius:12px}section h3{margin:0 0 16px;font-size:.93rem}section h3 small{color:var(--muted,#6b7280);font-size:.7rem;font-weight:400}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.form-grid label,.payment-method{display:grid;align-content:start;gap:6px;font-size:.8rem;font-weight:700}.form-grid .full{grid-column:1/-1}label>span b{color:var(--muted,#6b7280);font-size:.66rem;font-weight:400}
input,select,textarea,:deep(.jalali-input){width:100%;min-height:44px;padding:10px 12px!important;border:1px solid var(--border-strong,#d1d5db)!important;border-radius:9px!important;background:var(--input,#fff)!important;color:var(--text,#1f2937)!important;font:inherit!important;box-sizing:border-box}textarea{resize:vertical}input:focus,select:focus,textarea:focus{outline:3px solid color-mix(in srgb,var(--primary,#8a5e3a) 16%,transparent);border-color:var(--primary,#8a5e3a)!important}label small{color:var(--muted,#6b7280);font-size:.68rem;font-weight:400}label em{color:#b91c1c;font-size:.72rem;font-style:normal}.money-input{position:relative}.money-input input{padding-left:58px!important}.money-input i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted,#6b7280);font-size:.67rem;font-style:normal}.inline-action{justify-self:start;padding:0;border:0;background:transparent;color:var(--primary,#8a5e3a);font:inherit;font-size:.72rem;cursor:pointer}
.payment-statuses{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.payment-statuses label{position:relative;display:grid;gap:3px;padding:12px;border:1px solid var(--border,#e5e7eb);border-radius:10px;cursor:pointer}.payment-statuses label.selected{border-color:var(--primary,#8a5e3a);background:color-mix(in srgb,var(--primary,#8a5e3a) 7%,var(--surface,#fff))}.payment-statuses input{position:absolute;opacity:0;pointer-events:none}.payment-statuses strong{font-size:.78rem}.payment-statuses small{color:var(--muted,#6b7280);font-size:.65rem}.payment-method{max-width:260px;margin-top:14px}
.primary,.secondary{min-width:112px;padding:10px 16px;border:0;border-radius:9px;font:inherit;font-weight:700;cursor:pointer}.primary{background:var(--primary,#8a5e3a);color:#fff}.secondary{background:var(--surface-subtle,#f3f4f6);color:var(--text,#1f2937)}button:disabled{opacity:.55;cursor:not-allowed}
@media(max-width:640px){.form-grid,.payment-statuses{grid-template-columns:1fr}.form-grid .full{grid-column:auto}section{padding:14px}.payment-method{max-width:none}}
</style>
