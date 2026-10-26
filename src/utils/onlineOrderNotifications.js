export const ONLINE_ORDER_POLL_INTERVAL = 12000

export function onlineOrderCursorKey(userId, restaurantId) {
  return `hojreh-online-order-cursor:${String(userId || 'admin')}:${String(restaurantId)}`
}

export function buildOnlineOrderMessage(order) {
  const number = order.order_number == null ? String(order.id).slice(0, 8) : Number(order.order_number).toLocaleString('fa-IR')
  const customer = order.customer_name ? `، مشتری: ${order.customer_name}` : ''
  const payment = order.payment_status_display || 'نامشخص'
  return `سفارش شماره ${number} از سایت مشتریان ثبت شد${customer}. وضعیت پرداخت: ${payment}.`
}

function readCursor(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key))
    return value && typeof value.created === 'string' && typeof value.id === 'string' ? value : null
  } catch {
    storage.removeItem(key)
    return null
  }
}

export function createOnlineOrderPoller({
  fetchBatch,
  notify,
  storage,
  storageKey,
  documentTarget = document,
  windowTarget = window,
  interval = ONLINE_ORDER_POLL_INTERVAL,
  onError = () => {},
}) {
  let cursor = readCursor(storage, storageKey)
  let timer = null
  let running = false
  let stopped = true
  let generation = 0
  const notified = new Set()

  const schedule = delay => {
    if (!stopped) timer = windowTarget.setTimeout(poll, delay)
  }

  const poll = async () => {
    if (stopped || running) return
    if (documentTarget.hidden) { schedule(interval); return }
    running = true
    const run = generation
    try {
      let hasMore = false
      do {
        const payload = await fetchBatch(cursor)
        if (stopped || run !== generation) return
        const orders = Array.isArray(payload?.orders) ? payload.orders : []
        for (const order of orders) {
          if (!order?.id || notified.has(order.id)) continue
          notified.add(order.id)
          notify(order)
        }
        if (payload?.cursor?.created && typeof payload.cursor.id === 'string') {
          cursor = payload.cursor
          storage.setItem(storageKey, JSON.stringify(cursor))
        }
        hasMore = payload?.has_more === true
      } while (hasMore && !stopped && run === generation)
    } catch (error) {
      if (!stopped) onError(error)
    } finally {
      running = false
      if (!stopped && run === generation) schedule(interval)
    }
  }

  const resume = () => { if (!documentTarget.hidden) { if (timer) windowTarget.clearTimeout(timer); timer = null; poll() } }

  return {
    start() {
      if (!stopped) return
      stopped = false
      generation += 1
      documentTarget.addEventListener('visibilitychange', resume)
      windowTarget.addEventListener('focus', resume)
      windowTarget.addEventListener('online', resume)
      poll()
    },
    stop() {
      if (stopped) return
      stopped = true
      generation += 1
      if (timer) windowTarget.clearTimeout(timer)
      timer = null
      documentTarget.removeEventListener('visibilitychange', resume)
      windowTarget.removeEventListener('focus', resume)
      windowTarget.removeEventListener('online', resume)
    },
    poll,
  }
}
