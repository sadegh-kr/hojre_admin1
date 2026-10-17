import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveHojrehRestaurant, resolveTaleghaniPosBranch } from '../src/utils/posBranchContext.js'

const hojreh = { id: 'hojreh-id', name: 'حجره', slug: 'hojreh' }
const otherRestaurant = { id: 'other-id', name: 'رستوران دیگر', slug: 'other' }
const taleghani = { id: 'taleghani-id', name: 'شعبه طالقانی', restaurant: 'hojreh-id' }

test('POS resolves Taleghani only from the authorized Hojreh branch', () => {
  const result = resolveTaleghaniPosBranch(
    [otherRestaurant, hojreh],
    [{ id: 'other-taleghani', name: 'شعبه طالقانی', restaurant: 'other-id' }, taleghani]
  )
  assert.equal(result.restaurant.id, 'hojreh-id')
  assert.equal(result.branch.id, 'taleghani-id')
})

test('POS resolves Hojreh before requesting its authorized branches', () => {
  assert.equal(resolveHojrehRestaurant([otherRestaurant, hojreh]).id, 'hojreh-id')
})

test('POS rejects missing, unauthorized, and ambiguous Taleghani configuration', () => {
  assert.throws(
    () => resolveTaleghaniPosBranch([hojreh], []),
    /فهرست شعب مجاز/
  )
  assert.throws(
    () => resolveTaleghaniPosBranch([hojreh], [taleghani, { ...taleghani, id: 'duplicate-id' }]),
    /مبهم/
  )
  assert.throws(
    () => resolveTaleghaniPosBranch([otherRestaurant], [taleghani]),
    /دسترسی به رستوران حجره/
  )
})
