import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync(new URL('../src/components/cost/MonthlyIngredientAnalysis.vue', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/view/cost/ProductionCosts.vue', import.meta.url), 'utf8')

test('monthly analysis displays an honest empty state and remains on the pricing page', () => {
  assert.match(component, /اطلاعات کافی برای محاسبه افزایش قیمت ماهانه وجود ندارد/)
  assert.match(component, /data\.comparable_count/)
  assert.match(component, /افزایش مثبتی ثبت نشده/)
  assert.match(page, /<MonthlyIngredientAnalysis/)
})

test('closed date ranges use the Persian calendar and numerals', () => {
  assert.match(component, /fa-IR-u-ca-persian/)
  const result = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date('2026-03-21T12:00:00Z'))
  assert.match(result, /۱۴۰۵/)
  assert.match(result, /فروردین/)
})
