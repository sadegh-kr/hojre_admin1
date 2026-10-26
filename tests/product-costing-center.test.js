import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('../src/view/cost/ProductionCosts.vue', import.meta.url), 'utf8')
const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')

test('costing center uses existing product and recipe APIs without price mutations', () => {
  assert.match(page, /API\.dashboard/)
  assert.match(page, /API\.product\(id\)/)
  assert.match(page, /API\.recipes\(id\)/)
  assert.doesNotMatch(page, /API\.(?:createProduct|updateProduct|saveRecipe|removeRecipe)/)
  assert.doesNotMatch(page, /ProductPricingModal/)
})

test('legacy recipes are presented as one finished unit without double division', () => {
  assert.match(page, /بازده رسپی فعلی/)
  assert.match(page, /۱ واحد محصول نهایی/)
  assert.match(page, /بدون تقسیم مجدد/)
  assert.match(page, /product\.final_production_cost/)
})

test('costing center has its own working route and keeps POS route intact', () => {
  assert.match(router, /path:\s*"production-costs",\s*component:\s*ProductionCosts/)
  assert.match(router, /path:\s*"item-list",\s*component:\s*ItemList/)
})
