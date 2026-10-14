import { useRoute, useRouter } from 'vue-router'

export function useSafeAdminBack() {
  const route = useRoute()
  const router = useRouter()

  function safeHistoryTarget() {
    const rawTarget = window.history.state?.back
    if (typeof rawTarget !== 'string' || !rawTarget) return null

    try {
      const url = new URL(rawTarget, window.location.origin)
      if (url.origin !== window.location.origin) return null

      const base = router.options.history.base.replace(/\/$/, '')
      const path = base && url.pathname.startsWith(base)
        ? url.pathname.slice(base.length) || '/'
        : url.pathname
      const resolved = router.resolve(`${path}${url.search}${url.hash}`)

      if (!resolved.path.startsWith('/dashboard')) return null
      if (!resolved.matched.length || resolved.fullPath === route.fullPath) return null
      return resolved
    } catch {
      return null
    }
  }

  function navigateBack(fallback = '/dashboard') {
    if (safeHistoryTarget()) {
      router.back()
      return
    }
    router.push(fallback)
  }

  return { navigateBack }
}
