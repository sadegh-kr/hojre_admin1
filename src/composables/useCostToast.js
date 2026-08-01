import { reactive, readonly } from 'vue'

const state = reactive({ items: [] })
let sequence = 0

function show(type, message) {
  if (!message) return
  const id = ++sequence
  state.items.push({ id, type, message })
  window.setTimeout(() => dismiss(id), 4500)
}

function dismiss(id) { state.items = state.items.filter(item => item.id !== id) }

export function useCostToast() {
  return { toasts: readonly(state), success: message => show('success', message), error: message => show('error', message), dismiss }
}
