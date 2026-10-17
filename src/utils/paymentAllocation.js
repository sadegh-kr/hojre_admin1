export const PAYMENT_METHODS = [
  { code: 'cash', label: 'نقدی', hint: 'وجه نقد دریافتی از مشتری' },
  { code: 'card_to_card', label: 'کارت‌به‌کارت', hint: 'انتقال مستقیم به کارت' },
  { code: 'pos', label: 'پوز', hint: 'پرداخت با کارت‌خوان فیزیکی' },
  { code: 'wallet', label: 'کیف پول', hint: 'برداشت قطعی از کیف پول مشتری' }
]

export function toMoneyNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : 0
  const normalized = String(value ?? '')
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[^\d-]/g, '')
  return Number.parseInt(normalized, 10) || 0
}

export function createPaymentState(total = 0) {
  const state = Object.fromEntries(PAYMENT_METHODS.map(method => [
    method.code,
    { selected: method.code === 'cash', amount: 0, confirmed: false, reference: '', used: method.code === 'cash' }
  ]))
  state.cash.amount = toMoneyNumber(total)
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
  state[remainderMethod].amount = Math.max(toMoneyNumber(total) - otherTotal, 0)
}

export function togglePaymentMethod(state, code, selected, total, remainderMethod) {
  const activeBefore = getSelectedMethods(state)
  if (!selected && activeBefore.length === 1) {
    return { remainderMethod, automatic: true, changed: false }
  }
  const payment = state[code]
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
  state[code].amount = toMoneyNumber(value)
  const nextAutomatic = code === remainderMethod ? false : automatic
  if (nextAutomatic) applyAutomaticRemainder(state, total, remainderMethod)
  return nextAutomatic
}
