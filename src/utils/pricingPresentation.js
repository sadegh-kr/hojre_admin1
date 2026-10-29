// Presentation only: never infer a percentage when the server has no comparison.
export function changeKind(value) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return 'unknown'
  return Number(value) > 0 ? 'increase' : Number(value) < 0 ? 'decrease' : 'unchanged'
}

export const changeLabel = value => ({
  increase: '↑ افزایش', decrease: '↓ کاهش', unchanged: 'بدون تغییر', unknown: 'اطلاعات ناکافی',
})[changeKind(value)]
