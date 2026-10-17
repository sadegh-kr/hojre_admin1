const HOJREH_RESTAURANT_SLUG = 'hojreh'
const TALEGHANI_BRANCH_NAME = 'شعبه طالقانی'

function normalize(value) {
  return String(value ?? '')
    .trim()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('fa-IR')
}

export function resolveHojrehRestaurant(restaurants) {
  const hojrehRestaurants = (restaurants || []).filter(
    restaurant => String(restaurant.slug || '').trim().toLowerCase() === HOJREH_RESTAURANT_SLUG
  )

  if (hojrehRestaurants.length === 0) {
    throw new Error('دسترسی به رستوران حجره برای این حساب تعریف نشده است.')
  }
  if (hojrehRestaurants.length > 1) {
    throw new Error('پیکربندی رستوران حجره مبهم است؛ بیش از یک رستوران با شناسهٔ hojreh یافت شد.')
  }

  return hojrehRestaurants[0]
}

export function resolveTaleghaniPosBranch(restaurants, branches) {
  const restaurant = resolveHojrehRestaurant(restaurants)

  const taleghaniBranches = (branches || []).filter(branch => (
    String(branch.restaurant) === String(restaurant.id)
    && normalize(branch.name) === normalize(TALEGHANI_BRANCH_NAME)
  ))

  if (taleghaniBranches.length === 0) {
    throw new Error('شعبهٔ طالقانی در فهرست شعب مجاز این حساب نیست؛ دسترسی کاربر یا پیکربندی شعبه را بررسی کنید.')
  }
  if (taleghaniBranches.length > 1) {
    throw new Error('پیکربندی شعبهٔ طالقانی مبهم است؛ بیش از یک شعبه با این نام برای حجره یافت شد.')
  }

  return { restaurant, branch: taleghaniBranches[0] }
}
