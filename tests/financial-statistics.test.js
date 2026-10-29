import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('../src/view/finance/FinancialStatistics.vue', import.meta.url), 'utf8')
const chart = readFileSync(new URL('../src/components/finance/StatisticsTrend.vue', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../src/components/main/Sidebar.vue', import.meta.url), 'utf8')
const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')

test('financial statistics is an owner-only route in finance navigation', () => {
  assert.match(sidebar, /label: 'آمار', to: '\/dashboard\/finance\/statistics'/)
  assert.match(router, /path: "finance\/statistics".*requiresOwner: true/)
})

test('statistics offers time filters and truthful sales, payments, wallet and unpaid metrics', () => {
  for (const term of ['آمار مالی و فروش', 'فروش خالص پرداخت‌شده', 'وصول موفق ثبت‌شده', 'مانده پرداخت‌نشده', 'سفارش‌های لغوشده', 'روش پرداخت', 'پرداخت بعدی', 'عملکرد فروش سایت', 'آمار کیف پول', 'قابل محاسبه نیست', 'ماه جاری', 'ماه قبل', 'بازه دلخواه']) assert.ok(page.includes(term), term)
  assert.match(page, /Asia\/Tehran/)
  assert.match(page, /data\.definitions\.filters/)
  assert.match(page, /data\.profit\.reason/)
  assert.match(page, /role="alert"/)
  assert.match(page, /@media\(max-width:760px\)/)
  assert.match(page, /var\(--surface\)/)
  assert.match(chart, /<title>/)
  assert.match(chart, /fa-IR-u-ca-persian/)
})
