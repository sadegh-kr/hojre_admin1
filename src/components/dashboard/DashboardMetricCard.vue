<template>
  <article class="dashboard-metric" :class="`dashboard-metric--${tone}`">
    <div class="dashboard-metric-heading"><span class="dashboard-metric-icon"><AppIcon :name="icon" /></span><span>{{ label }}</span></div>
    <div class="dashboard-metric-value"><strong>{{ displayValue }}</strong><em v-if="unit && value !== null && value !== undefined">{{ unit }}</em></div>
    <small>{{ hint }}</small>
    <RouterLink v-if="to" :to="to">{{ action }} <AppIcon name="chevron" /></RouterLink>
  </article>
</template>
<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/common/AppIcon.vue'
const props = defineProps({ label: String, value: [Number, String], unit: String, hint: String, tone: { type: String, default: 'default' }, icon: { type: String, default: 'orders' }, to: String, action: String })
const displayValue = computed(() => props.value === null || props.value === undefined ? '—' : Number(props.value).toLocaleString('fa-IR'))
</script>
