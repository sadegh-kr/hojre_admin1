import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const modal = readFileSync(new URL('../src/components/modals/IngredientModal.vue', import.meta.url), 'utf8')
const materials = readFileSync(new URL('../src/view/cost/CostIngredients.vue', import.meta.url), 'utf8')
const reports = readFileSync(new URL('../src/view/cost/CostReports.vue', import.meta.url), 'utf8')
const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
const api = readFileSync(new URL('../src/api/product-cost.api.js', import.meta.url), 'utf8')
const pricing = readFileSync(new URL('../src/view/cost/ProductionCosts.vue', import.meta.url), 'utf8')

test('one material form keeps identity, category and reference-price basis together', () => {
  for (const field of ['form.name', 'form.unit', 'form.category', 'form.is_active', 'form.reference_total_amount', 'form.reference_quantity', 'form.reference_unit']) {
    assert.match(modal, new RegExp(field.replace('.', '\\.')))
  }
  assert.match(modal, /referencePreview/)
  assert.match(modal, /با ثبت ماده اولیه، قیمت هر واحد محاسبه و ذخیره می‌شود/)
  assert.match(materials, /:reference-units="meta\.reference_units"/)
})

test('inline category creation selects the result without rehydrating the material form', () => {
  assert.match(modal, /class="category-plus"/)
  assert.match(modal, /API\.createMaterialCategory/)
  assert.match(modal, /form\.category = category\.id/)
  assert.doesNotMatch(modal, /props\.categories[^\n]*hydrate/)
  assert.match(api, /createMaterialCategory\(data\)/)
})

test('actual spoilage uses the dedicated operational event and never the stock-ledger endpoint', () => {
  assert.match(materials, /<IngredientWasteModal/)
  assert.match(materials, /API\.createIngredientWaste/)
  assert.match(materials, /موجودی فیزیکی را کم نمی‌کند/)
  assert.doesNotMatch(materials, /API\.inventoryWaste\(/)
})

test('legacy routes survive and recipe navigation has an inventory home', () => {
  assert.match(router, /path:\s*"materials",\s*redirect:\s*"\/dashboard\/inventory\/materials"/)
  assert.match(router, /path:\s*"products",\s*component:\s*CostProducts/)
  assert.match(router, /path:\s*"recipes",\s*component:\s*CostProducts/)
  assert.match(router, /path:\s*"waste",\s*redirect:\s*"\/dashboard\/cost-control\/reports\?view=waste"/)
})

test('waste reporting is honest and never combines physical loss with recipe waste', () => {
  assert.match(reports, /ضایعات واقعی مواد اولیه/)
  assert.match(reports, /API\.ingredientWasteReport/)
  assert.match(reports, /waste\.unvalued_event_count/)
  assert.match(reports, /ضایعات برآوردی داخل دستور تولید/)
  assert.match(reports, /مستقل از موجودی و ضایعات برآوردی دستور تولید/)
  assert.doesNotMatch(reports, /API\.inventoryWaste\(/)
})

test('renamed pricing screen retains policy and explicit approval controls', () => {
  assert.match(pricing, /<h2>آپدیت قیمت<\/h2>/)
  assert.match(pricing, /significant_change_threshold/)
  assert.match(pricing, /API\.approveProductPricing/)
  assert.match(pricing, /window\.confirm/)
})
