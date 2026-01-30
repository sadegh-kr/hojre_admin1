<template>
  <div class="customers-container">
    <!-- تیبل لیست مشتریان -->
    <Table
      v-if="!customerListLoading && !customerListError"
      :title="`مشتریان (${customerListData?.count || 0})`"
      :data="customerListData?.results || []"
      :columns="tableColumns"
      :searchable="true"
      :search-fields="['phone_number', 'name', 'restaurant_name']"
      :paginated="true"
      :server-pagination="true"
      :page-size="pagination.pageSize"
      :total-items="customerListData?.count || 0"
      :current-page="pagination.currentPage"
      :page-size-options="[5, 10, 20, 50]"
      :actions="tableActions"
      :show-row-number="true"
      :refreshable="true"
      :loading="customerListLoading"
      :mobile-title-field="'phone_number'"
      :mobile-columns="['name', 'restaurant_name', 'address_count']"
      @action="handleTableAction"
      @search="handleSearch" 
      @sort="handleSort"
      @page-change="handlePageChange"
      @update:pageSize="handlePageSizeChange"
    >
      <!-- ستون سفارشی برای شماره تلفن -->
      <template #cell-phone_number="{ value }">
        <div class="customer-cell">
          <a :href="`tel:${value}`" class="phone-number">
            <i class="fas fa-phone-alt icon-small"></i>
            {{ value }}
          </a>
        </div>
      </template>

      <!-- ستون سفارشی برای نام -->
      <template #cell-name="{ value, row }">
        <div class="name-cell">
          <div class="customer-name-wrapper">
            <i class="fas fa-user icon-small"></i>
            <span class="customer-name">{{ value || 'بدون نام' }}</span>
          </div>
          <span v-if="row.restaurant_name" class="restaurant-name">
            <i class="fas fa-store icon-small"></i>
            {{ row.restaurant_name }}
          </span>
        </div>
      </template>

      <!-- ستون سفارشی برای رستوران -->
      <template #cell-restaurant_name="{ value }">
        <span class="restaurant-cell">
          <i class="fas fa-utensils icon-small"></i>
          {{ value || '---' }}
        </span>
      </template>

      <!-- ستون سفارشی برای آخرین ورود -->
      <template #cell-last_login="{ value }">
        <div class="date-cell">
          <div class="date-wrapper">
            <i class="fas fa-sign-in-alt icon-small"></i>
            <span class="date">{{ formatDate(value) }}</span>
          </div>
          <span v-if="value" class="time">{{ formatTime(value) }}</span>
        </div>
      </template>

      <!-- ستون سفارشی برای تاریخ ایجاد -->
      <template #cell-created="{ value }">
        <div class="date-cell">
          <div class="date-wrapper">
            <i class="fas fa-calendar-plus icon-small"></i>
            <span class="date">{{ formatDate(value) }}</span>
          </div>
        </div>
      </template>

      <!-- ستون سفارشی برای تعداد آدرس -->
      <template #cell-address_count="{ value }">
        <span :class="`address-badge ${value > 0 ? 'has-address' : 'no-address'}`">
          <i :class="`fas ${value > 0 ? 'fa-map-marker-alt' : 'fa-map-marker'} icon-small`"></i>
          {{ value }} آدرس
        </span>
      </template>
    </Table>

    <!-- حالت‌های بارگذاری -->
    <div v-if="customerListLoading" class="loading-container">
      <div class="skeleton-loader">
        <!-- هدر اسکلت -->
        <div class="skeleton-header">
          <div class="skeleton-title"></div>
          <div class="skeleton-search"></div>
        </div>
        
        <!-- جدول اسکلت -->
        <div class="skeleton-table">
          <!-- هدرهای جدول -->
          <div class="skeleton-table-header">
            <div class="skeleton-th" v-for="n in 7" :key="n"></div>
          </div>
          
          <!-- ردیف‌های جدول -->
          <div class="skeleton-rows">
            <div class="skeleton-row" v-for="n in 5" :key="n">
              <div class="skeleton-td" v-for="m in 7" :key="m"></div>
            </div>
          </div>
          
          <!-- صفحه‌بندی اسکلت -->
          <div class="skeleton-pagination">
            <div class="skeleton-page-btn"></div>
            <div class="skeleton-page-info"></div>
            <div class="skeleton-page-btn"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- حالت خطا -->
    <div v-if="customerListError" class="error-container">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle error-icon"></i>
        <h3 class="error-title">خطا در دریافت اطلاعات</h3>
        <p class="error-message">{{ customerListError.message }}</p>
        <button @click="refetchCustomers()" class="retry-button">
          <i class="fas fa-redo"></i>
          تلاش مجدد
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Table from '@/components/Table.vue'
import { useCustomerList } from '@/hooks/useUserApi'
import { list } from 'postcss'

// مدیریت صفحه‌بندی
const pagination = ref({
  pageSize: 10,
  currentPage: 1,
  total: 0
})

// ستون‌های جدول
const tableColumns = ref([
  {
    key: 'name',
    label: 'نام مشتری',
    sortable: true,
    width: '220px'
  },
  {
    key: 'phone_number',
    label: 'شماره تلفن',
    sortable: true,
    width: '160px'
  },
  {
    key: 'restaurant_name',
    label: 'رستوران',
    sortable: true,
    width: '160px'
  },
  {
    key: 'address_count',
    label: 'آدرس‌ها',
    sortable: true,
    width: '120px'
  },
  {
    key: 'last_login',
    label: 'آخرین ورود',
    sortable: true,
    width: '170px'
  },
  {
    key: 'created',
    label: 'تاریخ عضویت',
    sortable: true,
    width: '170px'
  },
  {
    key: 'actions',
    label: 'عملیات',
    width: '140px'
  }
])

// اکشن‌های جدول
const tableActions = ref([
  {
    name: 'view',
    label: 'مشاهده',
    // icon: 'eye',
    color: 'primary',
    variant: 'outline'
  },
  {
    name: 'orders',
    label: 'سفارشات',
    // icon: 'shopping-cart',
    color: 'success',
    variant: 'outline'
  },
  {
    name: 'edit',
    label: 'ویرایش',
    // icon: 'edit',
    color: 'warning',
    variant: 'outline'
  }
])


const search = ref('')

const apiParams = ref({
  page: 1,
  limit: 10,
  search: ''
})

const { 
  data: customerListData, 
  isLoading: customerListLoading, 
  isError: customerListError,
//   refetch: refetchCustomers
} = useCustomerList({page:apiParams.value.page , search:apiParams.value.search , limit:apiParams.value.limit}, {
  refetchOnWindowFocus: false
})
console.log("this is dataaa:" , customerListData.targer)
// مشاهده سفارشات مشتری
const showOrderDetails = (customerId) => {
  console.log('مشاهده سفارشات مشتری:', customerId)
}

// هندلر اکشن‌های جدول
const handleTableAction = (action, row) => {
  switch (action.name) {
    case 'view':
      console.log('مشاهده مشتری:', row)
      break
    case 'orders':
      showOrderDetails(row.id)
      break
    case 'edit':
      console.log('ویرایش مشتری:', row)
      break
  }
}

// هندلر جستجو
const handleSearch = (searchQuery) => {
    console.log(searchQuery);
    
  apiParams.value.search = searchQuery.trim() || undefined
  apiParams.value.page = 1 // بازگشت به صفحه اول هنگام جستجو
  pagination.value.currentPage = 1
}

// هندلر مرتب‌سازی
const handleSort = (sortField, sortDirection) => {
  console.log('مرتب‌سازی:', sortField, sortDirection)
  // منطق مرتب‌سازی
}

// هندلر تغییر صفحه
const handlePageChange = (page) => {
  pagination.value.currentPage = page
  refetchCustomers({
    page: page,
    limit: pagination.value.pageSize
  })
}

// هندلر تغییر تعداد آیتم‌ها در صفحه
const handlePageSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.currentPage = 1
  refetchCustomers({
    page: 1,
    limit: pageSize
  })
}

// توابع فرمت‌دهی تاریخ و زمان
const formatDate = (dateString) => {
  if (!dateString) return '---'
  const date = new Date(dateString)
  return date.toLocaleDateString('fa-IR')
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.customers-container {
  width: 100%;
  min-height: 500px;
  position: relative;
}

/* استایل‌های سلول‌های جدول */
.customer-cell {
  display: flex;
  flex-direction: column;
}

.phone-number {
  color: #1890ff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.3s ease;
}

.phone-number:hover {
  color: #0056b3;
  text-decoration: underline;
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.customer-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-name {
  font-weight: 600;
  color: #333;
}

.restaurant-name {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 6px;
  width: fit-content;
}

.restaurant-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date {
  font-size: 14px;
  color: #333;
}

.time {
  font-size: 12px;
  color: #888;
  margin-right: 24px;
}

.address-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.address-badge.has-address {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.address-badge.has-address:hover {
  background-color: #bae7ff;
  transform: translateY(-1px);
}

.address-badge.no-address {
  background-color: #f5f5f5;
  color: #999;
  border: 1px solid #e8e8e8;
}

.icon-small {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

/* استایل‌های اسکلت لودر */
.loading-container {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-loader {
  width: 100%;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-title {
  width: 200px;
  height: 32px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 6px;
}

.skeleton-search {
  width: 300px;
  height: 40px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

.skeleton-table {
  width: 100%;
}

.skeleton-table-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 0 8px;
}

.skeleton-th {
  flex: 1;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-th:last-child {
  flex: 0.5;
}

.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 16px 8px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.skeleton-td {
  flex: 1;
  height: 16px;
  background: linear-gradient(90deg, #fafafa 25%, #f0f0f0 50%, #fafafa 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-td:last-child {
  flex: 0.5;
}

.skeleton-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.skeleton-page-btn {
  width: 100px;
  height: 36px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 6px;
}

.skeleton-page-info {
  width: 150px;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

/* استایل‌های حالت خطا */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 64px;
  color: #ff4d4f;
  margin-bottom: 20px;
}

.error-title {
  color: #333;
  margin-bottom: 12px;
  font-size: 20px;
  font-weight: 600;
}

.error-message {
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
}

.retry-button {
  background: #1890ff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.retry-button:active {
  transform: translateY(0);
}

/* انیمیشن لودر */
@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .skeleton-title {
    width: 150px;
  }
  
  .skeleton-search {
    width: 200px;
  }
  
  .skeleton-table-header {
    display: none;
  }
  
  .skeleton-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .skeleton-td {
    width: 100%;
  }
  
  .restaurant-name {
    font-size: 12px;
  }
  
  .phone-number, .customer-name-wrapper, .restaurant-cell, .date-wrapper {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .error-container {
    padding: 20px;
  }
  
  .error-icon {
    font-size: 48px;
  }
  
  .error-title {
    font-size: 18px;
  }
  
  .skeleton-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .skeleton-title, .skeleton-search {
    width: 100%;
  }
}
</style>