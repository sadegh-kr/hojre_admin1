<script setup>
import { computed } from 'vue'
const props = defineProps({ name: { type: String, required: true }, size: { type: [Number, String], default: 20 } })
// Dependency-free outline icons; inherit currentColor for light/dark modes.
const paths = {
  home: 'm3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 21v-7h6v7',
  orders: 'M8 4h12v17H4V4h4 M8 2h8v4H8z M8 11h8 M8 15h8',
  users: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 3a4 4 0 0 1 0 8 M22 20v-2a4 4 0 0 0-3-3.87',
  fork: 'M4 3v8a3 3 0 0 0 6 0V3 M7 3v18 M19 21V3c-4 2-5 6-5 11h5',
  star: 'm12 2 3 6.4 7 1-5.1 5 1.2 7.1L12 17l-6.1 4.5 1.2-7.1L2 9.4l7-1z',
  wallet: 'M3 7h18v14H3z M3 7V4h15v3 M15 12h6v5h-6a2.5 2.5 0 0 1 0-5z',
  settings: 'M16 4h6 M2 4h9 M8 4v5 M2 12h5 M12 12h10 M16 12v5 M2 20h13 M20 20h2',
  calendar: 'M4 5h16v16H4z M8 2v6 M16 2v6 M4 10h16 M8 14h2 M13 14h2 M8 18h2',
  chevron: 'm9 6 6 6-6 6',
  down: 'm6 9 6 6 6-6',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  chart: 'M4 20V12 M10 20V4 M16 20v-9 M22 20V2',
  coin: 'M12 5c5 0 9 1.6 9 3.5S17 12 12 12 3 10.4 3 8.5 7 5 12 5z M3 8v7c0 2 4 4 9 4s9-2 9-4V8 M3 12c0 2 4 4 9 4s9-2 9-4',
  bag: 'M4 8h16l-1 13H5z M9 9V6a3 3 0 0 1 6 0v3',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2',
  phone: 'M6 2h4l1 5-3 2a16 16 0 0 0 7 7l2-3 5 1v4a4 4 0 0 1-4 4C9 22 2 15 2 6a4 4 0 0 1 4-4z',
  plus: 'M12 4v16 M4 12h16',
  search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z m6 14 5 5',
  alert: 'M12 2 2 20h20z M12 8v5 M12 17v1',
  check: 'M20 6 9 17l-5-5',
  close: 'M5 5 19 19 M19 5 5 19',
  box: 'm12 2 9 5v10l-9 5-9-5V7z M3 7l9 5 9-5 M12 12v10',
  logout: 'M10 4H4v16h6 M14 7l5 5-5 5 M19 12H8',
  arrow: 'M20 12H4 m6-6-6 6 6 6',
  filter: 'M4 6h16 M7 12h10 M10 18h4',
  restaurant: 'M3 10h18v11H3z M5 10V5h14v5 M9 5V2h6v3 M8 15h8',
  activity: 'M2 12h5l3-8 4 16 3-8h5',
}
const d = computed(() => paths[props.name] || paths.home)
</script>
<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path :d="d" /></svg>
</template>
