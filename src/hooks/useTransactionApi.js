// hooks/useTransactionApi.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import TransactionAPI from '@/api/transaction.api'
import { ref, computed } from 'vue'

// ============ هِلپرها ============

/**
 * نرمال‌سازی داده‌های دریافتی از API
 * @param {any} data - داده‌های دریافتی از API
 * @param {string} key - کلید پیش‌فرض برای استخراج داده‌ها
 * @returns {Array} - آرایه نرمال‌سازی شده
 */
const normalizeData = (data, key = 'results') => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (data[key] && Array.isArray(data[key])) return data[key]
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.items && Array.isArray(data.items)) return data.items
    return []
}

/**
 * استخراج متادیتا از پاسخ API
 */
const extractMetadata = (data) => {
    if (!data) return null
    const metadata = {}
    if (data.count !== undefined) metadata.count = data.count
    if (data.next !== undefined) metadata.next = data.next
    if (data.previous !== undefined) metadata.previous = data.previous
    if (data.total_pages !== undefined) metadata.total_pages = data.total_pages
    if (data.current_page !== undefined) metadata.current_page = data.current_page
    return Object.keys(metadata).length ? metadata : null
}

// ============ کوئری‌ها ============

export function useTransactionList(queryParams = ref({}), options = {}) {
    return useQuery({
        queryKey: ['transactions', queryParams],
        queryFn: () => TransactionAPI.getList(queryParams.value),
        ...options
    })
}

export function useTransactionDetail(identifier, options = {}) {
    return useQuery({
        queryKey: ['transaction', identifier],
        queryFn: () => TransactionAPI.getDetail(identifier),
        enabled: !!identifier,
        ...options
    })
}

export function useTransactionSummary(queryParams = ref({}), options = {}) {
    return useQuery({
        queryKey: ['transaction-summary', queryParams],
        queryFn: () => TransactionAPI.getSummary(queryParams.value),
        ...options
    })
}

export function useMonthlyReport(queryParams = ref({}), options = {}) {
    return useQuery({
        queryKey: ['monthly-report', queryParams],
        queryFn: () => TransactionAPI.getMonthlyReport(queryParams.value),
        ...options
    })
}

export function useTransactionStatistics(queryParams = ref({}), options = {}) {
    return useQuery({
        queryKey: ['transaction-statistics', queryParams],
        queryFn: () => TransactionAPI.getStatistics(queryParams.value),
        ...options
    })
}

// ============ دسته‌بندی‌ها ============

export function useCategoryList(queryParams = ref({}), options = {}) {
    return useQuery({
        queryKey: ['categories', queryParams],
        queryFn: () => TransactionAPI.getCategoryList(queryParams.value),
        ...options
    })
}

export function useCategoryDetail(categoryId, options = {}) {
    return useQuery({
        queryKey: ['category', categoryId],
        queryFn: () => TransactionAPI.getCategoryDetail(categoryId),
        enabled: !!categoryId,
        ...options
    })
}

// ============ هوک‌های کمکی برای نرمال‌سازی داده‌ها ============

/**
 * هوک کمکی برای دریافت و نرمال‌سازی لیست دسته‌بندی‌ها
 * این هوک داده‌ها را به صورت آرایه نرمال‌سازی شده برمی‌گرداند
 */
export function useCategoryListData(queryParams = ref({}), options = {}) {
    const { data, isLoading, error, refetch } = useCategoryList(queryParams, options)
    
    const categories = computed(() => {
        const rawData = data.value
        if (!rawData) return []
        if (Array.isArray(rawData)) return rawData
        if (rawData.results && Array.isArray(rawData.results)) return rawData.results
        if (rawData.data && Array.isArray(rawData.data)) return rawData.data
        if (rawData.items && Array.isArray(rawData.items)) return rawData.items
        return []
    })
    
    const metadata = computed(() => {
        const rawData = data.value
        if (!rawData) return null
        return extractMetadata(rawData)
    })
    
    const count = computed(() => {
        if (metadata.value?.count !== undefined) return metadata.value.count
        return categories.value.length
    })
    
    return {
        categories,
        metadata,
        count,
        isLoading,
        error,
        refetch,
        raw: data
    }
}

/**
 * هوک کمکی برای دریافت و نرمال‌سازی لیست تراکنش‌ها
 * این هوک داده‌ها را به صورت آرایه نرمال‌سازی شده برمی‌گرداند
 */
export function useTransactionListData(queryParams = ref({}), options = {}) {
    const { data, isLoading, error, refetch } = useTransactionList(queryParams, options)
    
    const transactions = computed(() => {
        const rawData = data.value
        if (!rawData) return []
        if (Array.isArray(rawData)) return rawData
        if (rawData.results && Array.isArray(rawData.results)) return rawData.results
        if (rawData.data && Array.isArray(rawData.data)) return rawData.data
        if (rawData.items && Array.isArray(rawData.items)) return rawData.items
        return []
    })
    
    const metadata = computed(() => {
        const rawData = data.value
        if (!rawData) return null
        return extractMetadata(rawData)
    })
    
    const count = computed(() => {
        if (metadata.value?.count !== undefined) return metadata.value.count
        return transactions.value.length
    })
    
    return {
        transactions,
        metadata,
        count,
        isLoading,
        error,
        refetch,
        raw: data
    }
}

// ============ موتیشن‌ها ============

export function useCreateTransaction(options = {}) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (data) => TransactionAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['transaction-summary'] })
            queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] })
        },
        ...options
    })
}

export function useUpdateTransaction(options = {}) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ identifier, data }) => TransactionAPI.update(identifier, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['transaction', variables.identifier] })
            queryClient.invalidateQueries({ queryKey: ['transaction-summary'] })
            queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] })
        },
        ...options
    })
}

export function usePartialUpdateTransaction(options = {}) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ identifier, data }) => TransactionAPI.partialUpdate(identifier, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['transaction', variables.identifier] })
            queryClient.invalidateQueries({ queryKey: ['transaction-summary'] })
            queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] })
        },
        ...options
    })
}

export function useDeleteTransaction(options = {}) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (identifier) => TransactionAPI.delete(identifier),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['transaction', variables] })
            queryClient.invalidateQueries({ queryKey: ['transaction-summary'] })
            queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] })
        },
        ...options
    })
}

// ============ دسته‌بندی موتیشن‌ها ============

export function useCreateCategory(options = {}) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (data) => TransactionAPI.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        ...options
    })
}

export function useUpdateCategory(options = {}) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ categoryId, data }) => TransactionAPI.updateCategory(categoryId, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['category', variables.categoryId] })
        },
        ...options
    })
}

export function useDeleteCategory(options = {}) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (categoryId) => TransactionAPI.deleteCategory(categoryId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['category', variables] })
        },
        ...options
    })
}

// ============ خروجی پیش‌فرض برای سازگاری ============

export default {
    // کوئری‌ها
    useTransactionList,
    useTransactionDetail,
    useTransactionSummary,
    useMonthlyReport,
    useTransactionStatistics,
    useCategoryList,
    useCategoryDetail,
    
    // هوک‌های کمکی
    useCategoryListData,
    useTransactionListData,
    
    // موتیشن‌ها - تراکنش
    useCreateTransaction,
    useUpdateTransaction,
    usePartialUpdateTransaction,
    useDeleteTransaction,
    
    // موتیشن‌ها - دسته‌بندی
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    
    // هِلپرها
    normalizeData,
    extractMetadata
}
