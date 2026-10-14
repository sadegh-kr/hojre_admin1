<template><article class="dashboard-metric" :class="`dashboard-metric--${tone}`"><span>{{ label }}</span><div class="dashboard-metric-value"><strong>{{ displayValue }}</strong><em v-if="unit && value !== null && value !== undefined">{{ unit }}</em></div><small>{{ hint }}</small><RouterLink v-if="to" :to="to">{{ action }} ←</RouterLink></article></template>
<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
const props = defineProps({ label: String, value: [Number, String], unit: String, hint: String, tone: { type: String, default: 'default' }, to: String, action: String })
const displayValue = computed(() => props.value === null || props.value === undefined ? '—' : Number(props.value).toLocaleString('fa-IR'))
</script>
