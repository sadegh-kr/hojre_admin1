export const isEligible = row => Boolean(row.recommendation?.can_approve && row.recommendation?.revision)

export function visibleRows(rows, search) {
  const term = search.trim().toLocaleLowerCase('fa-IR')
  return term ? rows.filter(row => row.product_name.toLocaleLowerCase('fa-IR').includes(term)) : rows
}

export function selectVisible(rows, selected = []) {
  return [...new Set([...selected, ...rows.filter(isEligible).map(row => row.product_id)])]
}

export function toggleSelection(selected, row) {
  if (!isEligible(row)) return selected
  return selected.includes(row.product_id)
    ? selected.filter(id => id !== row.product_id)
    : [...selected, row.product_id]
}
