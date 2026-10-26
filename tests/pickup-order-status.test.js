import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const modal = readFileSync(new URL('../src/components/modals/orderes/OrderDetailsModal.vue', import.meta.url), 'utf8')

test('online dine-in pickup offers direct handover without shipping', () => {
  assert.match(modal, /current\.order_type === 'online' && current\.delivery === 'dine-in'/)
  assert.match(modal, /pickup && current\.status === 'prep'[\s\S]*?\['deliver', 'cancel'\]/)
  assert.match(modal, /pickup && value === 'deliver' \? 'تحویل داده شد'/)
})

test('courier and POS retain the existing transition list', () => {
  assert.match(modal, /prep: \['send', 'cancel'\]/)
  assert.match(modal, /: \(transitions\[current\.status\] \|\| \[\]\)/)
  assert.match(modal, /statusUpdating \|\| !availableStatuses\.length/)
})
