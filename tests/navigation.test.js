import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const sidebar = readFileSync(new URL('../src/components/main/Sidebar.vue', import.meta.url), 'utf8')
const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')

test('item management keeps the existing POS route and recipe has its own link', () => {
  assert.match(router, /path:\s*"item-list",\s*component:\s*ItemList/)
  assert.match(sidebar, /label:\s*'مدیریت اقلام',\s*to:\s*'\/dashboard\/item-list'/)
  assert.match(sidebar, /label:\s*'دستور ساخت \(رسپی\)',\s*to:\s*'\/dashboard\/cost-control\/products'/)
})

test('inventory navigation has exactly two owner-only entries', () => {
  const inventorySection = sidebar.match(/\{ label: 'انبار', owner: true, items: \[(.*?)\n  \] \}/s)?.[1] || ''
  assert.equal([...inventorySection.matchAll(/\{ label:/g)].length, 2)
  assert.match(inventorySection, /\/dashboard\/inventory\/materials/)
  assert.match(inventorySection, /\/dashboard\/inventory'/)
  assert.match(router, /path:\s*"inventory",[\s\S]*?meta:\s*\{ requiresOwner:\s*true \}/)
})

test('cost management remains compact and points only to working routes', () => {
  const start = sidebar.indexOf("key: 'cost-management'")
  const end = sidebar.indexOf("{ label: 'دسترسی‌ها'", start)
  const costGroup = start >= 0 && end > start ? sidebar.slice(start, end) : ''
  const entries = [...costGroup.matchAll(/\{ label:/g)]
  assert.ok(entries.length > 0 && entries.length <= 5)
  assert.match(costGroup, /\/dashboard\/cost-control\/materials/)
  assert.match(costGroup, /\/dashboard\/inventory\/waste/)
  assert.match(costGroup, /\/dashboard\/cost-control\/expenses/)
  assert.match(costGroup, /\/dashboard\/cost-control\/overview/)
})
