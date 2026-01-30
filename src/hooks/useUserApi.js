// hooks/useUserApi.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import UserAPI from '@/api/user.api'

// Hook برای گرفتن لیست کاربران
export function useCustomerList(params = {}, options = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      try {
        const response = await UserAPI.getCustomerList(params)
        
        // دیباگ: بررسی ساختار پاسخ
        console.log('useCustomerList response:', response)
        
        // اگر response آبجکت axios کامل است
        if (response && typeof response === 'object') {
          // بررسی property‌های رایج
          console.log('Response properties:', Object.keys(response))
          
          // اگر property data وجود دارد
          if (response.data !== undefined) {
            console.log('response.data:', response.data)
            
            // بررسی ساختار دیتا
            if (Array.isArray(response.data)) {
              return {
                results: response.data,
                count: response.data.length
              }
            }
            
            // اگر دیتا آبجکت است
            if (response.data && typeof response.data === 'object') {
              // بررسی ساختارهای رایج
              const data = response.data
              
              if (data.results !== undefined) {
                return {
                  results: data.results,
                  count: data.count || data.total || data.results.length
                }
              }
              
              if (data.data !== undefined) {
                return {
                  results: data.data,
                  count: data.count || data.total || data.data.length
                }
              }
              
              if (data.items !== undefined) {
                return {
                  results: data.items,
                  count: data.count || data.total || data.items.length
                }
              }
              
              // اگر دیتا خودش آرایه‌ای از مشتری‌هاست
              if (Array.isArray(data)) {
                return {
                  results: data,
                  count: data.length
                }
              }
            }
          }
        }
        
        // اگر response خودش آرایه است
        if (Array.isArray(response)) {
          return {
            results: response,
            count: response.length
          }
        }
        
        // اگر response آبجکت استاندارد است
        if (response && typeof response === 'object') {
          // بررسی property‌های رایج
          if (response.results !== undefined) {
            return {
              results: response.results,
              count: response.count || response.total || response.results.length
            }
          }
          
          if (response.data !== undefined) {
            return {
              results: response.data,
              count: response.count || response.total || response.data.length
            }
          }
        }
        
        // حالت پیش‌فرض
        console.warn('Unexpected response structure:', response)
        return {
          results: [],
          count: 0
        }
        
      } catch (error) {
        console.error('Error in useCustomerList queryFn:', error)
        throw error
      }
    },
    ...options
  })
}