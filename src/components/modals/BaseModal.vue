<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @mousedown.self="handleOverlayClick">
        <section
          ref="dialog"
          class="modal-container"
          :class="[sizeClass, modalClass]"
          :style="modalStyle"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
          @mousedown.stop
        >
          <header class="modal-header">
            <slot name="header">
              <h2 v-if="title" :id="titleId">{{ title }}</h2>
            </slot>
            <button
              v-if="showClose"
              type="button"
              class="modal-close-btn"
              :disabled="closeDisabled"
              aria-label="بستن پنجره"
              @click="close"
            >×</button>
          </header>
          <div class="modal-body"><slot /></div>
          <footer v-if="$slots.footer" class="modal-footer"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  size: { type: String, default: 'md', validator: value => ['sm', 'md', 'lg', 'xl', 'full'].includes(value) },
  modalClass: { type: [String, Array, Object], default: '' },
  modalStyle: { type: Object, default: () => ({}) },
  closeOnOverlayClick: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true },
  closeDisabled: { type: Boolean, default: false },
  showClose: { type: Boolean, default: true },
  disableBodyScroll: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'open', 'close'])
const dialog = ref(null)
const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`
const sizeClass = computed(() => `modal-${props.size}`)

function close() {
  if (props.closeDisabled) return
  emit('update:modelValue', false)
  emit('close')
}
function handleOverlayClick() {
  if (props.closeOnOverlayClick) close()
}
function handleKeydown(event) {
  if (event.key === 'Escape' && props.closeOnEsc && props.modelValue) close()
}
function setBodyLock(locked) {
  if (props.disableBodyScroll) document.body.style.overflow = locked ? 'hidden' : ''
}

watch(() => props.modelValue, async visible => {
  setBodyLock(visible)
  if (visible) {
    document.addEventListener('keydown', handleKeydown)
    emit('open')
    await nextTick()
    dialog.value?.focus()
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
}, { immediate: true })

onUnmounted(() => {
  setBodyLock(false)
  document.removeEventListener('keydown', handleKeydown)
})

defineExpose({ close })
</script>

<style scoped>
.modal-overlay{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:24px;background:rgba(17,24,39,.62);backdrop-filter:blur(3px)}
.modal-container{width:100%;max-height:calc(100dvh - 48px);display:flex;flex-direction:column;overflow:hidden;outline:0;background:var(--surface,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#e5e7eb);border-radius:16px;box-shadow:0 24px 70px rgba(17,24,39,.28)}
.modal-sm{max-width:420px}.modal-md{max-width:600px}.modal-lg{max-width:800px}.modal-xl{max-width:1040px}.modal-full{width:calc(100vw - 48px);height:calc(100dvh - 48px)}
.modal-header,.modal-footer{display:flex;align-items:center;gap:16px;flex-shrink:0;padding:20px 24px;background:var(--surface,#fff)}
.modal-header{justify-content:space-between;border-bottom:1px solid var(--border,#e5e7eb)}
.modal-footer{justify-content:flex-end;border-top:1px solid var(--border,#e5e7eb)}
.modal-header h2{margin:0;font-size:1.2rem;font-weight:800}
.modal-close-btn{width:36px;height:36px;display:grid;place-items:center;flex:0 0 auto;padding:0;border:0;border-radius:9px;background:var(--surface-subtle,#f3f4f6);color:var(--muted,#6b7280);font:inherit;font-size:1.4rem;cursor:pointer}
.modal-close-btn:hover{background:var(--border,#e5e7eb);color:var(--text,#1f2937)}.modal-close-btn:focus-visible{outline:3px solid color-mix(in srgb,var(--primary,#8a5e3a) 25%,transparent)}.modal-close-btn:disabled{opacity:.5;cursor:not-allowed}
.modal-body{min-height:0;overflow:auto;padding:24px}
.modal-fade-enter-active,.modal-fade-leave-active{transition:opacity .18s ease}.modal-fade-enter-active .modal-container,.modal-fade-leave-active .modal-container{transition:transform .18s ease}.modal-fade-enter-from,.modal-fade-leave-to{opacity:0}.modal-fade-enter-from .modal-container,.modal-fade-leave-to .modal-container{transform:translateY(12px) scale(.985)}
@media(max-width:640px){.modal-overlay{align-items:end;padding:0}.modal-container,.modal-sm,.modal-md,.modal-lg,.modal-xl{max-width:none;max-height:100dvh;height:100dvh;border-radius:0;border:0}.modal-header,.modal-footer{padding:16px}.modal-body{padding:16px}.modal-footer>:deep(button){flex:1}}
@media(prefers-reduced-motion:reduce){.modal-fade-enter-active,.modal-fade-leave-active,.modal-fade-enter-active .modal-container,.modal-fade-leave-active .modal-container{transition:none}}
</style>
