<template><div v-if="points.length" class="dashboard-chart" role="img" :aria-label="`روند روزانه ${unit}`"><div class="dashboard-chart-scale"><span>{{ number(maximum) }} {{ unit }}</span><span>۰</span></div><svg viewBox="0 0 600 170" preserveAspectRatio="none" aria-hidden="true"><line x1="12" y1="145" x2="588" y2="145" class="chart-axis"/><line x1="12" y1="80" x2="588" y2="80" class="chart-grid"/><path :d="linePath" class="chart-line"/><circle v-for="point in points" :key="point.date" :cx="point.x" :cy="point.y" r="3.5" class="chart-dot"><title>{{ point.date }}: {{ number(point.value) }} {{ unit }}</title></circle></svg><div class="dashboard-chart-labels"><span v-for="label in labels" :key="label.date">{{ label.date }}</span></div></div></template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ rows: { type: Array, default: () => [] }, valueKey: { type: String, required: true }, unit: { type: String, required: true } })
const number = value => Number(value).toLocaleString('fa-IR')
const maximum = computed(() => Math.max(1, ...props.rows.map(row => Number(row[props.valueKey]) || 0)))
const points = computed(() => props.rows.map((row, index) => ({ date: row.date, value: Number(row[props.valueKey]) || 0, x: 12 + index * 576 / Math.max(1, props.rows.length - 1), y: 145 - (Number(row[props.valueKey]) || 0) / maximum.value * 120 })))
const linePath = computed(() => points.value.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' '))
const labels = computed(() => props.rows.length <= 5 ? props.rows : [props.rows[0], props.rows[Math.floor((props.rows.length - 1) / 2)], props.rows[props.rows.length - 1]])
</script>
