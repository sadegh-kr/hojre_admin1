<template>
  <div class="app-root">
    <!-- نمایش صفحه فعلی -->
    <router-view />

    <!-- نوار وضعیت پایین -->
   
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isOnline = ref(navigator.onLine)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
  
  // نمایش نوتیفیکیشن برای تغییر وضعیت
  if (isOnline.value) {
    console.log('اتصال اینترنت برقرار شد')
  } else {
    console.log('اتصال اینترنت قطع شد')
  }
}

onMounted(() => {
  // بررسی وضعیت اتصال اینترنت
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style>
/* انیمیشن‌های صفحه */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* اسکرول بار زیبا */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(139, 69, 19, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(139, 69, 19, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 69, 19, 0.5);
}

/* پدینگ برای محتوای صفحه */
.page-content {
  min-height: calc(100vh - 120px);
  padding: 1.5rem;
}

/* رسپانسیو */
@media (max-width: 640px) {
  .page-content {
    padding: 1rem;
    min-height: calc(100vh - 140px);
  }
}
</style>
