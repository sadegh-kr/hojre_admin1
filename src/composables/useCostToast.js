import { reactive, readonly } from 'vue'

const state = reactive({ items: [] })
let sequence = 0

function show(type, message, options = {}) {
  if (!message) return
  const id = ++sequence
  state.items.push({ id, type, message, title: options.title || '', action: options.action || null })
  if (options.duration) window.setTimeout(() => dismiss(id), options.duration)
  else window.setTimeout(() => dismiss(id), 4500)
}

function dismiss(id) { state.items = state.items.filter(item => item.id !== id) }
function activate(toast) { if (toast.action) toast.action(); dismiss(toast.id) }

export function useCostToast() {
  return {
    toasts: readonly(state),
    success: message => show('success', message),
    error: message => show('error', message),
    order: (message, options = {}) => show('order', message, { ...options, duration: options.duration || 7000 }),
    dismiss,
    activate,
  }
}
