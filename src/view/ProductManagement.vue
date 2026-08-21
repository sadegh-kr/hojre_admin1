<template>
  <section class="cost-control" dir="rtl">
    <RouterView />
    <CostToastHost />
  </section>
</template>

<script setup>
import CostToastHost from '@/components/cost/CostToastHost.vue'
</script>

<style src="@/assets/cost-control.css"></style>
