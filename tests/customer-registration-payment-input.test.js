import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const customer = readFileSync(new URL('../src/components/loyalty/CustomerQuickSearch.vue', import.meta.url), 'utf8')
const calculator = readFileSync(new URL('../src/components/item/ItemCalculator.vue', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../src/components/modals/orderes/OrderDetailsModal.vue', import.meta.url), 'utf8')

test('customer phone field displays and clears the backend validation and blocks duplicate clicks', () => {
  assert.match(customer, /if \(registering\.value\) return/)
  assert.match(customer, /response\?\.data\?\.phone_number/)
  assert.match(customer, /id="registration-phone-error"[^>]*>{{ phoneError }}/)
  assert.match(customer, /registration\.value\.phone_number, \(\) => \{ phoneError\.value = '' \}/)
})

test('allocation inputs format all methods while payload remains numeric and pay later survives', () => {
  assert.match(calculator, /v-for="method in selectedMethods"/)
  assert.match(calculator, /:value="formatPaymentAmount\(payments\[method\.code\]\.amount\)"/)
  assert.match(calculator, /type="text"\s+inputmode="numeric"/)
  assert.match(calculator, /@keydown="onAmountKeydown/)
  assert.match(calculator, /amount: toNumber\(payments\[method\.code\]\.amount\)/)
  assert.match(calculator, /payments: payLater\.value \? \[\]/)
  assert.match(detail, /formatPaymentAmount\(value\)/)
  assert.match(detail, /expected_remaining: Number\(order\.value\.remaining_amount\)/)
})
