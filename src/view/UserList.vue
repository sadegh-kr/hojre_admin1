<template>
  <div class="customers-container">
    <!-- بخش فیلترهای پیشرفته -->
    <div class="advanced-filters">
      <div class="filter-header">
        <h3>جستجوی پیشرفته مشتریان</h3>
        <button @click="clearFilters" class="clear-filters-btn" v-if="hasActiveFilters">
          <i class="fas fa-times"></i>
          پاک کردن فیلترها
        </button>
      </div>

      <div class="filter-controls">

        <!-- در بخش template، جایگزینی فیلدهای جستجو -->
        <div class="search-fields">
          <!-- جستجو بر اساس شماره تلفن -->
          <!-- جستجو بر اساس شماره تلفن -->
          <div class="filter-group">
            <CustomInput
                v-model="filters.phoneNumber"
                label="شماره تلفن:"
                type="tel"
                :is-number="true"
                :is-phone="true"
                placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                :show-persian-numbers="true"
                :max-digits="11"
                :show-digit-counter="true"
                :show-limits="true"
                @input="handleFilterInput('phoneNumber')"
                class="filter-input"
            />
          </div>

          <div class="filter-group">
            <CustomInput
                v-model="filters.customerName"
                label="نام مشتری:"
                placeholder="نام مشتری را وارد کنید"
                :show-persian-numbers="true"
                :convert-to-english="true"
                :normalize-spaces="true"
                :max-length="50"
                :show-counter="true"
                @input="handleFilterInput('customerName')"
                class="filter-input"
            />
          </div>
        </div>
        <!-- اطلاعات فعال بودن فیلتر -->
        <div v-if="hasActiveFilters" class="active-filters-info">
          <span class="filter-info-text">
            <i class="fas fa-filter"></i>
            فیلترها فعال هستند
          </span>
        </div>
      </div>
    </div>

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
        :mobile-columns="['name', 'wallet_balance', 'delivered_orders_count']"
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

      <template #cell-wallet_balance="{ value }">
        <div class="wallet-cell">
    <span :class="`wallet-balance ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero'}`">
      {{ formatNumberWithCommas(value) }}
      <span>تومان</span>
    </span>
        </div>
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
    <UserDetailsModal
        v-if="showCustomerModal"
        :customer-id="selectedCustomerId"
        :model-value="showCustomerModal"
        @update:model-value="closeCustomerModal"
        @close="closeCustomerModal"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import Table from '@/components/Table.vue'
import { useCustomerList } from '@/hooks/useUserApi'
import CustomInput from '@/components/common/Input.vue'
import UserDetailsModal from "@/components/modals/user/UserDetailsModal.vue";
const showCustomerModal = ref(false)
const selectedCustomerId = ref(null)
// مدیریت صفحه‌بندی
const pagination = ref({
  pageSize: 10,
  currentPage: 1,
  total: 0
})

// پارامترهای جستجو و مرتب‌سازی
const sortParams = ref({
  field: null,
  direction: null
})
// تابع باز کردن مودال
const openCustomerModal = (customerId) => {
  console.log('باز کردن مودال برای مشتری:', customerId)
  selectedCustomerId.value = customerId
  showCustomerModal.value = true

  // برای دیباگ
  console.log('selectedCustomerId:', selectedCustomerId.value)
  console.log('showCustomerModal:', showCustomerModal.value)
}

// تابع بستن مودال
const closeCustomerModal = () => {
  console.log('بستن مودال')
  showCustomerModal.value = false
  selectedCustomerId.value = null
}
// فیلترهای پیشرفته با پارامترهای جداگانه
const filters = ref({
  phoneNumber: '',
  customerName: '',
  customerId: '',
  restaurantName: ''
})

// تایمر برای فیلترها
let filterTimer = null

// ستون‌های جدول
const tableColumns = ref([
  {
    key: 'name',
    title: 'نام مشتری',
    sortable: true,
    width: '220px'
  },
  {
    key: 'phone_number',
    title: 'شماره تلفن',
    sortable: true,
    width: '160px'
  },
  {
    key: 'address_count',
    title: 'آدرس‌ها',
    sortable: true,
    width: '120px'
  },
  {
    key: 'delivered_orders_count',
    title: 'تعداد سفارش',
    sortable: true,
    width: '170px'
  },
  {
    key: 'wallet_balance',
    title: 'کیف پول',
    sortable: true,
    width: '170px'
  }
])

// اکشن‌های جدول
const tableActions = ref([
  {
    name: 'view',
    label: 'مشاهده',
    icon: '👁️',
    color: 'primary',
    variant: 'outline'
  },
  {
    name: 'orders',
    label: 'سفارشات',
    icon: '📋',
    color: 'success',
    variant: 'outline'
  },
  {
    name: 'edit',
    label: 'ویرایش',
    icon: '✏️',
    color: 'warning',
    variant: 'outline'
  }
])

// پارامترهای API
const apiParams = ref({
  page: 1,
  page_size: 10,
  ordering: ''
})

// محاسبه آیا فیلتر فعالی وجود دارد
const hasActiveFilters = computed(() => {
  return filters.value.phoneNumber ||
      filters.value.customerName ||
      filters.value.customerId ||
      filters.value.restaurantName
})

// استفاده از هوک API
const {
  data: customerListData,
  isLoading: customerListLoading,
  error: customerListError,
  refetch: refetchCustomers
} = useCustomerList(apiParams, {
  refetchOnWindowFocus: false
})

// تابع برای هندل کردن ورودی فیلترها با debounce
const handleFilterInput = (fieldName) => {
  if (filterTimer) clearTimeout(filterTimer)

  filterTimer = setTimeout(() => {
    // وقتی فیلتر تغییر کرد به صفحه اول برگرد
    pagination.value.currentPage = 1
    updateApiParams()
  }, 500)
}

// تابع بروزرسانی پارامترهای API
const updateApiParams = () => {
  const params = {
    page: pagination.value.currentPage,
    page_size: pagination.value.pageSize,
    ordering: sortParams.value.field ?
        (sortParams.value.direction === 'desc' ? `-${sortParams.value.field}` : sortParams.value.field)
        : ''
  }

  // اضافه کردن فیلترهای جداگانه به پارامترها
  if (filters.value.phoneNumber.trim()) {
    params.phone_number = filters.value.phoneNumber.trim()
  }

  if (filters.value.customerName.trim()) {
    params.name = filters.value.customerName.trim()
  }

  if (filters.value.customerId.trim()) {
    params.id = filters.value.customerId.trim()
  }

  if (filters.value.restaurantName.trim()) {
    params.restaurant_name = filters.value.restaurantName.trim()
  }

  apiParams.value = params
  console.log('پارامترهای ارسالی:', params)
}

// تابع پاک کردن تمام فیلترها
const clearFilters = () => {
  filters.value = {
    phoneNumber: '',
    customerName: '',
    customerId: '',
    restaurantName: ''
  }
  pagination.value.currentPage = 1
  updateApiParams()
}

// مشاهده تغییرات صفحه‌بندی و مرتب‌سازی
watch(() => ({
  page: pagination.value.currentPage,
  pageSize: pagination.value.pageSize,
  sortField: sortParams.value.field,
  sortDirection: sortParams.value.direction
}), () => {
  updateApiParams()
}, { deep: true })

// مشاهده تغییرات داده‌های دریافتی
watch(() => customerListData.value, (newData) => {
  if (newData?.count !== undefined) {
    pagination.value.total = newData.count
  }
})

// هندلر اکشن‌های جدول
// هندلر اکشن‌های جدول
const handleTableAction = ({ action, row }) => {
  console.log('اکشن جدول:', action, 'برای ردیف:', row)

  switch (action) {
    case 'view':
      console.log('مشاهده جزئیات مشتری:', row.id, row.name)
      openCustomerModal(row.id)
      break
    case 'orders':
      console.log('سفارشات مشتری:', row.id, row.name)
      // اینجا می‌توانید روتینگ به صفحه سفارشات مشتری را اضافه کنید
      break
    case 'edit':
      const newName = prompt('نام جدید مشتری را وارد کنید:', row.name || '')
      if (newName !== null && newName.trim()) {
        console.log('ویرایش مشتری:', row.id, 'به:', newName)
        // اینجا می‌توانید API ویرایش را فراخوانی کنید
      }
      break
  }
}
// هندلر جستجو (برای جستجوی عمومی از کامپوننت Table)
const handleSearch = (query) => {
  if (filterTimer) clearTimeout(filterTimer)

  filterTimer = setTimeout(() => {
    // جستجوی عمومی - فقط در نام مشتری جستجو می‌کند
    filters.value.customerName = query
    filters.value.phoneNumber = ''
    filters.value.customerId = ''
    filters.value.restaurantName = ''
    pagination.value.currentPage = 1
    updateApiParams()
  }, 500)
}

// هندلر مرتب‌سازی
const handleSort = ({ column, order }) => {
  sortParams.value = {
    field: column,
    direction: order
  }
  pagination.value.currentPage = 1
}

// هندلر تغییر صفحه
const handlePageChange = ({ page, pageSize }) => {
  if (page !== pagination.value.currentPage || pageSize !== pagination.value.pageSize) {
    pagination.value.currentPage = page
    pagination.value.pageSize = pageSize
  }
}

// هندلر تغییر تعداد آیتم‌ها در صفحه
const handlePageSizeChange = (pageSize) => {
  if (pageSize !== pagination.value.pageSize) {
    pagination.value.pageSize = pageSize
    pagination.value.currentPage = 1
  }
}

// توابع فرمت‌دهی تاریخ و زمان
const formatDate = (dateString) => {
  if (!dateString) return '---'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch {
    return '---'
  }
}
// تابع جدید برای جدا کردن سه رقم سه رقم
const formatNumberWithCommas = (number) => {
  if (number === null || number === undefined || number === '') return '0'

  // تبدیل به عدد
  const num = Number(number)

  // استفاده از toLocaleString فارسی برای جدا کردن هزارگان
  return num.toLocaleString('fa-IR')
}


const formatTime = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  } catch {
    return ''
  }
}

// بارگذاری اولیه
updateApiParams()
</script>

<style scoped>
.customers-container {
  width: 100%;
  min-height: 500px;
  position: relative;
}

/* استایل‌های بخش فیلتر */
.advanced-filters {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.filter-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.clear-filters-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.clear-filters-btn:hover {
  background: #d9363e;
  transform: translateY(-1px);
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group label {
  font-weight: 600;
  color: #495057;
  min-width: 120px;
  font-size: 14px;
}

.filter-input {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  color: #495057;
  flex: 1;
  min-width: 250px;
  transition: all 0.2s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}

.filter-input::placeholder {
  color: #adb5bd;
}

.search-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.active-filters-info {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  color: #1890ff;
  margin-top: 15px;
}

.filter-info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
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
  font-family: 'Courier New', monospace;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.phone-number:hover {
  color: #0056b3;
  text-decoration: underline;
  background-color: #e9ecef;
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
  color: #2c3e50;
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
  border: 1px solid #e9ecef;
}

.restaurant-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  padding: 8px 0;
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
  color: #2c3e50;
  font-weight: 500;
}

.time {
  font-size: 12px;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'B Nazanin', Tahoma, Arial;
}

.address-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
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
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.address-badge.no-address {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
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
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 20px;
  font-weight: 700;
}

.error-message {
  color: #6c757d;
  margin-bottom: 24px;
  line-height: 1.6;
  font-size: 15px;
}

.retry-button {
  background: #1890ff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: #0056b3;
  transform: translateY(-2px);
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
  .search-fields {
    grid-template-columns: 1fr;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-group label {
    min-width: auto;
  }

  .filter-input {
    min-width: 100%;
    width: 100%;
  }

  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .clear-filters-btn {
    align-self: flex-end;
  }

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

  .customer-name {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .advanced-filters {
    padding: 15px;
  }

  .filter-header h3 {
    font-size: 1.1rem;
  }

  .clear-filters-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

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

  .address-badge {
    padding: 4px 8px;
    font-size: 12px;
  }
}
</style>