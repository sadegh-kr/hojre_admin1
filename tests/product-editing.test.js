import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const modal = readFileSync(new URL('../src/components/modals/ProductPricingModal.vue', import.meta.url), 'utf8')
const api = readFileSync(new URL('../src/api/product-cost.api.js', import.meta.url), 'utf8')
const baseApi = readFileSync(new URL('../src/api/BaseAPI.js', import.meta.url), 'utf8')

test('product content editing uses master product category and keeps price approval separate', () => {
  assert.match(modal, /product_category: props\.product\?\.product_category/)
  assert.match(modal, /v-model="form\.product_category"/)
  assert.match(modal, /if \(!isEditing\.value\) data\.price/)
  assert.doesNotMatch(modal, /v-model="form\.category"/)
})

test('product image uses multipart with browser generated content type and boundary', () => {
  assert.match(api, /updateProduct\(id, data, image = null\)/)
  assert.match(api, /form\.append\('image', image\)/)
  assert.match(baseApi, /config\.data instanceof FormData/)
  assert.match(baseApi, /config\.headers\.delete\('Content-Type'\)/)
})
