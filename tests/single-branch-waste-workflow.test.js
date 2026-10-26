import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const materials = readFileSync(new URL('../src/view/cost/CostIngredients.vue', import.meta.url), 'utf8')
const recipe = readFileSync(new URL('../src/view/cost/ProductRecipe.vue', import.meta.url), 'utf8')
const wasteModal = readFileSync(new URL('../src/components/modals/IngredientWasteModal.vue', import.meta.url), 'utf8')
const reports = readFileSync(new URL('../src/view/cost/CostReports.vue', import.meta.url), 'utf8')
const api = readFileSync(new URL('../src/api/product-cost.api.js', import.meta.url), 'utf8')

test('materials and recipes use automatic operational context without a branch selector', () => {
  assert.match(materials, /API\.operationalIngredients/)
  assert.match(materials, /context\.branch_name/)
  assert.doesNotMatch(materials, /\{\{ context\.restaurant_name \}\} · \{\{ context\.branch_name \}\}/)
  assert.doesNotMatch(wasteModal, /شعبه طالقانی/)
  assert.match(materials, /ثبت ضایعات در این صفحه یک رویداد مستقل است/)
  assert.match(materials, /ماده تاریخی فاقد مالکیت قابل اثبات است/)
  assert.doesNotMatch(materials, /v-model(?:\.trim)?="[^\"]*branch/)
  assert.doesNotMatch(recipe, /v-model(?:\.trim)?="[^\"]*branch/)
})

test('waste form keeps units, reason, Jalali date, time and idempotency', () => {
  for (const marker of ['form.quantity', 'form.unit', 'form.reason', 'form.note', 'JalaliDatePicker', 'form.time', 'idempotency_key']) {
    assert.match(wasteModal, new RegExp(marker.replace('.', '\\.')))
  }
  assert.match(wasteModal, /normalizedQuantity/)
  assert.match(wasteModal, /موجودی فیزیکی کم نمی‌کند/)
})

test('waste API and charts use real scoped events and separated units', () => {
  assert.match(api, /operational\/ingredient-waste\/report/)
  assert.match(api, /createIngredientWaste/)
  assert.match(reports, /quantity_by_unit/)
  assert.match(reports, /by_ingredient/)
  assert.match(reports, /by_reason/)
  assert.match(reports, /در این بازه ضایعات واقعی ثبت نشده است/)
  assert.match(reports, /ضایعات برآوردی داخل دستور تولید/)
})
