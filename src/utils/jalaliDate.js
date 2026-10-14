const digitMap = str => String(str || '').replace(/[۰-۹٠-٩]/g, char => '01234567890123456789'['۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩'.indexOf(char) % 10])
const pad = value => String(value).padStart(2, '0')
const isGregorianLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

export function normalizeJalali(value) {
  const match = digitMap(value).trim().replace(/-/g, '/').match(/^(\d{3,4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  if (year < 1200 || year > 1600 || month < 1 || month > 12 || day < 1 || day > (month <= 6 ? 31 : 30)) return null
  return `${year}/${pad(month)}/${pad(day)}`
}

// Jalali arithmetic is kept here so API calls always carry reliable Gregorian ISO dates.
export function jalaliToIso(value) {
  const normalized = normalizeJalali(value)
  if (!normalized) return null
  let [jy, jm, jd] = normalized.split('/').map(Number)
  jy += 1595
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : ((jm - 7) * 30) + 186)
  let gy = 400 * Math.floor(days / 146097); days %= 146097
  if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++ }
  gy += 4 * Math.floor(days / 1461); days %= 1461
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365 }
  const leap = gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0)
  const months = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm = 0
  while (days >= months[gm]) days -= months[gm++]
  return `${gy}-${pad(gm + 1)}-${pad(days + 1)}`
}

// Date-only conversion: deliberately avoids Date/UTC parsing so a calendar day
// cannot move across a timezone boundary while hydrating saved API filters.
export function isoToJalali(value) {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, year, month, day] = match.map(Number)
  const monthDays = [31, isGregorianLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) return null

  const elapsedGregorianDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let gregorianYear = year > 1600 ? year - 1600 : year - 621
  let jalaliYear = year > 1600 ? 979 : 0
  const gregorianLeapAdjustmentYear = month > 2 ? gregorianYear + 1 : gregorianYear
  let days = 365 * gregorianYear
    + Math.floor((gregorianLeapAdjustmentYear + 3) / 4)
    - Math.floor((gregorianLeapAdjustmentYear + 99) / 100)
    + Math.floor((gregorianLeapAdjustmentYear + 399) / 400)
    - 80
    + day
    + elapsedGregorianDays[month - 1]

  jalaliYear += 33 * Math.floor(days / 12053)
  days %= 12053
  jalaliYear += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jalaliYear += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }

  const jalaliMonth = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jalaliDay = 1 + (days < 186 ? days % 31 : (days - 186) % 30)
  return `${jalaliYear}/${pad(jalaliMonth)}/${pad(jalaliDay)}`
}

export function jalaliToday(offsetDays = 0) {
  const date = new Date(); date.setDate(date.getDate() + offsetDays)
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const part = type => parts.find(item => item.type === type)?.value
  return `${part('year')}/${part('month')}/${part('day')}`
}
