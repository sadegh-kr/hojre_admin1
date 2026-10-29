export const PAYMENT_METHODS = [
  { code: 'cash', label: 'نقدی', hint: 'وجه نقد دریافتی از مشتری' },
  { code: 'card_to_card', label: 'کارت‌به‌کارت', hint: 'انتقال مستقیم به کارت' },
  { code: 'pos', label: 'پوز', hint: 'پرداخت با کارت‌خوان فیزیکی' },
  { code: 'wallet', label: 'کیف پول', hint: 'برداشت قطعی از کیف پول مشتری' }
]

export function parsePaymentAmount(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : NaN
  const normalized = String(value ?? '')
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/تومان\s*$/, '')
    .replace(/[\s,٬]/g, '')
  if (!normalized) return null
  if (!/^-?\d+$/.test(normalized)) return NaN
  const amount = Number(normalized)
  return Number.isSafeInteger(amount) ? amount : NaN
}

export function toMoneyNumber(value) {
  return parsePaymentAmount(value) ?? 0
}

export function formatPaymentAmount(value) {
  const amount = parsePaymentAmount(value)
  if (amount === null) return ''
  if (!Number.isFinite(amount)) return String(value ?? '')
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function groupedCaretPosition(text, oldPosition, formatted) {
  const digitCount = (text.slice(0, oldPosition).match(/[0-9۰-۹٠-٩]/g) || []).length
  if (!digitCount) return formatted.startsWith('-') && text.slice(0, oldPosition).includes('-') ? 1 : 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/[0-9]/.test(formatted[i]) && ++seen === digitCount) return i + 1
  }
  return formatted.length
}

export function createPaymentState(total = 0) {
  const state = Object.fromEntries(PAYMENT_METHODS.map(method => [
    method.code,
    { selected: method.code === 'pos', amount: 0, confirmed: false, reference: '', used: method.code === 'pos' }
  ]))
  state.pos.amount = toMoneyNumber(total)
  return state
}

export function getSelectedMethods(state) {
  return PAYMENT_METHODS.filter(method => state[method.code].selected)
}

export function paymentTotals(state, total) {
  const allocated = getSelectedMethods(state).reduce(
    (sum, method) => sum + toMoneyNumber(state[method.code].amount), 0
  )
  return { allocated, difference: toMoneyNumber(total) - allocated }
}

export function applyAutomaticRemainder(state, total, remainderMethod) {
  if (!state[remainderMethod]?.selected) return
  const otherTotal = getSelectedMethods(state).reduce((sum, method) => (
    method.code === remainderMethod ? sum : sum + toMoneyNumber(state[method.code].amount)
  ), 0)
  if (!Number.isFinite(otherTotal)) return
  state[remainderMethod].amount = Math.max(toMoneyNumber(total) - otherTotal, 0)
}

export function togglePaymentMethod(state, code, selected, total, remainderMethod) {
  const activeBefore = getSelectedMethods(state)
  if (!selected && activeBefore.length === 1) {
    return { remainderMethod, automatic: true, changed: false }
  }
  const payment = state[code]
  payment.confirmed = false
  payment.reference = ''
  payment.selected = selected
  if (selected) {
    if (!payment.used) payment.amount = 0
    payment.used = true
  }
  const active = getSelectedMethods(state)
  let nextRemainder = remainderMethod
  if (active.length === 1) {
    nextRemainder = active[0].code
    state[nextRemainder].amount = toMoneyNumber(total)
  } else if (!state[nextRemainder]?.selected) {
    nextRemainder = active[0].code
  }
  applyAutomaticRemainder(state, total, nextRemainder)
  return { remainderMethod: nextRemainder, automatic: true, changed: true }
}

export function updatePaymentAmount(state, code, value, total, remainderMethod, automatic) {
  const parsed = parsePaymentAmount(value)
  state[code].amount = parsed === null ? '' : Number.isNaN(parsed) ? String(value) : parsed
  const nextAutomatic = code === remainderMethod ? false : automatic
  if (nextAutomatic) applyAutomaticRemainder(state, total, remainderMethod)
  return nextAutomatic
}
