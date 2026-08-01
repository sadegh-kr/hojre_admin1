<!-- components/modals/CategoryModal.vue -->
<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ isEdit ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید' }}</h3>
        <button @click="closeModal" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- نام دسته‌بندی -->
        <div class="form-group">
          <label for="name">نام دسته‌بندی <span class="required">*</span></label>
          <CustomInput
              id="name"
              v-model="form.name"
              type="text"
              placeholder="مثال: هزینه حمل و نقل"
              :show-persian-numbers="true"
              :convert-to-english="true"
              :normalize-spaces="true"
              :max-length="50"
              :show-counter="true"
              class="form-control"
              :class="{ 'is-invalid': errors.name }"
              required
          />
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
        </div>

        <!-- نام انگلیسی -->
        <div class="form-group">
          <label for="name_en">نام انگلیسی</label>
          <CustomInput
              id="name_en"
              v-model="form.name_en"
              type="text"
              placeholder="مثال: Delivery"
              :max-length="50"
              :show-counter="true"
              class="form-control"
              :class="{ 'is-invalid': errors.name_en }"
          />
          <span v-if="errors.name_en" class="error-text">{{ errors.name_en }}</span>
        </div>

        <!-- آیکون -->
        <div class="form-group">
          <label for="icon">آیکون</label>
          <div class="icon-selector">
            <input
                id="icon"
                v-model="form.icon"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.icon }"
                placeholder="مثال: coffee, tools, home"
                list="icon-suggestions"
            />
            <datalist id="icon-suggestions">
              <option v-for="icon in iconSuggestions" :key="icon" :value="icon">
                {{ icon }}
              </option>
            </datalist>
            <div class="icon-preview" v-if="form.icon">
              <i :class="`fas fa-${form.icon}`"></i>
            </div>
          </div>
          <small class="form-text text-muted">
            نام آیکون از Font Awesome (مثال: coffee, tools, home, truck, shopping-cart)
          </small>
          <span v-if="errors.icon" class="error-text">{{ errors.icon }}</span>
        </div>

        <!-- رنگ -->
        <div class="form-group">
          <label for="color">رنگ <span class="required">*</span></label>
          <div class="color-selector">
            <input
                id="color"
                v-model="form.color"
                type="color"
                class="color-picker"
                :class="{ 'is-invalid': errors.color }"
            />
            <CustomInput
                v-model="form.color"
                type="text"
                placeholder="#4CAF50"
                :max-length="7"
                :show-counter="true"
                class="form-control color-input"
                :class="{ 'is-invalid': errors.color }"
            />
            <div class="color-preview" :style="{ backgroundColor: form.color }"></div>
          </div>
          <span v-if="errors.color" class="error-text">{{ errors.color }}</span>
        </div>

        <!-- وضعیت فعال -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
                v-model="form.is_active"
                type="checkbox"
                class="form-checkbox"
            />
            <span class="checkbox-text">فعال</span>
          </label>
          <small class="form-text text-muted">
            در صورت غیرفعال بودن، این دسته‌بندی در لیست قابل انتخاب نیست
          </small>
        </div>

        <!-- خطاهای عمومی -->
        <div v-if="submitError" class="error-container">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ submitError }}</span>
        </div>

        <!-- دکمه‌ها -->
        <div class="modal-actions">
          <button type="button" @click="closeModal" class="btn btn-secondary">
            انصراف
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
            {{ isEdit ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import CustomInput from '@/components/common/Input.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  editData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'submit'])

// ============ State ============
const form = ref({
  name: '',
  name_en: '',
  icon: '',
  color: '#4CAF50',
  is_active: true
})

const errors = ref({})
const isSubmitting = ref(false)
const submitError = ref('')

// ============ Computed ============
const isEdit = computed(() => !!props.editData)

// ============ Icon Suggestions ============
const iconSuggestions = [
  'coffee',
  'tools',
  'home',
  'truck',
  'shopping-cart',
  'box',
  'utensils',
  'glass-cheers',
  'mug-hot',
  'store',
  'building',
  'car',
  'gas-pump',
  'wifi',
  'phone',
  'tv',
  'music',
  'book',
  'film',
  'camera',
  'dollar-sign',
  'credit-card',
  'wallet',
  'piggy-bank',
  'receipt',
  'file-invoice',
  'clipboard',
  'calendar',
  'clock',
  'users',
  'user-tie',
  'cog',
  'wrench',
  'hammer',
  'paint-roller',
  'lightbulb',
  'leaf',
  'seedling',
  'tree',
  'flower',
  'apple-alt',
  'fish',
  'drumstick',
  'pizza-slice',
  'hamburger',
  'ice-cream',
  'cake',
  'cookie'
]

// ============ Methods ============
const resetForm = () => {
  form.value = {
    name: '',
    name_en: '',
    icon: '',
    color: '#4CAF50',
    is_active: true
  }
  errors.value = {}
  submitError.value = ''
  isSubmitting.value = false
}

const loadEditData = () => {
  if (props.editData) {
    form.value = {
      name: props.editData.name || '',
      name_en: props.editData.name_en || '',
      icon: props.editData.icon || '',
      color: props.editData.color || '#4CAF50',
      is_active: props.editData.is_active !== undefined ? props.editData.is_active : true
    }
  }
}

const validate = () => {
  const newErrors = {}

  if (!form.value.name || form.value.name.trim().length < 2) {
    newErrors.name = 'نام دسته‌بندی حداقل ۲ کاراکتر باشد'
  }

  if (form.value.name && form.value.name.length > 50) {
    newErrors.name = 'نام دسته‌بندی حداکثر ۵۰ کاراکتر باشد'
  }

  if (form.value.name_en && form.value.name_en.length > 50) {
    newErrors.name_en = 'نام انگلیسی حداکثر ۵۰ کاراکتر باشد'
  }

  // اعتبارسنجی رنگ
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!form.value.color || !colorRegex.test(form.value.color)) {
    newErrors.color = 'رنگ معتبر نیست (مثال: #4CAF50)'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const data = {
      name: form.value.name.trim(),
      name_en: form.value.name_en.trim(),
      icon: form.value.icon.trim(),
      color: form.value.color,
      is_active: form.value.is_active
    }

    if (isEdit.value) {
      emit('submit', { categoryId: props.editData.id, data })
    } else {
      emit('submit', data)
    }

    closeModal()
  } catch (error) {
    submitError.value = error.message || 'خطا در ثبت دسته‌بندی'
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
  emit('close')
  resetForm()
}

// ============ Watch ============
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.editData) {
      loadEditData()
    } else {
      resetForm()
    }
  }
})

watch(() => props.editData, (newVal) => {
  if (newVal && props.modelValue) {
    loadEditData()
  }
}, { deep: true })
</script>

<style scoped>
/* ============ Overlay ============ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ============ Modal Container ============ */
.modal-container {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ============ Header ============ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6c757d;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

/* ============ Body ============ */
.modal-body {
  padding: 24px;
}

/* ============ Form Groups ============ */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
  font-size: 14px;
}

.form-group label .required {
  color: #ff4d4f;
  margin-right: 2px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  color: #495057;
  transition: all 0.2s ease;
  background: white;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}

.form-control.is-invalid {
  border-color: #ff4d4f;
}

.form-control.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
}

.form-text {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
  display: block;
}

.text-muted {
  color: #6c757d;
}

/* ============ Icon Selector ============ */
.icon-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-selector .form-control {
  flex: 1;
}

.icon-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 20px;
  color: #2c3e50;
  flex-shrink: 0;
}

/* ============ Color Selector ============ */
.color-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker {
  width: 44px;
  height: 44px;
  padding: 2px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  background: white;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.color-picker.is-invalid {
  border-color: #ff4d4f;
}

.color-input {
  flex: 1;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  flex-shrink: 0;
}

/* ============ Checkbox ============ */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 400;
  color: #495057;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4CAF50;
}

.checkbox-text {
  font-size: 14px;
}

/* ============ Errors ============ */
.error-text {
  display: block;
  font-size: 13px;
  color: #ff4d4f;
  margin-top: 4px;
}

.error-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff5f5;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #ff4d4f;
  margin-top: 16px;
  font-size: 14px;
}

.error-container i {
  font-size: 18px;
}

/* ============ Actions ============ */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976D2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* ============ Scrollbar ============ */
.modal-container::-webkit-scrollbar {
  width: 6px;
}

.modal-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-container::-webkit-scrollbar-thumb {
  background: #c1c7cd;
  border-radius: 3px;
}

.modal-container::-webkit-scrollbar-thumb:hover {
  background: #a8afb6;
}

/* ============ Responsive ============ */
@media (max-width: 600px) {
  .modal-container {
    max-width: 100%;
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .icon-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .icon-preview {
    align-self: center;
  }

  .color-selector {
    flex-wrap: wrap;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>