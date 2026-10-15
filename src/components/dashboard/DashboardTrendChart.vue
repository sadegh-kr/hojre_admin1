<template>
  <div v-if="points.length" class="dashboard-chart" :aria-label="`روند روزانه ${unit}`">
    <div class="dashboard-chart-scale" aria-hidden="true"><span>{{ number(maximum) }}</span><span>{{ number(maximum / 2) }}</span><span>۰</span></div>
    <div class="dashboard-chart-plot">
      <svg viewBox="0 0 600 170" preserveAspectRatio="none" :aria-label="`روند روزانه ${unit}؛ هر نقطه یک روز دارای داده است`">
        <line v-for="y in [25, 85, 145]" :key="y" x1="12" :y1="y" x2="588" :y2="y" class="chart-grid" />
        <path :d="areaPath" class="chart-area" />
        <path :d="linePath" class="chart-line" />
        <circle v-for="point in points" :key="point.date" :cx="point.x" :cy="point.y" r="4" class="chart-dot" tabindex="0" role="img" :aria-label="`${point.date}: ${number(point.value)} ${unit}`" @mouseenter="hoveredDate = point.date" @mouseleave="hoveredDate = null" @focus="hoveredDate = point.date" @blur="hoveredDate = null"><title>{{ point.date }}: {{ number(point.value) }} {{ unit }}</title></circle>
      </svg>
      <div v-if="hoveredPoint" class="dashboard-chart-tooltip" :style="{ left: Math.min(82, Math.max(18, hoveredPoint.x / 600 * 100)) + '%' }" aria-hidden="true"><strong>{{ number(hoveredPoint.value) }} {{ unit }}</strong><small>{{ hoveredPoint.date }}</small></div>
      <div class="dashboard-chart-labels" aria-hidden="true"><span v-for="label in labels" :key="label.date">{{ label.date }}</span></div>
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ rows: { type: Array, default: () => [] }, valueKey: { type: String, required: true }, unit: { type: String, required: true } })
const number = value => Number(value).toLocaleString('fa-IR')
const maximum = computed(() => Math.max(1, ...props.rows.map(row => Number(row[props.valueKey]) || 0)))
const points = computed(() => props.rows.map((row, index) => ({ date: row.date, value: Number(row[props.valueKey]) || 0, x: 12 + index * 576 / Math.max(1, props.rows.length - 1), y: 145 - (Number(row[props.valueKey]) || 0) / maximum.value * 120 })))
const linePath = computed(() => points.value.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' '))
const areaPath = computed(() => points.value.length ? `${linePath.value} L${points.value.at(-1).x},145 L${points.value[0].x},145 Z` : '')
const hoveredDate = ref(null)
const hoveredPoint = computed(() => points.value.find(point => point.date === hoveredDate.value))
const labels = computed(() => props.rows.length <= 5 ? props.rows : [props.rows[0], props.rows[Math.floor((props.rows.length - 1) / 2)], props.rows[props.rows.length - 1]])
</script>
