import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const itemList = readFileSync(new URL('../src/view/ItemList.vue', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../src/components/main/Sidebar.vue', import.meta.url), 'utf8')
const layout = readFileSync(new URL('../src/layouts/MainLayout.vue', import.meta.url), 'utf8')
const toastHost = readFileSync(new URL('../src/components/cost/CostToastHost.vue', import.meta.url), 'utf8')
const toast = readFileSync(new URL('../src/composables/useCostToast.js', import.meta.url), 'utf8')
const calculator = readFileSync(new URL('../src/components/item/ItemCalculator.vue', import.meta.url), 'utf8')
const orderList = readFileSync(new URL('../src/view/ResturantOrderList.vue', import.meta.url), 'utf8')

test('successful POS registrations navigate to the unified list without an auto-open query', () => {
  assert.match(itemList, /order_type:\s*orderType\.value/)
  assert.match(itemList, /if \(!invoiceItems\.value\.length \|\| submittingOrder\.value\) return/)
  assert.match(itemList, /if \(!response\.data\?\.success\) \{[\s\S]*?throw requestError[\s\S]*?invoiceItems\.value = \[\]/)
  assert.match(itemList, /سفارش ثبت شد و در انتظار پرداخت است/)
  assert.match(itemList, /router\.push\(\{\s*path:\s*'\/dashboard\/orders'\s*\}\)/)
  assert.doesNotMatch(itemList, /router\.push\(\{\s*path:\s*'\/dashboard\/orders',\s*query:\s*\{\s*order:/)
})

test('pay later is independent, starts unchecked and restores normal payment validation', () => {
  assert.match(calculator, /const payLater = ref\(false\)/)
  assert.match(calculator, /v-model="payLater" type="checkbox"/)
  assert.match(calculator, /<template v-else>[\s\S]*?class="method-selector"/)
  assert.match(calculator, /payments: payLater\.value \? \[\]/)
  assert.match(calculator, /payLater\.value \|\| \(allocationValid\.value && walletValid\.value && confirmationsValid\.value\)/)
  assert.match(calculator, /watch\(payLater, enabled =>/)
  assert.match(calculator, /payments\[method\.code\]\.confirmed = false/)
  assert.match(itemList, /pay_later: checkout\.pay_later/)
})

test('the shared top-level toast remains mounted across the POS route transition', () => {
  assert.match(layout, /<CostToastHost\s*\/>/)
  assert.match(toastHost, /role="status"\s+aria-live="polite"/)
  assert.match(toastHost, /top:max\(1rem,env\(safe-area-inset-top\)\)/)
  assert.match(toast, /window\.setTimeout\(\(\) => dismiss\(id\), 4500\)/)
})

test('sidebar preserves the POS route while exposing it as a new order action', () => {
  assert.match(sidebar, /label:\s*'سفارش جدید',\s*to:\s*'\/dashboard\/item-list'/)
  assert.match(itemList, /resolveTaleghaniPosBranch/)
  assert.doesNotMatch(itemList, /v-model(?:\.trim)?="activeOrderBranchId"/)
})

test('manual order details and payment safeguards remain available', () => {
  assert.match(orderList, /if \(route\.query\.order\)/)
  assert.match(orderList, /function openOrder\(id\)/)
  assert.match(calculator, /submitting:\s*\{ type: Boolean/)
  assert.match(calculator, /:disabled="!canSubmit"/)
  assert.match(calculator, /method\.code !== 'wallet'/)
  assert.match(calculator, /تراکنش کارت‌خوان/)
  assert.match(calculator, /واریز کارت‌به‌کارت/)
  assert.match(calculator, /دریافت کامل وجه نقد/)
  assert.match(calculator, /confirmationsValid/)
  assert.match(calculator, /const remainderMethod = ref\('pos'\)/)
  assert.match(itemList, /wallet_debt_confirmation_required/)
  assert.match(itemList, /wallet_debt_confirmation_token/)
  assert.match(itemList, /تأیید نهایی بدهی و ثبت سفارش/)
  assert.match(itemList, /انصراف؛ هیچ سفارشی ثبت نشود/)
})
