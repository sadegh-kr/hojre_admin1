export function effectiveIngredientCost(ingredient) {
  const average = Number(ingredient?.inventory_average_cost || 0)
  return average > 0 ? average : Number(ingredient?.purchase_price ?? ingredient?.unit_cost ?? 0)
}

export function ingredientCostSource(ingredient) {
  return Number(ingredient?.inventory_average_cost || 0) > 0 ? 'inventory_average' : 'purchase_price'
}

export function costSourceLabel(source) {
  return source === 'inventory_average' ? 'میانگین موجودی' : 'قیمت مرجع'
}
