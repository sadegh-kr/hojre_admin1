// src/utils/helpers.js

/**
 * تولید شناسه یکتا
 */
export const generateUniqueId = () => {
    return Math.random().toString(36).substr(2, 9)
}

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export const toPersianNumbers = (number) => {
    if (number === null || number === undefined) return ''

    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return number.toString().replace(/\d/g, (digit) => persianDigits[digit])
}

/**
 * تبدیل اعداد فارسی/عربی به انگلیسی
 */
export const toEnglishNumbers = (str) => {
    if (!str) return ''

    const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

    let result = str

    persian.forEach((digit, index) => {
        result = result.replace(new RegExp(digit, 'g'), index)
    })

    arabic.forEach((digit, index) => {
        result = result.replace(new RegExp(digit, 'g'), index)
    })

    return result
}

/**
 * حذف فضای اضافی از متن
 */
export const normalizeSpaces = (text) => {
    if (!text) return ''
    return text.replace(/\s+/g, ' ').trim()
}

/**
 * فرمت شماره تلفن ایرانی
 */
export const formatIranianPhoneNumber = (phone) => {
    if (!phone) return ''

    const cleaned = phone.toString().replace(/\D/g, '')

    if (cleaned.length === 10) {
        return `۰${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    }

    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
    }

    return phone
}

/**
 * بررسی اینکه آیا رشته فقط عدد است
 */
export const isNumeric = (str) => {
    if (typeof str !== 'string') return false
    return !isNaN(str) && !isNaN(parseFloat(str))
}

/**
 * حدف کاراکترهای غیر عددی از رشته
 */
export const removeNonNumeric = (str) => {
    if (!str) return ''
    return str.replace(/\D/g, '')
}