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

test('update prices hides recipe management UI while retaining recipe-derived costs', () => {
  assert.doesNotMatch(page, /<section class="recipe-card"/)
  assert.doesNotMatch(page, /class="recipe-link"/)
  assert.doesNotMatch(page, /<section class="yield-panel"/)
  assert.match(page, /API\.recipes\(id\)/)
  assert.match(page, /product\.final_production_cost/)
})

test('costing center has its own working route and keeps POS route intact', () => {
  assert.match(router, /path:\s*"production-costs",\s*component:\s*ProductionCosts/)
  assert.match(router, /path:\s*"item-list",\s*component:\s*ItemList/)
})
