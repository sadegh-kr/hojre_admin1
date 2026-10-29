<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  PAYMENT_METHODS,
  applyAutomaticRemainder,
  createPaymentState,
  formatPaymentAmount,
  getSelectedMethods,
  groupedCaretPosition,
  paymentTotals,
  toMoneyNumber,
  togglePaymentMethod,
  updatePaymentAmount
} from '@/utils/paymentAllocation'

const props = defineProps({
  items: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
  checkoutDisabled: { type: Boolean, default: false },
  customer: { type: Object, default: null },
  walletBalance: { type: [Number, String], default: null },
  walletLoading: { type: Boolean, default: false },
  walletError: { type: String, default: '' }
})

const emit = defineEmits([
  'update-quantity', 'remove-item', 'clear-invoice', 'submit-order', 'wallet-selection-change'
])

const methods = PAYMENT_METHODS
const payments = reactive(createPaymentState())
const remainderMethod = ref('pos')
const automaticRemainder = ref(true)
const payLater = ref(false)

const toNumber = toMoneyNumber
const invoiceItems = computed(() => props.items.map((item, index) => {
  const price = toNumber(item.price)
  const quantity = item.quantity || 1
  return { ...item, price, quantity, rowTotal: price * quantity, index: index + 1 }
}))
const subtotal = computed(() => invoiceItems.value.reduce((sum, item) => sum + item.rowTotal, 0))
const selectedMethods = computed(() => getSelectedMethods(payments))
const allocationTotals = computed(() => paymentTotals(payments, subtotal.value))
const allocatedTotal = computed(() => allocationTotals.value.allocated)
const difference = computed(() => allocationTotals.value.difference)
const walletAmount = computed(() => toNumber(payments.wallet.amount))
const numericWalletBalance = computed(() => props.walletBalance === null ? null : toNumber(props.walletBalance))
const projectedWalletBalance = computed(() => numericWalletBalance.value === null
  ? null
  : numericWalletBalance.value - walletAmount.value)
const walletSelected = computed(() => payments.wallet.selected)
const allocationValid = computed(() => (
  selectedMethods.value.length > 0
  && selectedMethods.value.every(method => Number.isSafeInteger(toNumber(payments[method.code].amount)) && toNumber(payments[method.code].amount) > 0 && toNumber(payments[method.code].amount) <= 999999999999)
  && difference.value === 0
))
const walletValid = computed(() => (
  !walletSelected.value
  || (
    Boolean(props.customer)
    && !props.walletLoading
    && !props.walletError
    && numericWalletBalance.value !== null
    && projectedWalletBalance.value >= 0
  )
))
const confirmationsValid = computed(() => selectedMethods.value.every(method => (
  method.code === 'wallet' || payments[method.code].confirmed
)))
const checkoutError = computed(() => {
  if (!props.items.length) return ''
  if (payLater.value) return ''
  if (!selectedMethods.value.length) return 'حداقل یک روش پرداخت انتخاب کنید.'
  if (selectedMethods.value.some(method => !Number.isSafeInteger(toNumber(payments[method.code].amount)) || toNumber(payments[method.code].amount) <= 0 || toNumber(payments[method.code].amount) > 999999999999)) {
    return 'مبلغ هر روش باید یک عدد صحیح مثبت و معتبر باشد.'
  }
  if (difference.value > 0) return `${formattedPrice(difference.value)} تومان از مبلغ سفارش تخصیص داده نشده است.`
  if (difference.value < 0) return `${formattedPrice(Math.abs(difference.value))} تومان بیشتر از مبلغ سفارش تخصیص داده شده است.`
  if (walletSelected.value && !props.customer) return 'برای پرداخت با کیف پول، مشتری را انتخاب کنید.'
  if (walletSelected.value && props.walletLoading) return 'موجودی کیف پول در حال دریافت است.'
  if (walletSelected.value && props.walletError) return props.walletError
  if (walletSelected.value && projectedWalletBalance.value < 0) return 'موجودی کیف پول کافی نیست؛ ثبت فروش اعتباری فعلاً غیرفعال است. روش پرداخت دیگری انتخاب کنید.'
  if (!confirmationsValid.value) return 'دریافت وجه همهٔ روش‌های دستی انتخاب‌شده را صریحاً تأیید کنید.'
  return ''
})
const canSubmit = computed(() => (
  !props.submitting && !props.checkoutDisabled && props.items.length > 0
  && (payLater.value || (allocationValid.value && walletValid.value && confirmationsValid.value))
))

function formattedPrice(value) {
  return formatPaymentAmount(value)
}
function confirmationLabel(code) {
  return {
    cash: 'دریافت کامل وجه نقد از مشتری را تأیید می‌کنم.',
    card_to_card: 'واریز کارت‌به‌کارت را در حساب یا رسید بانکی تأیید می‌کنم.',
    pos: 'موفق بودن تراکنش کارت‌خوان و دریافت رسید را تأیید می‌کنم.'
  }[code] || ''
}
function resetPaymentState() {
  const walletWasSelected = payments.wallet.selected
  const fresh = createPaymentState(subtotal.value)
  methods.forEach(method => Object.assign(payments[method.code], fresh[method.code]))
  remainderMethod.value = 'pos'
  automaticRemainder.value = true
  if (walletWasSelected) emit('wallet-selection-change', false)
}
function recalculateRemainder() {
  if (!automaticRemainder.value || !payments[remainderMethod.value]?.selected) return
  applyAutomaticRemainder(payments, subtotal.value, remainderMethod.value)
}
function toggleMethod(code, selected) {
  const result = togglePaymentMethod(payments, code, selected, subtotal.value, remainderMethod.value)
  if (!result.changed) return
  remainderMethod.value = result.remainderMethod
  automaticRemainder.value = result.automatic
  if (code === 'wallet') emit('wallet-selection-change', selected)
}
function updateAmount(code, value) {
  automaticRemainder.value = updatePaymentAmount(
    payments, code, value, subtotal.value, remainderMethod.value, automaticRemainder.value
  )
}
function onAmountInput(code, event) {
  const input = event.target
  const raw = input.value
  const caret = input.selectionStart ?? raw.length
  updateAmount(code, raw)
  const formatted = formatPaymentAmount(payments[code].amount)
  input.value = formatted
  const nextCaret = groupedCaretPosition(raw, caret, formatted)
  input.setSelectionRange(nextCaret, nextCaret)
}
function onAmountKeydown(code, event) {
  const input = event.target
  const start = input.selectionStart, end = input.selectionEnd
  if (start !== end) return
  let removeAt = -1
  if (event.key === 'Backspace' && start > 1 && input.value[start - 1] === ',') removeAt = start - 2
  if (event.key === 'Delete' && input.value[start] === ',' && start + 1 < input.value.length) removeAt = start + 1
  if (removeAt < 0) return
  event.preventDefault()
  input.setRangeText('', removeAt, removeAt + 1, 'start')
  onAmountInput(code, { target: input })
}
function setAsRemainder(code) {
  remainderMethod.value = code
  automaticRemainder.value = true
  recalculateRemainder()
}
function increaseQuantity(item) {
  emit('update-quantity', item.id, (item.quantity || 1) + 1)
}
function decreaseQuantity(item) {
  if ((item.quantity || 1) > 1) emit('update-quantity', item.id, item.quantity - 1)
}
function submit() {
  if (!canSubmit.value) return
  emit('submit-order', {
    expected_total: subtotal.value,
    pay_later: payLater.value,
    payments: payLater.value ? [] : selectedMethods.value.map(method => ({
      method: method.code,
      amount: toNumber(payments[method.code].amount),
      confirmed: method.code === 'wallet' ? true : Boolean(payments[method.code].confirmed),
      reference: payments[method.code].reference.trim()
    }))
  })
}

watch(subtotal, total => {
  if (selectedMethods.value.length === 1) {
    payments[selectedMethods.value[0].code].amount = total
    automaticRemainder.value = true
  } else {
    recalculateRemainder()
  }
}, { immediate: true })
watch(() => props.items.length, (length, previousLength) => {
  if (length === 0 && previousLength > 0) { payLater.value = false; resetPaymentState() }
})
watch(payLater, enabled => {
  methods.forEach(method => { payments[method.code].confirmed = false; payments[method.code].reference = '' })
  if (payments.wallet.selected) emit('wallet-selection-change', !enabled)
})
</script>

<template>
  <section class="calculator" aria-label="فاکتور و پرداخت سفارش">
    <header class="invoice-header">
      <div class="header-right"><span class="invoice-icon">🧾</span><h3>فاکتور فروش</h3></div>
      <button v-if="items.length" type="button" class="clear-all-btn" @click="$emit('clear-invoice')">حذف همه</button>
    </header>

    <div class="checkout-scroll">
      <div class="invoice-items-container">
        <div v-if="items.length === 0" class="empty-invoice">
          <span class="empty-icon">📋</span><p>فاکتور خالی است</p><small>محصولات را از سمت راست انتخاب کنید</small>
        </div>
        <div v-else class="invoice-items">
          <article v-for="item in invoiceItems" :key="item.id" class="invoice-row">
            <div class="item-info">
              <span class="item-index">{{ item.index }}</span>
              <span class="item-name" :title="item.name">{{ item.name }}</span>
              <button type="button" class="remove-btn" title="حذف" @click="$emit('remove-item', item.id)">×</button>
            </div>
            <div class="item-details">
              <span class="item-price">{{ formattedPrice(item.price) }} تومان</span>
              <div class="quantity-control">
                <button type="button" class="qty-btn" @click="decreaseQuantity(item)">−</button>
                <span class="quantity">{{ item.quantity.toLocaleString('fa-IR') }}</span>
                <button type="button" class="qty-btn" @click="increaseQuantity(item)">+</button>
              </div>
              <strong class="row-total">{{ formattedPrice(item.rowTotal) }} تومان</strong>
            </div>
            <small class="availability" :class="item.availability_status">
              {{ item.availability_message || 'موجودی قابل محاسبه نیست' }}
            </small>
          </article>
        </div>
      </div>

      <section class="invoice-summary">
        <div class="summary-row"><span>جمع اقلام</span><span>{{ formattedPrice(subtotal) }} تومان</span></div>
        <div class="summary-row total"><span>مبلغ قابل پرداخت</span><strong>{{ formattedPrice(subtotal) }} تومان</strong></div>
      </section>

      <section class="payment-section">
        <label class="pay-later-field"><input v-model="payLater" type="checkbox"><span>پرداخت در آینده</span></label>
        <p v-if="payLater" class="checkout-ready">سفارش بدون پرداخت ثبت می‌شود و تا دریافت وجه، پرداخت‌نشده خواهد بود.</p>
        <template v-else>
        <div class="section-heading"><div><h4>روش پرداخت</h4><p>یک تا چهار روش را انتخاب و مبلغ را تقسیم کنید.</p></div></div>
        <div class="method-selector">
          <label v-for="method in methods" :key="method.code" :class="['method-chip', { selected: payments[method.code].selected }]">
            <input
              type="checkbox"
              :checked="payments[method.code].selected"
              :disabled="payments[method.code].selected && selectedMethods.length === 1"
              @change="toggleMethod(method.code, $event.target.checked)"
            >
            <span>{{ method.label }}</span>
          </label>
        </div>

        <div class="allocation-list">
          <article v-for="method in selectedMethods" :key="method.code" class="allocation-row">
            <div class="allocation-title">
              <div><strong>{{ method.label }}</strong><small>{{ method.hint }}</small></div>
              <button
                v-if="selectedMethods.length > 1"
                type="button"
                :class="{ active: automaticRemainder && remainderMethod === method.code }"
                @click="setAsRemainder(method.code)"
              >تخصیص مانده</button>
            </div>
            <label class="amount-field">
              <span>مبلغ (تومان)</span>
              <input
                type="text"
                inputmode="numeric"
                :value="formatPaymentAmount(payments[method.code].amount)"
                @input="onAmountInput(method.code, $event)"
                @keydown="onAmountKeydown(method.code, $event)"
              >
            </label>
            <label v-if="method.code !== 'wallet'" class="confirmation-field">
              <input v-model="payments[method.code].confirmed" type="checkbox">
              <span>{{ confirmationLabel(method.code) }}</span>
            </label>
            <label v-if="method.code === 'card_to_card' || method.code === 'pos'" class="reference-field">
              <span>شماره پیگیری / رسید (اختیاری)</span>
              <input v-model.trim="payments[method.code].reference" type="text" maxlength="128">
            </label>
          </article>
        </div>

        <div v-if="walletSelected" class="wallet-panel">
          <template v-if="!customer"><strong>مشتری انتخاب نشده است</strong><span>برای استفاده از کیف پول، ابتدا مشتری را انتخاب کنید.</span></template>
          <template v-else-if="walletLoading"><span>در حال دریافت موجودی واقعی کیف پول…</span></template>
          <template v-else-if="walletError"><strong>دریافت موجودی ناموفق بود</strong><span>{{ walletError }}</span></template>
          <template v-else>
            <div><span>موجودی قابل استفاده</span><strong>{{ formattedPrice(numericWalletBalance) }} تومان</strong></div>
            <div><span>پرداخت از کیف پول</span><strong>{{ formattedPrice(walletAmount) }} تومان</strong></div>
            <div :class="{ danger: projectedWalletBalance < 0 }"><span>مانده پس از ثبت</span><strong>{{ formattedPrice(projectedWalletBalance) }} تومان</strong></div>
            <p v-if="projectedWalletBalance < 0" class="wallet-debt-warning">ثبت بدهی کیف پول فعلاً در دسترس نیست؛ مبلغ کیف پول را کاهش دهید یا روش دیگری انتخاب کنید.</p>
          </template>
        </div>

        <div class="allocation-summary">
          <div><span>جمع تخصیص</span><strong>{{ formattedPrice(allocatedTotal) }} تومان</strong></div>
          <div :class="{ valid: difference === 0, danger: difference < 0 }">
            <span>{{ difference < 0 ? 'مبلغ مازاد' : 'مانده تخصیص' }}</span>
            <strong>{{ formattedPrice(Math.abs(difference)) }} تومان</strong>
          </div>
        </div>
        <p v-if="checkoutError" class="checkout-error" role="alert">{{ checkoutError }}</p>
        <p v-else class="checkout-ready">جمع پرداخت با مبلغ سفارش برابر است.</p>
        </template>
      </section>
    </div>

    <footer class="invoice-actions">
      <p>{{ payLater ? 'پرداخت بعداً از جزئیات سفارش ثبت می‌شود.' : 'پرداخت دستی بدون تأیید صریح دریافت وجه ثبت نمی‌شود.' }}</p>
      <button type="button" class="btn-register" :disabled="!canSubmit" @click="submit">
        <span v-if="submitting" class="spinner"></span><span v-else>✓</span>
        {{ submitting ? 'در حال ثبت…' : 'ثبت سفارش' }}
      </button>
    </footer>
  </section>
</template>

<style scoped>
.calculator{display:flex;flex:1;flex-direction:column;height:100%;min-height:0;min-width:0;background:var(--surface);border-radius:20px;overflow:hidden;color:var(--text)}
.invoice-header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--border);flex:0 0 auto}.header-right{display:flex;align-items:center;gap:9px}.invoice-icon{font-size:20px}.invoice-header h3{margin:0;font-size:16px}.clear-all-btn{border:1px solid var(--color-danger-subtle);border-radius:999px;padding:5px 11px;background:transparent;color:var(--color-danger);font:inherit;font-size:11px;cursor:pointer}
.checkout-scroll{flex:1;min-height:0;overflow-y:auto;background:var(--surface-subtle)}.invoice-items-container{min-height:150px}.invoice-items{display:grid;gap:8px;padding:12px}.empty-invoice{display:grid;place-items:center;align-content:center;min-height:180px;color:var(--muted);text-align:center}.empty-icon{font-size:38px}.empty-invoice p{margin:8px 0 2px;font-weight:700}.empty-invoice small{font-size:11px}
.invoice-row{padding:11px;background:var(--surface);border:1px solid var(--border);border-radius:12px}.item-info,.item-details{display:flex;align-items:center;gap:8px}.item-index{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:var(--surface-subtle);font-size:10px;font-weight:800}.item-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:700}.remove-btn{border:0;background:transparent;color:var(--color-danger);font-size:18px;cursor:pointer}.item-details{justify-content:space-between;margin-top:8px;flex-wrap:wrap}.item-price{font-size:11px;color:var(--muted)}.row-total{font-size:12px;white-space:nowrap}.quantity-control{display:flex;align-items:center;gap:5px}.qty-btn{display:grid;place-items:center;width:26px;height:26px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--text);cursor:pointer}.quantity{min-width:24px;text-align:center;font-size:12px;font-weight:800}.availability{display:block;margin-top:7px;color:var(--muted);font-size:10px}
.invoice-summary,.payment-section{padding:14px 18px;border-top:1px solid var(--border);background:var(--surface)}.summary-row{display:flex;justify-content:space-between;padding:4px 0;color:var(--muted);font-size:12px}.summary-row.total{padding-top:9px;color:var(--text);font-size:15px}.summary-row.total strong{color:var(--color-success)}
.section-heading h4{margin:0;font-size:14px}.section-heading p{margin:3px 0 10px;color:var(--muted);font-size:10px}.method-selector{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.method-chip{display:flex;align-items:center;gap:6px;padding:8px 9px;border:1px solid var(--border);border-radius:10px;background:var(--surface-subtle);font-size:11px;cursor:pointer}.method-chip.selected{border-color:var(--color-success);background:var(--color-success-subtle);color:var(--color-success)}.method-chip input{accent-color:var(--color-success)}
.pay-later-field{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13px;font-weight:700;cursor:pointer}.pay-later-field input{accent-color:var(--primary)}
.allocation-list{display:grid;gap:8px;margin-top:10px}.allocation-row{padding:10px;border:1px solid var(--border);border-radius:11px;background:var(--surface-subtle)}.allocation-title{display:flex;justify-content:space-between;gap:8px;align-items:start}.allocation-title strong,.allocation-title small{display:block}.allocation-title strong{font-size:12px}.allocation-title small{margin-top:2px;color:var(--muted);font-size:9px}.allocation-title button{border:1px solid var(--border);border-radius:999px;padding:4px 7px;background:var(--surface);color:var(--muted);font:inherit;font-size:9px;cursor:pointer}.allocation-title button.active{border-color:var(--color-success);color:var(--color-success)}.amount-field,.reference-field{display:grid;gap:4px;margin-top:8px;color:var(--muted);font-size:9px}.amount-field input,.reference-field input{width:100%;min-height:34px;border:1px solid var(--border-strong);border-radius:8px;padding:5px 8px;background:var(--input);color:var(--text);font:inherit;direction:ltr;text-align:left}.confirmation-field{display:flex;align-items:flex-start;gap:6px;margin-top:8px;font-size:10px;cursor:pointer}.confirmation-field input{accent-color:var(--color-success)}
.wallet-panel{display:grid;gap:6px;margin-top:10px;padding:10px;border:1px solid var(--primary);border-radius:11px;background:color-mix(in srgb,var(--primary) 8%,var(--surface))}.wallet-panel>div,.allocation-summary>div{display:flex;justify-content:space-between;gap:8px;font-size:11px}.wallet-panel>span{font-size:10px;color:var(--muted)}.wallet-panel .danger,.allocation-summary .danger{color:var(--color-danger)}
.wallet-debt-warning{margin:3px 0 0;padding-top:6px;border-top:1px dashed var(--color-danger);color:var(--color-danger);font-size:10px;line-height:1.7}
.allocation-summary{display:grid;gap:5px;margin-top:10px;padding-top:9px;border-top:1px dashed var(--border)}.allocation-summary .valid{color:var(--color-success)}.checkout-error,.checkout-ready{margin:9px 0 0;padding:7px 9px;border-radius:8px;font-size:10px}.checkout-error{background:var(--color-danger-subtle);color:var(--color-danger)}.checkout-ready{background:var(--color-success-subtle);color:var(--color-success)}
.invoice-actions{flex:0 0 auto;padding:11px 16px 14px;border-top:1px solid var(--border);background:var(--surface)}.invoice-actions p{margin:0 0 7px;color:var(--muted);font-size:9px;text-align:center}.btn-register{display:flex;width:100%;min-height:46px;align-items:center;justify-content:center;gap:8px;border:0;border-radius:12px;background:var(--color-success);color:var(--on-success);font:inherit;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(76,175,80,.2)}.btn-register:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}.spinner{width:16px;height:16px;border:2px solid currentColor;border-left-color:transparent;border-radius:50%;animation:spin .75s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.checkout-scroll::-webkit-scrollbar{width:5px}.checkout-scroll::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:999px}
@media(max-width:768px){.calculator{height:100%;border-radius:16px}.method-selector{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
