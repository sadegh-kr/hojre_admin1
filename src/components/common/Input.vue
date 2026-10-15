<template>
  <div class="custom-input">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
    </label>

    <div class="input-container">
      <input
          :id="id"
          :type="inputType"
          :value="displayValue"
          :placeholder="persianPlaceholder"
          :disabled="disabled"
          :readonly="readonly"
          :maxlength="maxLength"
          :min="isNumber ? min : null"
          :max="isNumber ? max : null"
          @input="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
          @keydown="handleKeyDown"
          class="input-field"
          :class="{
          'has-error': error,
          'is-number': isNumber
        }"
          :inputmode="inputMode"
      />

      <!-- نمایش محدودیت‌ها -->
      <div v-if="showLimits && (min !== null || max !== null || maxLength)" class="limits-info">
        <span v-if="isNumber && min !== null && max !== null">
          محدوده مجاز: {{ formatNumber(min) }} تا {{ formatNumber(max) }}
        </span>
        <span v-else-if="isNumber && min !== null">
          حداقل: {{ formatNumber(min) }}
        </span>
        <span v-else-if="isNumber && max !== null">
          حداکثر: {{ formatNumber(max) }}
        </span>
        <span v-if="maxLength && !isNumber">
          حداکثر کاراکتر: {{ maxLength }}
        </span>
      </div>
    </div>

    <!-- نمایش خطا -->
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <!-- نمایش شمارنده کاراکتر -->
    <div v-if="showCounter && maxLength" class="character-counter">
      <span :class="{ 'limit-exceeded': characterCount > maxLength }">
        {{ characterCount }} / {{ maxLength }}
      </span>
    </div>

    <!-- نمایش شمارنده ارقام (برای اعداد) -->
    <div v-if="isNumber && showDigitCounter && maxDigits" class="digit-counter">
      <span :class="{ 'limit-exceeded': digitCount > maxDigits }">
        {{ digitCount }} رقم / {{ maxDigits }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  toPersianNumbers,
  toEnglishNumbers,
  normalizeSpaces,
  generateUniqueId,
  removeNonNumeric,
  isNumeric
} from '@/utils/helpers'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'tel', 'email', 'password', 'search', 'url'].includes(value)
  },
  label: String,
  placeholder: String,
  disabled: Boolean,
  readonly: Boolean,
  error: String,
  id: {
    type: String,
    default: () => `input-${generateUniqueId()}`
  },

  // تنظیمات اصلی
  isNumber: {
    type: Boolean,
    default: false
  },
  convertToEnglish: {
    type: Boolean,
    default: true
  },
  showPersianNumbers: {
    type: Boolean,
    default: true
  },
  normalizeSpaces: {
    type: Boolean,
    default: false
  },

  // محدودیت‌های عمومی
  maxLength: {
    type: Number,
    default: null
  },

  // محدودیت‌های عددی
  min: {
    type: Number,
    default: null
  },
  max: {
    type: Number,
    default: null
  },
  maxDigits: {
    type: Number,
    default: null
  },

  // فرمت‌های خاص
  isPhone: {
    type: Boolean,
    default: false
  },
  isInteger: {
    type: Boolean,
    default: false
  },
  allowDecimal: {
    type: Boolean,
    default: true
  },
  decimalPlaces: {
    type: Number,
    default: 2
  },

  // نمایش اطلاعات
  showCounter: {
    type: Boolean,
    default: false
  },
  showDigitCounter: {
    type: Boolean,
    default: false
  },
  showLimits: {
    type: Boolean,
    default: false
  },

  // تنظیمات پیشرفته
  allowNegative: {
    type: Boolean,
    default: false
  },
  allowZero: {
    type: Boolean,
    default: true
  },
  autoFormat: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'input', 'blur', 'focus', 'keydown'])

// تعیین نوع input برای مرورگر
const inputType = computed(() => {
  if (props.isNumber) return 'text' // از type="number" استفاده نمی‌کنیم تا کنترل کامل داشته باشیم
  return props.type
})

// تعیین inputmode برای کیبورد موبایل
const inputMode = computed(() => {
  if (props.isNumber || props.isPhone) return 'numeric'
  if (props.type === 'email') return 'email'
  if (props.type === 'tel') return 'tel'
  return 'text'
})

// مقدار نمایشی در input
const displayValue = computed(() => {
  const value = props.modelValue || ''

  if (!value) return ''

  // فرمت کردن شماره تلفن
  if (props.isPhone && value) {
    return formatPhoneNumber(value.toString())
  }

  // نمایش اعداد فارسی
  if (props.showPersianNumbers && value) {
    return toPersianNumbers(value.toString())
  }

  return value
})

// placeholder با اعداد فارسی
const persianPlaceholder = computed(() => {
  if (!props.placeholder) return ''
  return toPersianNumbers(props.placeholder)
})

// تعداد کاراکترها
const characterCount = computed(() => {
  return String(props.modelValue || '').length
})

// تعداد ارقام (فقط برای اعداد)
const digitCount = computed(() => {
  if (!props.isNumber || !props.modelValue) return 0

  const value = String(props.modelValue)
  // حذف نقطه اعشار و علامت منفی
  return value.replace(/[.-]/g, '').length
})

// فرمت کردن عدد برای نمایش محدوده
const formatNumber = (num) => {
  if (num === null || num === undefined) return ''

  let result = num.toString()
  if (props.showPersianNumbers) {
    result = toPersianNumbers(result)
  }

  // جدا کردن هزارگان
  if (props.autoFormat && props.isNumber) {
    result = result.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return result
}

// فرمت کردن شماره تلفن
const formatPhoneNumber = (phone) => {
  if (!phone) return ''

  let cleaned = removeNonNumeric(phone)

  // اگر با 0 شروع می‌شود
  if (cleaned.startsWith('0')) {
    if (cleaned.length <= 4) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
    if (cleaned.length <= 11) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`
  }

  // اگر با 9 شروع می‌شود (موبایل)
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return `0${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }

  return phone
}

// اعتبارسنجی عدد
const validateNumber = (value) => {
  if (!value) return true

  const numValue = parseFloat(value)

  // بررسی محدوده
  if (props.min !== null && numValue < props.min) {
    return `عدد نمی‌تواند کمتر از ${props.min} باشد`
  }

  if (props.max !== null && numValue > props.max) {
    return `عدد نمی‌تواند بیشتر از ${props.max} باشد`
  }

  // بررسی تعداد ارقام
  if (props.maxDigits !== null && digitCount.value > props.maxDigits) {
    return `تعداد ارقام نمی‌تواند بیشتر از ${props.maxDigits} باشد`
  }

  // بررسی منفی
  if (!props.allowNegative && numValue < 0) {
    return 'عدد نمی‌تواند منفی باشد'
  }

  // بررسی صفر
  if (!props.allowZero && numValue === 0) {
    return 'عدد نمی‌تواند صفر باشد'
  }

  return true
}

// هندل کردن ورودی
const handleInput = (event) => {
  let value = event.target.value

  // اگر نمایش فارسی فعال است، ابتدا به انگلیسی تبدیل کن
  if (props.showPersianNumbers) {
    value = toEnglishNumbers(value)
  }

  // اگر فقط عدد مجاز است
  if (props.isNumber) {
    // حذف همه چیز به جز اعداد، نقطه اعشار و علامت منفی
    let regexPattern = /[0-9.]/
    if (props.allowNegative) {
      regexPattern = /[0-9.-]/
    }

    // ساخت regex داینامیک
    const regex = new RegExp(`[^${regexPattern.source}]`, 'g')
    value = value.replace(regex, '')

    // حذف نقطه اعشار اضافی
    const decimalCount = (value.match(/\./g) || []).length
    if (decimalCount > 1) {
      const parts = value.split('.')
      value = parts[0] + '.' + parts.slice(1).join('')
    }

    // اگر اعشار مجاز نیست
    if (!props.allowDecimal) {
      value = value.replace(/\./g, '')
    }

    // محدود کردن ارقام اعشار
    if (props.allowDecimal && props.decimalPlaces > 0) {
      const parts = value.split('.')
      if (parts[1] && parts[1].length > props.decimalPlaces) {
        parts[1] = parts[1].substring(0, props.decimalPlaces)
        value = parts.join('.')
      }
    }

    // حذف صفرهای ابتدایی غیرضروری
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.replace(/^0+/, '') || '0'
    }
  }

  // حذف فضای اضافی اگر normalizeSpaces فعال باشد
  if (props.normalizeSpaces) {
    value = normalizeSpaces(value)
  }

  // محدود کردن طول اگر maxLength مشخص شده
  if (props.maxLength && value.length > props.maxLength) {
    value = value.substring(0, props.maxLength)
  }

  // ارسال مقدار پردازش شده
  emit('update:modelValue', value)
  emit('input', {
    value: value,
    displayValue: props.showPersianNumbers ? toPersianNumbers(value) : value,
    event: event,
    isValid: props.isNumber ? validateNumber(value) === true : true
  })
}

// هندل کردن blur
const handleBlur = (event) => {
  let value = props.modelValue || ''

  // برای اعداد، نهایی‌سازی
  if (props.isNumber && value) {
    const numValue = parseFloat(value)

    // اعتبارسنجی نهایی
    const validationResult = validateNumber(value)
    if (validationResult !== true) {
      emit('input', {
        value: value,
        displayValue: props.showPersianNumbers ? toPersianNumbers(value) : value,
        event: event,
        isValid: false,
        error: validationResult
      })
    }

    // قالب‌بندی اگر autoFormat فعال باشد
    if (props.autoFormat && !isNaN(numValue)) {
      let formatted = numValue.toLocaleString('en-US')
      if (props.showPersianNumbers) {
        formatted = toPersianNumbers(formatted)
      }
      // فقط update کن اگر تغییر کرده
      if (formatted !== value) {
        emit('update:modelValue', numValue.toString())
      }
    }
  }

  // تبدیل نهایی به انگلیسی برای ذخیره
  if (props.convertToEnglish && value) {
    const englishValue = toEnglishNumbers(value.toString())
    if (englishValue !== value) {
      emit('update:modelValue', englishValue)
    }
  }

  emit('blur', {
    value: value,
    displayValue: props.showPersianNumbers ? toPersianNumbers(value) : value,
    event: event
  })
}

// هندل کردن focus
const handleFocus = (event) => {
  emit('focus', {
    value: props.modelValue,
    displayValue: props.showPersianNumbers ? toPersianNumbers(props.modelValue) : props.modelValue,
    event: event
  })
}

// هندل کردن keydown برای اعمال محدودیت‌ها
const handleKeyDown = (event) => {
  // برای inputهای عددی، برخی کلیدها را محدود کن
  if (props.isNumber) {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ]

    // اجازه دادن به کلیدهای کنترل
    if (allowedKeys.includes(event.key)) {
      return
    }

    // اجازه به اعداد
    if (event.key >= '0' && event.key <= '9') {
      return
    }

    // اجازه به نقطه اعشار
    if (props.allowDecimal && event.key === '.') {
      // بررسی اینکه قبلاً نقطه وجود ندارد
      const currentValue = event.target.value
      if (currentValue.includes('.')) {
        event.preventDefault()
      }
      return
    }

    // اجازه به علامت منفی
    if (props.allowNegative && event.key === '-') {
      // فقط در ابتدا مجاز است
      const currentValue = event.target.value
      if (currentValue.length > 0) {
        event.preventDefault()
      }
      return
    }

    // جلوگیری از بقیه کلیدها
    event.preventDefault()
  }

  emit('keydown', {
    event: event,
    value: props.modelValue,
    displayValue: props.showPersianNumbers ? toPersianNumbers(props.modelValue) : props.modelValue
  })
}

// متدهای focus و blur برای استفاده از خارج
const focus = () => {
  const input = document.getElementById(props.id)
  if (input) {
    input.focus()
    // برای inputهای عددی، کرسر را به انتها ببر
    if (props.isNumber) {
      setTimeout(() => {
        input.setSelectionRange(input.value.length, input.value.length)
      }, 0)
    }
  }
}

const blur = () => {
  const input = document.getElementById(props.id)
  if (input) input.blur()
}

// expose methods
defineExpose({ focus, blur, validateNumber })
</script>

<style scoped>
.custom-input {
  width: 100%;
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text);
  font-size: 14px;
}

.input-container {
  position: relative;
}

.input-field {
  min-height: var(--control-height);
  background: var(--input);
  color: var(--text);
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--control-radius);
  font-size: 1rem;
  line-height: 1.5;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
}

.input-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--focus);
}

.input-field:disabled {
  background-color: var(--surface-subtle);
  cursor: not-allowed;
  opacity: 0.7;
}

.input-field.has-error {
  border-color: var(--danger);
}

.input-field.has-error:focus {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px var(--color-danger-subtle);
}

.input-field.is-number {
  text-align: left;
  direction: ltr;
  font-family: var(--font-family-base);
}

[dir="rtl"] .input-field.is-number {
  text-align: right;
}

.limits-info {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--muted);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.error-message {
  margin-top: 0.25rem;
  color: var(--danger);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.error-message i {
  font-size: 0.75rem;
}

.character-counter,
.digit-counter {
  margin-top: 0.25rem;
  text-align: left;
  font-size: 0.75rem;
}

.character-counter span,
.digit-counter span {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background-color: var(--surface-subtle);
}

.character-counter .limit-exceeded,
.digit-counter .limit-exceeded {
  background-color: var(--color-danger-subtle);
  color: var(--danger);
  font-weight: 600;
}

/* برای RTL */
[dir="rtl"] .character-counter,
[dir="rtl"] .digit-counter {
  text-align: right;
}

[dir="rtl"] .input-field.is-number {
  direction: ltr;
  text-align: right;
}
</style>
