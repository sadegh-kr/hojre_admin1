[file name]: BaseModal.vue
[file content begin]
<template>
  <teleport to="body">
    <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" :class="modalClass" :style="modalStyle" @click.stop>
        <!-- هدر مودال -->
        <div class="modal-header">
          <slot name="header">
            <h3 v-if="title">{{ title }}</h3>
            <button class="modal-close-btn" @click="close" aria-label="بستن">
              ×
            </button>
          </slot>
        </div>

        <!-- بدنه مودال -->
        <div class="modal-body">
          <slot></slot>
        </div>

        <!-- فوتر مودال -->
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  // نمایش/عدم نمایش مودال
  modelValue: {
    type: Boolean,
    default: false
  },
  // عنوان مودال
  title: {
    type: String,
    default: ''
  },
  // اندازه مودال
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  // کلاس‌های اضافی برای مودال
  modalClass: {
    type: [String, Array, Object],
    default: ''
  },
  // استایل‌های اضافی برای مودال
  modalStyle: {
    type: Object,
    default: () => ({})
  },
  // آیا با کلیک روی overlay بسته شود؟
  closeOnOverlayClick: {
    type: Boolean,
    default: true
  },
  // آیا با کلید ESC بسته شود؟
  closeOnEsc: {
    type: Boolean,
    default: true
  },
  // آیا اسکرول body غیرفعال شود؟
  disableBodyScroll: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'update:modelValue',
  'open',
  'close',
  'before-close',
  'after-close'
]);

const isVisible = ref(props.modelValue);

// محاسبه اندازه مودال
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
    full: 'modal-full'
  };
  return sizes[props.size] || sizes.md;
});

// مدیریت کلیک روی overlay
const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    close();
  }
};

// بستن مودال
const close = () => {
  emit('before-close');
  emit('update:modelValue', false);
  emit('close');
};

// باز کردن مودال
const open = () => {
  emit('update:modelValue', true);
  emit('open');
};

// مدیریت کلید ESC
const handleEscKey = (event) => {
  if (event.key === 'Escape' && props.closeOnEsc && isVisible.value) {
    close();
  }
};

// مدیریت اسکرول body
const manageBodyScroll = (disable) => {
  if (!props.disableBodyScroll) return;

  if (disable) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

// واچر برای تغییرات modelValue
watch(() => props.modelValue, (newVal) => {
  isVisible.value = newVal;
  if (newVal) {
    manageBodyScroll(true);
    document.addEventListener('keydown', handleEscKey);
  } else {
    manageBodyScroll(false);
    document.removeEventListener('keydown', handleEscKey);
    emit('after-close');
  }
});

// واچر برای isVisible
watch(isVisible, (newVal) => {
  if (!newVal && props.modelValue) {
    emit('update:modelValue', false);
  }
});

// تمیزکاری
import { onUnmounted } from 'vue';
onUnmounted(() => {
  manageBodyScroll(false);
  document.removeEventListener('keydown', handleEscKey);
});

// تعریف متدهای عمومی
defineExpose({
  open,
  close,
  isVisible
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* سایزهای مختلف مودال */
.modal-sm { width: 400px; }
.modal-md { width: 600px; }
.modal-lg { width: 800px; }
.modal-xl { width: 1000px; }
.modal-full {
  width: 95vw;
  height: 95vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    width: 95vw;
    max-width: 95vw;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 16px 20px;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 14px 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    padding: 14px 16px;
    flex-wrap: wrap;
  }
}
</style>
[file content end]