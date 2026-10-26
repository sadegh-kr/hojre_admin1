import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { paginateRows } from '../src/utils/clientPagination.js'
import { selectVisible, visibleRows } from '../src/utils/bulkPricingSelection.js'

const page = readFileSync(new URL('../src/view/cost/ProductionCosts.vue', import.meta.url), 'utf8')
const bulk = readFileSync(new URL('../src/components/cost/BulkPricingPreview.vue', import.meta.url), 'utf8')

const products = Array.from({ length: 102 }, (_, index) => ({
  id: String(index + 1),
  product_id: String(index + 1),
  product_name: `محصول ${index + 1}`,
  recommendation: { can_approve: index % 3 !== 0, revision: `r${index + 1}` },
}))

test('pricing table starts with 10 rows and supports page and size changes', () => {
  assert.deepEqual(paginateRows(products, 1, 10).rows.map(row => row.id), products.slice(0, 10).map(row => row.id))
  assert.deepEqual(paginateRows(products, 2, 10).rows.map(row => row.id), products.slice(10, 20).map(row => row.id))
  assert.equal(paginateRows(products, 1, 20).rows.length, 20)
  assert.match(bulk, /const pageSize = ref\(10\)/)
  assert.match(bulk, /:value="50"/)
})

test('available products start with 12 items and paginate independently', () => {
  const first = paginateRows(products, 1, 12)
  const second = paginateRows(products, 2, 12)
  assert.equal(first.rows.length, 12)
  assert.equal(second.rows[0].id, '13')
  assert.match(page, /const productPageSize = ref\(12\)/)
  assert.match(page, /const productPage = ref\(1\)/)
  assert.match(bulk, /const tablePage = ref\(1\)/)
})

test('search covers the full collection and resets both relevant page states', () => {
  assert.deepEqual(visibleRows(products, 'محصول 99').map(row => row.id), ['99'])
  assert.match(bulk, /watch\(search, \(\) => \{ tablePage\.value = 1;/)
  assert.match(page, /watch\(search, \(\) => \{ productPage\.value = 1 \}\)/)
})

test('select all adds only eligible rows on the visible page and preserves earlier pages', () => {
  const firstPage = paginateRows(products, 1, 10).rows
  const secondPage = paginateRows(products, 2, 10).rows
  const firstSelection = selectVisible(firstPage)
  const combined = selectVisible(secondPage, firstSelection)
  assert.ok(combined.length > firstSelection.length)
  assert.ok(firstSelection.every(id => combined.includes(id)))
  assert.ok(combined.every(id => products.find(row => row.product_id === id).recommendation.can_approve))
  assert.match(bulk, /selectVisible\(pageRows, selected\)/)
  assert.match(bulk, /rows\.value\.filter\(row => isEligible\(row\) && selected\.value\.includes\(row\.product_id\)\)/)
})

test('price preview uses exact stable recommendation identities and remains explicit', () => {
  assert.match(bulk, /recommendation_id: row\.recommendation\.id/)
  assert.match(bulk, /revision: row\.recommendation\.revision/)
  assert.match(bulk, /@click="confirmApproval"/)
  assert.match(page, /const selectedRow = computed\(\(\) => rows\.value\.find\(row => String\(row\.id\) === selectedId\.value\)/)
  assert.match(page, /:key="row\.id"/)
})

test('requested explanations are absent while analytics and responsive RTL UI remain', () => {
  for (const text of [
    'بهای تولید را بررسی کنید، سیاست قیمت‌گذاری بسازید و پیشنهاد سرور را پیش از انتشار تأیید کنید.',
    'فاز ۳B',
    'انتشار قیمت فقط با تأیید مدیر',
    'رسپی‌های فعلی برای تولید',
    'انتخاب و پیش‌نمایش قیمت فروش را تغییر نمی‌دهد. اطلاعات ماهانه هر محصول در بخش تحلیل ماهانه بالاست و مبنای خودکار قیمت نیست.',
  ]) assert.doesNotMatch(`${page}\n${bulk}`, new RegExp(text))
  assert.match(page, /<MonthlyIngredientAnalysis/)
  assert.match(page, /significant_change_threshold: '2'/)
  assert.match(bulk, /dir="rtl"/)
  assert.match(bulk, /@media\(max-width:640px\)/)
})
