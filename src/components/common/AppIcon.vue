<template>
  <svg class="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(path, index) in paths[name] || paths.orders" :key="index" :d="path" />
  </svg>
</template>

<script setup>
defineProps({ name: { type: String, default: 'orders' } })
const paths = {
  home: ['M3 10 12 3l9 7', 'M5 9v12h5v-7h4v7h5V9'],
  orders: ['M9 5H5v16h14V5h-4', 'M9 3h6v4H9z', 'M8 11h8M8 15h8M8 18h5'],
  users: ['M15 21v-3a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v3', 'M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M17 3a4 4 0 0 1 0 8M18 14a4 4 0 0 1 3 4v3'],
  menu: ['M4 3v6a3 3 0 0 0 6 0V3M7 3v18', 'M20 3c-4 1-5 5-5 9h5M20 3v18'],
  star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z'],
  wallet: ['M3 6h18v15H3V6Zm0 0V3h16', 'M16 11h5v5h-5zM17 13.5h.1'],
  admin: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M2 21v-3a5 5 0 0 1 5-5h4', 'm17 12 5 2v3c0 3-5 5-5 5s-5-2-5-5v-3z', 'm15 17 1.5 1.5L19 16'],
  chevron: ['m14 6-6 6 6 6'],
  'menu-toggle': ['M4 6h16M4 12h16M4 18h16'],
  moon: ['M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z'],
  sun: ['M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M4 21v-2a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v2Z'],
  store: ['M3 9 5 3h14l2 6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0', 'M5 12v9h14v-9M9 21v-6h6v6M9 3v6M15 3v6'],
  logout: ['M9 3H4v18h5M10 12h12m-4-4 4 4-4 4'],
  calendar: ['M5 5h14v16H5zM8 3v4M16 3v4M5 10h14M8 13h1M12 13h1M16 13h.1M8 17h1M12 17h1'],
  refresh: ['M20 7v5h-5M4 17v-5h5', 'M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3'],
  coins: ['M21 6c0 2-4 3-7 3S7 8 7 6s4-3 7-3 7 1 7 3Z', 'M7 6v4c0 2 4 3 7 3s7-1 7-3V6M21 10v4c0 2-4 3-7 3', 'M11 15c0 1.5-2 2.5-5 2.5S1 16.5 1 15s2-2.5 5-2.5 5 1 5 2.5ZM1 15v4c0 1.5 2 2.5 5 2.5s5-1 5-2.5v-4'],
  bag: ['M5 8h14l2 13H3zM8 9V6a4 4 0 0 1 8 0v3'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4M12 1v1'],
  bolt: ['m13 2-9 12h7l-1 8L21 9h-8z'],
  plus: ['M12 5v14M5 12h14'],
  phone: ['M7 3H3c-1 10 8 19 18 18v-4l-5-2-2 2c-3-1-6-4-7-7l2-2z'],
  chart: ['M4 21V14h3v7zM11 21V9h3v12zM18 21V3h3v18z'],
  box: ['m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5V15'],
  check: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-13 0 3 3 5-6'],
  x: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M9 9l6 6M15 9l-6 6'],
  truck: ['M2 5h12v12H2zM14 9h4l4 4v4h-8M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0'],
}
</script>

<style scoped>
.app-icon{width:1.25rem;height:1.25rem;display:inline-block;flex:none;vertical-align:middle}
</style>
