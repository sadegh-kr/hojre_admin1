<script setup>
import { computed } from 'vue'
const props = defineProps({ sales: { type: Array, default: () => [] }, collections: { type: Array, default: () => [] }, start: { type: String, default: '' }, end: { type: String, default: '' }, grouping: { type: String, default: 'day' }, showCollections: { type: Boolean, default: true } })
const money = value => `${Number(value || 0).toLocaleString('fa-IR')} تومان`
const label = value => {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00+03:30`)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran', month: 'short', day: 'numeric' }).format(date)
}
const rows = computed(() => {
  const byDate = new Map()
  if (props.sales.length || props.collections.length) {
    const current = new Date(`${props.start}T00:00:00Z`), end = new Date(`${props.end}T00:00:00Z`)
    if (props.grouping === 'month') current.setUTCDate(1)
    while (!Number.isNaN(current.valueOf()) && current <= end && byDate.size < 367) {
      const day = current.toISOString().slice(0, 10)
      byDate.set(day, { day, sales: 0, collected: 0 })
      if (props.grouping === 'month') current.setUTCMonth(current.getUTCMonth() + 1)
      else current.setUTCDate(current.getUTCDate() + 1)
    }
  }
  for (const row of props.sales) byDate.set(String(row.period).slice(0, 10), { day: String(row.period).slice(0, 10), sales: Number(row.sales || 0), collected: 0 })
  for (const row of props.collections) {
    const key = String(row.period).slice(0, 10)
    const item = byDate.get(key) || { day: key, sales: 0, collected: 0 }
    item.collected = Number(row.collected || 0)
    byDate.set(key, item)
  }
  return [...byDate.values()].sort((a, b) => a.day.localeCompare(b.day))
})
const max = computed(() => Math.max(1, ...rows.value.flatMap(row => [row.sales, row.collected])))
const point = (row, index, key) => ({ x: rows.value.length === 1 ? 340 : 30 + index * 620 / (rows.value.length - 1), y: 180 - row[key] / max.value * 145 })
const points = key => rows.value.map((row, index) => { const p = point(row, index, key); return `${p.x},${p.y}` }).join(' ')
</script>

<template>
  <div v-if="rows.length" class="trend-wrap">
    <div class="trend-legend"><span><i class="sales-dot"></i>فروش سفارش‌های ثبت‌شده</span><span v-if="showCollections"><i class="collected-dot"></i>وصول در بازه</span></div>
    <svg viewBox="0 0 680 210" role="img" aria-label="روند فروش و مبالغ وصول‌شده" preserveAspectRatio="none">
      <line v-for="y in [35, 83, 131, 180]" :key="y" x1="30" x2="650" :y1="y" :y2="y" class="gridline" />
      <polyline v-if="showCollections" :points="points('collected')" class="line collected" /><polyline :points="points('sales')" class="line sales" />
      <g v-for="(row, index) in rows" :key="row.day">
        <circle :cx="point(row,index,'sales').x" :cy="point(row,index,'sales').y" r="5" class="point sales-point"><title>{{ label(row.day) }} · فروش {{ money(row.sales) }}</title></circle>
        <circle v-if="showCollections" :cx="point(row,index,'collected').x" :cy="point(row,index,'collected').y" r="4" class="point collected-point"><title>{{ label(row.day) }} · وصول {{ money(row.collected) }}</title></circle>
      </g>
    </svg>
    <div class="trend-axis"><span>{{ label(rows[0].day) }}</span><span>{{ label(rows[rows.length - 1].day) }}</span></div>
  </div>
  <div v-else class="trend-empty">در این بازه فروش یا دریافت ثبت نشده است.</div>
</template>

<style scoped>
.trend-wrap{min-width:0}.trend-legend{display:flex;flex-wrap:wrap;gap:16px;color:var(--muted);font-size:.72rem}.trend-legend span{display:flex;align-items:center;gap:6px}.trend-legend i{width:9px;height:9px;border-radius:50%}.sales-dot{background:#9a623a}.collected-dot{background:#4c9c87}svg{display:block;width:100%;height:220px;overflow:visible;margin-top:10px}.gridline{stroke:var(--border);stroke-width:1;stroke-dasharray:4 6}.line{fill:none;stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.line.sales{stroke:#9a623a}.line.collected{stroke:#4c9c87;stroke-dasharray:6 5}.sales-point{fill:#9a623a}.collected-point{fill:#4c9c87}.point{stroke:var(--surface);stroke-width:2}.trend-axis{display:flex;justify-content:space-between;color:var(--muted);font-size:.68rem;direction:ltr}.trend-empty{display:grid;place-items:center;min-height:200px;color:var(--muted);font-size:.8rem}@media(max-width:600px){svg{height:170px}}
</style>
