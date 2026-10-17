import assert from 'node:assert/strict'
import test from 'node:test'

import { costSourceLabel, effectiveIngredientCost, ingredientCostSource } from '../src/utils/ingredientCost.js'

test('reference price is used when no positive inventory average exists', () => {
  const ingredient = { purchase_price: '1250', inventory_average_cost: '0' }
  assert.equal(effectiveIngredientCost(ingredient), 1250)
  assert.equal(ingredientCostSource(ingredient), 'purchase_price')
  assert.equal(costSourceLabel(ingredientCostSource(ingredient)), 'قیمت مرجع')
})

test('positive inventory average takes precedence over reference price', () => {
  const ingredient = { purchase_price: '1500', inventory_average_cost: '1325.5' }
  assert.equal(effectiveIngredientCost(ingredient), 1325.5)
  assert.equal(ingredientCostSource(ingredient), 'inventory_average')
  assert.equal(costSourceLabel(ingredientCostSource(ingredient)), 'میانگین موجودی')
})

test('missing ingredient price remains an honest zero state', () => {
  assert.equal(effectiveIngredientCost({ purchase_price: 0, inventory_average_cost: 0 }), 0)
})
