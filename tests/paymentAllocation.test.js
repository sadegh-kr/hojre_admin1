import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyAutomaticRemainder,
  createPaymentState,
  formatPaymentAmount,
  getSelectedMethods,
  groupedCaretPosition,
  parsePaymentAmount,
  paymentTotals,
  togglePaymentMethod,
  updatePaymentAmount,
  toMoneyNumber
} from '../src/utils/paymentAllocation.js'

test('negative and Persian money input remains detectable', () => {
  assert.equal(toMoneyNumber('-۱٬۰۰۰'), -1000)
  assert.equal(toMoneyNumber('۴۵۰٬۰۰۰ تومان'), 450000)
})

test('payment grouping normalizes supported digits and preserves exact toman values', () => {
  for (const [input, expected] of [[1000, '1,000'], [10000, '10,000'], [1250000, '1,250,000'], ['۱٬۲۵۰٬۰۰۰', '1,250,000'], ['١٢٥٠٠٠٠', '1,250,000'], ['1,250,000', '1,250,000'], [0, '0']]) {
    assert.equal(formatPaymentAmount(input), expected)
  }
  assert.equal(parsePaymentAmount(' ۱٬۲۵۰,۰۰۰ '), 1250000)
  assert.equal(parsePaymentAmount(''), null)
  assert.ok(Number.isNaN(parsePaymentAmount('12.5')))
  assert.ok(Number.isNaN(parsePaymentAmount('1x000')))
  assert.ok(Number.isNaN(parsePaymentAmount('9007199254740993')))
  assert.equal(groupedCaretPosition('1250000', 4, '1,250,000'), 5)
})

test('all split methods format auto-filled and edited amounts without changing allocation', () => {
  const state = createPaymentState(875000)
  assert.equal(formatPaymentAmount(state.pos.amount), '875,000')
  for (const code of ['cash', 'card_to_card', 'wallet']) {
    togglePaymentMethod(state, code, true, 875000, 'pos')
    updatePaymentAmount(state, code, '١٠٠٬٠٠٠', 875000, 'pos', true)
    assert.equal(formatPaymentAmount(state[code].amount), '100,000')
    assert.equal(state[code].amount, 100000)
  }
  assert.equal(formatPaymentAmount(state.pos.amount), '575,000')
  assert.equal(paymentTotals(state, 875000).difference, 0)
  updatePaymentAmount(state, 'wallet', '', 875000, 'pos', true)
  assert.equal(formatPaymentAmount(state.wallet.amount), '')
  assert.equal(state.wallet.amount, '')
})

test('single POS method defaults to the full payable total', () => {
  const state = createPaymentState(450000)
  assert.deepEqual(getSelectedMethods(state).map(item => item.code), ['pos'])
  assert.equal(state.pos.amount, 450000)
  assert.deepEqual(paymentTotals(state, 450000), { allocated: 450000, difference: 0 })
})

test('adding another method creates a distinct zero amount field', () => {
  const state = createPaymentState(450000)
  const result = togglePaymentMethod(state, 'cash', true, 450000, 'pos')
  assert.equal(result.changed, true)
  assert.deepEqual(getSelectedMethods(state).map(item => item.code), ['cash', 'pos'])
  assert.equal(state.cash.amount, 0)
  assert.equal(state.pos.amount, 450000)
})

test('editing the second method automatically reduces the remainder method', () => {
  const state = createPaymentState(450000)
  togglePaymentMethod(state, 'card_to_card', true, 450000, 'pos')
  const automatic = updatePaymentAmount(state, 'card_to_card', 200000, 450000, 'pos', true)
  assert.equal(automatic, true)
  assert.equal(state.pos.amount, 250000)
  assert.deepEqual(paymentTotals(state, 450000), { allocated: 450000, difference: 0 })
})

test('manual edits preserve values and expose the difference', () => {
  const state = createPaymentState(450000)
  togglePaymentMethod(state, 'wallet', true, 450000, 'pos')
  const automatic = updatePaymentAmount(state, 'pos', 100000, 450000, 'pos', true)
  updatePaymentAmount(state, 'wallet', 150000, 450000, 'pos', automatic)
  assert.deepEqual(paymentTotals(state, 450000), { allocated: 250000, difference: 200000 })
  applyAutomaticRemainder(state, 450000, 'pos')
  assert.equal(state.pos.amount, 300000)
})

test('all four methods can be selected with exact allocation', () => {
  const state = createPaymentState(450000)
  togglePaymentMethod(state, 'cash', true, 450000, 'pos')
  togglePaymentMethod(state, 'card_to_card', true, 450000, 'pos')
  togglePaymentMethod(state, 'wallet', true, 450000, 'pos')
  updatePaymentAmount(state, 'cash', 100000, 450000, 'pos', true)
  updatePaymentAmount(state, 'card_to_card', 100000, 450000, 'pos', true)
  updatePaymentAmount(state, 'wallet', 100000, 450000, 'pos', true)
  assert.equal(state.pos.amount, 150000)
  assert.equal(getSelectedMethods(state).length, 4)
  assert.equal(paymentTotals(state, 450000).difference, 0)
})

test('switching a manual method clears stale receipt confirmation and reference', () => {
  const state = createPaymentState(100000)
  state.pos.confirmed = true
  state.pos.reference = 'OLD-RECEIPT'
  togglePaymentMethod(state, 'cash', true, 100000, 'pos')
  togglePaymentMethod(state, 'pos', false, 100000, 'pos')
  assert.equal(state.pos.confirmed, false)
  assert.equal(state.pos.reference, '')
})
