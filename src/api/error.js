const GENERIC_MESSAGES = new Set([
  'انجام عملیات امکان‌پذیر نیست.',
  'درخواست قابل پردازش نیست.',
])

function firstFieldError(errors) {
  if (!errors || typeof errors !== 'object') return ''
  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && value.length) return String(value[0])
    if (typeof value === 'string') return value
    const nested = firstFieldError(value)
    if (nested) return nested
  }
  return ''
}

export function getApiErrorMessage(error, fallback = 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.') {
  const payload = error?.cost || error?.order || error?.response?.data
  const backendMessage = payload?.message || payload?.detail
  if (backendMessage && !GENERIC_MESSAGES.has(String(backendMessage))) return String(backendMessage)

  const fieldMessage = firstFieldError(payload?.errors || payload?.details || (backendMessage ? null : payload))
  if (fieldMessage) return fieldMessage

  const status = error?.response?.status
  if (!error?.response && error?.request) return 'ارتباط با سرور برقرار نشد. اتصال اینترنت و آدرس API را بررسی کنید.'
  if (status === 400) return 'اطلاعات ارسال‌شده معتبر نیست.'
  if (status === 401) return 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.'
  if (status === 403) return 'شما مجوز انجام این عملیات را ندارید.'
  if (status === 404) return 'منبع درخواستی پیدا نشد.'
  if (status === 409) return 'این عملیات با وضعیت فعلی اطلاعات قابل انجام نیست.'
  if (status === 429) return 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'
  if (status >= 500) return 'سرور هنگام پردازش درخواست با خطا روبه‌رو شد. لطفاً کمی بعد دوباره تلاش کنید.'
  if (error?.message && !GENERIC_MESSAGES.has(String(error.message))) return String(error.message)
  return fallback
}
