<template>
  <button type="button" class="app-back-button" :aria-label="accessibleLabel" @click="navigateBack">
    <span aria-hidden="true">→</span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useSafeAdminBack } from '@/composables/useSafeAdminBack'

const props = defineProps({
  fallback: { type: [String, Object], default: '/dashboard' },
  label: { type: String, default: 'بازگشت' },
  ariaLabel: { type: String, default: '' },
})

const accessibleLabel = computed(() => props.ariaLabel || props.label)
const { navigateBack: safeNavigateBack } = useSafeAdminBack()
const navigateBack = () => safeNavigateBack(props.fallback)
</script>

<style scoped>
.app-back-button{min-height:var(--control-height-sm);display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 .9rem;border:1px solid var(--border-strong);border-radius:var(--button-radius);background:var(--surface);color:var(--text);font:inherit;font-size:var(--font-size-sm);font-weight:600;line-height:1.2;cursor:pointer;transition:var(--control-transition)}
.app-back-button:hover{border-color:var(--primary);background:var(--surface-hover);color:var(--primary);transform:translateY(-1px)}
.app-back-button:active{transform:translateY(0)}
.app-back-button span:first-child{font-family:Tahoma,Arial,sans-serif;font-size:1rem;line-height:1}
@media(max-width:640px){.app-back-button{width:max-content;max-width:100%}}
</style>
