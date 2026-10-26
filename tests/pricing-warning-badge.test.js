import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const sidebar = readFileSync(new URL('../src/components/main/Sidebar.vue', import.meta.url), 'utf8')
const api = readFileSync(new URL('../src/api/product-cost.api.js', import.meta.url), 'utf8')

test('sidebar keeps the existing pricing destination and shows a non-zero review-only badge', () => {
  assert.match(sidebar, /to:\s*'\/dashboard\/cost-control\/production-costs',\s*warningBadge:\s*true/)
  assert.match(sidebar, /child\.warningBadge && pricingWarningCount > 0/)
  assert.match(sidebar, /pricing-warning-badge/)
  assert.match(sidebar, /پیشنهاد قیمت نیازمند بررسی/)
})

test('sidebar count comes from the secure summary endpoint and fails closed', () => {
  assert.match(api, /pricingWarningSummary\(\)/)
  assert.match(api, /pricing\/warnings\//)
  assert.match(sidebar, /API\.pricingWarningSummary\(\)/)
  assert.match(sidebar, /pricingWarningCount\.value = null/)
  assert.doesNotMatch(sidebar, /pricingWarningCount\.value = 0\s*\/\/.*error/)
})

test('sidebar refreshes without polling after routing, focus and relevant pricing writes', () => {
  assert.match(sidebar, /watch\(\(\) => route\.fullPath, refreshPricingWarnings\)/)
  assert.match(sidebar, /visibilitychange/)
  assert.match(sidebar, /pricingWarningEvent/)
  assert.match(api, /notifyPricingWarningsChanged\(\)/)
  assert.match(api, /saveProductPricing/)
  assert.match(api, /updateIngredient/)
  assert.match(api, /createOverhead/)
})
