import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { buildOnlineOrderMessage, createOnlineOrderPoller } from '../src/utils/onlineOrderNotifications.js'

function targets() {
  const listeners = new Map()
  const documentTarget = {
    hidden: false,
    addEventListener: (name, fn) => listeners.set(`document:${name}`, fn),
    removeEventListener: name => listeners.delete(`document:${name}`),
  }
  const windowTarget = {
    setTimeout: () => 1,
    clearTimeout: () => {},
    addEventListener: (name, fn) => listeners.set(`window:${name}`, fn),
    removeEventListener: name => listeners.delete(`window:${name}`),
  }
  return { documentTarget, windowTarget, listeners }
}

test('pending online order notification never claims payment success', () => {
  const message = buildOnlineOrderMessage({ id: 'abc', order_number: 1245, customer_name: 'مشتری', payment_status_display: 'در انتظار پرداخت' })
  assert.match(message, /۱٬۲۴۵/)
  assert.match(message, /در انتظار پرداخت/)
  assert.doesNotMatch(message, /پرداخت‌شده/)
  assert.doesNotMatch(message, /09\d+/)
})

test('poller delivers two orders once, persists cursor, and cleans listeners', async () => {
  const storageValues = new Map([['cursor', JSON.stringify({ created: '2026-01-01T00:00:00Z', id: 'old' })]])
  const storage = { getItem: key => storageValues.get(key) || null, setItem: (key, value) => storageValues.set(key, value), removeItem: key => storageValues.delete(key) }
  const notified = []
  let calls = 0
  const env = targets()
  const poller = createOnlineOrderPoller({
    fetchBatch: async () => {
      calls += 1
      return { orders: [{ id: 'one' }, { id: 'two' }, { id: 'one' }], cursor: { created: '2026-01-01T00:01:00Z', id: 'two' }, has_more: false }
    },
    notify: order => notified.push(order.id), storage, storageKey: 'cursor', ...env,
  })
  poller.start()
  await new Promise(resolve => setImmediate(resolve))
  await poller.poll()
  assert.equal(calls, 2)
  assert.deepEqual(notified, ['one', 'two'])
  assert.equal(JSON.parse(storageValues.get('cursor')).id, 'two')
  poller.stop()
  assert.equal(env.listeners.size, 0)
})

test('global layout owns watcher and clickable top-left host uses orders route', () => {
  const layout = readFileSync(new URL('../src/layouts/MainLayout.vue', import.meta.url), 'utf8')
  const host = readFileSync(new URL('../src/components/cost/CostToastHost.vue', import.meta.url), 'utf8')
  assert.match(layout, /createOnlineOrderPoller/)
  assert.match(layout, /path:\s*['"]\/dashboard\/orders['"]/)
  assert.match(layout, /onlineOrderPoller\?\.stop\(\)/)
  assert.match(host, /left:max\(1rem,env\(safe-area-inset-left\)\)/)
  assert.match(host, /@click="activate\(toast\)"/)
})
