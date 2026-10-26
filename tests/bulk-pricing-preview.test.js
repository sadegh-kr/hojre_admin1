import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isEligible, selectVisible, toggleSelection, visibleRows } from '../src/utils/bulkPricingSelection.js'

const rows = [
  { product_id: '1', product_name: 'قهوه', recommendation: { can_approve: true, revision: 'a' } },
  { product_id: '2', product_name: 'چای', recommendation: { can_approve: true, revision: 'b' } },
  { product_id: '3', product_name: 'کیک', recommendation: { can_approve: false, revision: 'c' } },
  { product_id: '4', product_name: 'شیر', recommendation: null },
]

test('individual selection and deselection require an eligible recommendation', () => {
  let selected = toggleSelection([], rows[0])
  assert.deepEqual(selected, ['1'])
  selected = toggleSelection(selected, rows[1])
  assert.deepEqual(selected, ['1', '2'])
  assert.deepEqual(toggleSelection(selected, rows[2]), selected)
  assert.deepEqual(toggleSelection(selected, rows[0]), ['2'])
  assert.equal(isEligible(rows[3]), false)
})

test('select all selects only visible eligible products', () => {
  assert.deepEqual(selectVisible(rows), ['1', '2'])
  assert.deepEqual(selectVisible([rows[1]], ['1']), ['1', '2'])
  assert.deepEqual(selectVisible(visibleRows(rows, 'چای')), ['2'])
  assert.deepEqual(selectVisible(visibleRows(rows, 'کیک')), [])
})

test('preview requires explicit final confirmation before publishing', () => {
  const component = readFileSync(new URL('../src/components/cost/BulkPricingPreview.vue', import.meta.url), 'utf8')
  assert.match(component, /row\.current_price/)
  assert.match(component, /row\.recommendation\.suggested_price/)
  assert.match(component, /@click="confirmApproval"/)
  assert.match(component, /recommendation_id: row\.recommendation\.id/)
  assert.match(component, /revision: row\.recommendation\.revision/)
  assert.match(component, /submitting \? 'در حال اعمال…' : 'تأیید و اعمال قیمت‌های انتخاب‌شده'/)
  assert.match(component, /watch\(search/)
  assert.match(component, /API\.bulkPricingApprove\(recommendations\)/)
})
