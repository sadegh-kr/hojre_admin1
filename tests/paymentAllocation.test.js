import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyAutomaticRemainder,
  createPaymentState,
  getSelectedMethods,
  paymentTotals,
  togglePaymentMethod,
  updatePaymentAmount,
  toMoneyNumber
} from '../src/utils/paymentAllocation.js'

test('negative and Persian money input remains detectable', () => {
  assert.equal(toMoneyNumber('-۱٬۰۰۰'), -1000)
  assert.equal(toMoneyNumber('۴۵۰٬۰۰۰ تومان'), 450000)
})

test('single cash method defaults to the full payable total', () => {
  const state = createPaymentState(450000)
  assert.deepEqual(getSelectedMethods(state).map(item => item.code), ['cash'])
  assert.equal(state.cash.amount, 450000)
  assert.deepEqual(paymentTotals(state, 450000), { allocated: 450000, difference: 0 })
})

test('adding another method creates a distinct zero amount field', () => {
  const state = createPaymentState(450000)
  const result = togglePaymentMethod(state, 'pos', true, 450000, 'cash')
  assert.equal(result.changed, true)
  assert.deepEqual(getSelectedMethods(state).map(item => item.code), ['cash', 'pos'])
  assert.equal(state.cash.amount, 450000)
  assert.equal(state.pos.amount, 0)
})

test('editing the second method automatically reduces the remainder method', () => {
  const state = createPaymentState(450000)
  togglePaymentMethod(state, 'card_to_card', true, 450000, 'cash')
  const automatic = updatePaymentAmount(state, 'card_to_card', 200000, 450000, 'cash', true)
  assert.equal(automatic, true)
  assert.equal(state.cash.amount, 250000)
  assert.deepEqual(paymentTotals(state, 450000), { allocated: 450000, difference: 0 })
})

test('manual edits preserve values and expose the difference', () => {
  const state = createPaymentState(450000)
  togglePaymentMethod(state, 'wallet', true, 450000, 'cash')
  const automatic = updatePaymentAmount(state, 'cash', 100000, 450000, 'cash', true)
  updatePaymentAmount(state, 'wallet', 150000, 450000, 'cash', automatic)
  assert.deepEqual(paymentTotals(state, 450000), { allocated: 250000, difference: 200000 })
  applyAutomaticRemainder(state, 450000, 'cash')
  assert.equal(state.cash.amount, 300000)
})

test('all four methods can be selected with exact allocation', () => {
  const state = createPaymentState(450000)
  togglePaymentMethod(state, 'card_to_card', true, 450000, 'cash')
  togglePaymentMethod(state, 'pos', true, 450000, 'cash')
  togglePaymentMethod(state, 'wallet', true, 450000, 'cash')
  updatePaymentAmount(state, 'card_to_card', 100000, 450000, 'cash', true)
  updatePaymentAmount(state, 'pos', 100000, 450000, 'cash', true)
  updatePaymentAmount(state, 'wallet', 100000, 450000, 'cash', true)
  assert.equal(state.cash.amount, 150000)
  assert.equal(getSelectedMethods(state).length, 4)
  assert.equal(paymentTotals(state, 450000).difference, 0)
})
