import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('../src/view/cost/ProductionCosts.vue', import.meta.url), 'utf8')
const api = readFileSync(new URL('../src/api/product-cost.api.js', import.meta.url), 'utf8')

test('pricing workflow uses dedicated server-authoritative endpoints', () => {
  assert.match(api, /pricingRecommendations\(params/)
  assert.match(api, /productPricing\(id\)/)
  assert.match(api, /saveProductPricing\(id, data\)/)
  assert.match(api, /approveProductPricing\(id, data\)/)
  assert.match(api, /dismissProductPricing\(id, data\)/)
  assert.match(page, /API\.productPricing\(id\)/)
  assert.match(page, /API\.saveProductPricing/)
  assert.match(page, /API\.approveProductPricing/)
  assert.doesNotMatch(page, /API\.updateProduct/)
})

test('manager controls markup, upward rounding and the alert threshold', () => {
  assert.match(page, /درصد افزوده روی بهای تولید/)
  assert.match(page, /بدون گردکردن/)
  assert.match(page, /value="1000"/)
  assert.match(page, /value="5000"/)
  assert.match(page, /value="10000"/)
  assert.match(page, /گام دلخواه/)
  assert.match(page, /significant_change_threshold/)
})

test('publishing requires explicit confirmation and sends only recommendation identity', () => {
  assert.match(page, /window\.confirm/)
  assert.match(page, /recommendation_id: snapshot\.id/)
  assert.match(page, /revision: snapshot\.revision/)
  assert.doesNotMatch(page, /approveProductPricing\([^\n]+suggested_price/)
  assert.match(page, /تأیید و اعمال قیمت جدید/)
})

test('recommendation, incomplete state, alerts and audit history are visible', () => {
  assert.match(page, /پیشنهادهای نیازمند بررسی/)
  assert.match(page, /recommendation\.is_complete/)
  assert.match(page, /فروش محصول متوقف نشده است/)
  assert.match(page, /recommendation\.unrounded_suggested_price/)
  assert.match(page, /recommendation\.suggested_price/)
  assert.match(page, /سوابق پیشنهاد و انتشار قیمت/)
  assert.match(page, /گزینهٔ محصول مستقل است/)
})
