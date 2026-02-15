<template>
  <div id="app" class="min-h-screen font-sans antialiased bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 text-gray-800 pb-16 sm:pb-20">
    <!-- نمایش صفحه فعلی -->
    <router-view />

    <!-- نوار وضعیت پایین -->
    <div  class="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-sm bg-gradient-to-r from-amber-900/95 to-amber-800/95 border-t border-amber-700/30 shadow-lg !p-2">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex flex-col  sm:flex-row justify-between items-center gap-2 p-[20px]">
          <!-- وضعیت اتصال -->
          <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <div class="flex items-center gap-2">
              <div v-if="isOnline" class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span class="text-green-300 font-medium">آنلاین</span>
              </div>
              <div v-else class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span class="text-yellow-300 font-medium">آفلاین</span>
              </div>
            </div>
            
            <div class="hidden sm:block h-4 w-px bg-white/30 mx-2"></div>
            
            <div class="flex items-center gap-2 text-sm opacity-90 text-white ">
              <i :class="isOnline ? 'fas fa-wifi' : 'fas fa-exclamation-triangle'"></i>
              <span>{{ isOnline ? 'اتصال اینترنت برقرار است' : 'اتصال اینترنت قطع است' }}</span>
            </div>
          </div>
          
          <!-- اطلاعات برنامه -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <i class="fas fa-mug-hot text-amber-300"></i>
              <span class="font-bold text-white">کافه حجره</span>


              <span class="text-xs bg-amber-600/30 px-2 py-1 rounded-full text-white !p-1"> Development & Maintenance | Supervised by Hossein Kooshkian v1.0.0</span>
            </div>

          </div>
        </div>
      </div>
    </div>
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