<template>
  <div class="order-list-container">
    <div class="page-header">
      <h2>لیست سفارشات</h2>
      <div class="header-actions">
        <!-- دکمه نمایش/پنهان فیلترهای پیشرفته -->
        <button class="toggle-filters-btn" @click="toggleAdvancedFilters">
          <span v-if="showAdvancedFilters">✕</span>
          <span v-else>🔍</span>
          فیلترهای پیشرفته {{ showAdvancedFilters ? '(بستن)' : '(باز کردن)' }}
        </button>

        <!-- فیلتر وضعیت -->
        <div class="filter-group">
          <label for="status-filter">وضعیت:</label>
          <select
              id="status-filter"
              v-model="filters.status"
              class="filter-select"
              @change="applyFilters"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="pending">در انتظار تایید</option>
            <option value="prep">در حال آماده‌سازی</option>
            <option value="send">در حال ارسال</option>
            <option value="deliver">تحویل داده شده</option>
            <option value="cancel">لغو شده</option>
          </select>
        </div>

        <!-- فیلتر نوع تحویل -->
        <div class="filter-group">
          <label for="delivery-filter">نوع تحویل:</label>
          <select
              id="delivery-filter"
              v-model="filters.delivery"
              class="filter-select"
              @change="applyFilters"
          >
            <option value="">همه روش‌ها</option>
            <option value="takeoutN">تحویل حضوری (آنی)</option>
            <option value="takeoutP">تحویل حضوری (پیش‌سفارش)</option>
            <option value="dine-in">مصرف در محل</option>
            <option value="delivery">ارسال به آدرس</option>
          </select>
        </div>

        <!-- دکمه پاک کردن فیلترها -->
        <button
            class="clear-filters-btn"
            @click="clearAllFilters"
            :disabled="!hasActiveFilters"
        >
          پاک کردن فیلترها
        </button>
      </div>
    </div>

    <!-- فیلترهای پیشرفته -->
    <div v-if="showAdvancedFilters" class="advanced-filters-section">
      <div class="advanced-filters-grid">
        <!-- جستجو در کد سفارش -->
        <div class="filter-item">
          <label for="order-number-search">کد سفارش:</label>
          <input
              id="order-number-search"
              type="text"
              v-model="filters.orderNumber"
              placeholder="جستجو در کد سفارش..."
              class="filter-input"
              @input="handleSearchInput('orderNumber')"
          />
        </div>

        <!-- جستجو در مشتری -->
        <div class="filter-item">
          <label for="customer-search">مشتری:</label>
          <input
              id="customer-search"
              type="text"
              v-model="filters.customerSearch"
              placeholder="جستجو در نام یا شماره مشتری..."
              class="filter-input"
              @input="handleSearchInput('customerSearch')"
          />
        </div>

        <!-- بازه مبلغ -->
        <div class="filter-item amount-range">
          <label>مبلغ:</label>
          <div class="amount-range-inputs">
            <input
                type="number"
                v-model.number="filters.amountMin"
                placeholder="حداقل"
                class="amount-input"
                @input="handleAmountFilter"
                min="0"
            />
            <span class="amount-separator">تا</span>
            <input
                type="number"
                v-model.number="filters.amountMax"
                placeholder="حداکثر"
                class="amount-input"
                @input="handleAmountFilter"
                min="0"
            />
            <span class="amount-currency">تومان</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>در حال بارگذاری سفارش‌ها...</p>
    </div>

    <Table
        v-else
        :title="`سفارش‌ها (${pagination.total || 0})`"
        :data="orders"
        :columns="tableColumns"
        :searchable="false"
        :paginated="true"
        :server-pagination="true"
        :page-size="pagination.pageSize"
        :total-items="pagination.total"
        :current-page="pagination.currentPage"
        :page-size-options="[5, 10, 20, 50]"
        :actions="tableActions"
        :show-row-number="true"
        :refreshable="false"
        :loading="isLoading"
        :mobile-title-field="'id'"
        :mobile-columns="['customer_phone', 'status_fa', 'total_cost_fa']"
        @action="handleTableAction"
        @sort="handleSort"
        @page-change="handlePageChange"
        @update:pageSize="handlePageSizeChange"
    >
      <!-- ستون سفارشی برای شماره مشتری -->
      <template #cell-customer_phone="{ value }">
        <div class="customer-cell">
          <a :href="`tel:${value}`" class="phone-number">{{ value }}</a>
        </div>
      </template>

      <!-- ستون سفارشی برای وضعیت -->
      <template #cell-status="{ row }">
        <span :class="`status-badge status-${row.status}`">{{ row.status_fa }}</span>
      </template>

      <!-- ستون سفارشی برای نوع تحویل -->
      <template #cell-delivery="{ row }">
        <span :class="`delivery-badge delivery-${row.delivery}`">{{ row.delivery_fa }}</span>
      </template>

      <!-- ستون سفارشی برای مبلغ کل -->
      <template #cell-total_cost="{ row }">
        <div class="price-cell">
          <span class="total-price">{{ row.total_cost_fa }}</span>
          <span v-if="row.discount_percent" class="discount-badge">
            {{ row.discount_percent }}% تخفیف
          </span>
        </div>
      </template>

      <!-- ستون سفارشی برای مبلغ خالص -->
      <template #cell-net_cost="{ row }">
        <span class="net-price">{{ row.net_cost_fa }}</span>
      </template>

      <!-- ستون سفارشی برای آیتم‌ها -->
      <template #cell-items="{ row }">
        <div class="items-cell">
          <div v-for="(item, index) in row.items.slice(0, 2)"
               :key="index"
               class="item-row">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-quantity">{{ item.quantity }} عدد</span>
          </div>
          <div v-if="row.items.length > 2" class="more-items">
            + {{ row.items.length - 2 }} آیتم دیگر
          </div>
        </div>
      </template>

      <!-- ستون سفارشی برای تاریخ ایجاد -->
      <template #cell-created="{ value }">
        <div class="date-cell">
          <span class="date">{{ formatDate(value) }}</span>
          <span class="time">{{ formatTime(value) }}</span>
        </div>
      </template>
    </Table>

    <div v-if="orders.length === 0 && !isLoading" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>سفارشی یافت نشد</h3>
      <p v-if="hasActiveFilters">با فیلترهای اعمال شده سفارشی یافت نشد.</p>
      <p v-else>هنوز هیچ سفارشی برای این رستوران ثبت نشده است.</p>
    </div>

    <OrderDetailsModal
        v-model="showOrderModal"
        :order-id="selectedOrderId"
        @print="handlePrintFromModal"
        @open-map="handleOpenMapFromModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed } from "vue";
import { useRoute } from "vue-router";
import OrderApi from '@/api/order.api.js'
import Table from '@/components/Table.vue'
import OrderDetailsModal from "@/components/modals/orderes/OrderDetailsModal.vue";

const showOrderModal = ref(false);
const selectedOrderId = ref(null);
const route = useRoute();
const restaurantId = route.params.restaurantId;
const orders = ref([]);
const isLoading = ref(false);
const showAdvancedFilters = ref(true); // دیفالت: باز باشد

// متغیرهای تایمر
let searchTimeout = null;
let filterTimeout = null;

// اطلاعات صفحه‌بندی
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  next: null,
  previous: null,
  totalPages: 0
});

// اطلاعات جستجو و مرتب‌سازی
const filters = reactive({
  search: '',
  status: '',
  delivery: '',
  sortBy: '',
  sortOrder: 'asc',
  orderNumber: '',
  customerSearch: '',
  amountMin: '',
  amountMax: ''
});

// محاسبه‌گر برای بررسی وجود فیلتر فعال
const hasActiveFilters = computed(() => {
  return filters.status !== '' ||
      filters.delivery !== '' ||
      filters.orderNumber !== '' ||
      filters.customerSearch !== '' ||
      filters.amountMin !== '' ||
      filters.amountMax !== '';
});

// تابع باز و بسته کردن فیلترهای پیشرفته
const toggleAdvancedFilters = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value;
};

// توابع هندلر فیلترها
const handleSearchInput = (fieldName) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchOrders(1, pagination.pageSize);
  }, 500);
};

const handleAmountFilter = () => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    fetchOrders(1, pagination.pageSize);
  }, 500);
};

const applyFilters = () => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    fetchOrders(1, pagination.pageSize);
  }, 300);
};

// تابع پاک کردن تمام فیلترها
const clearAllFilters = () => {
  filters.status = '';
  filters.delivery = '';
  filters.orderNumber = '';
  filters.customerSearch = '';
  filters.amountMin = '';
  filters.amountMax = '';
  filters.sortBy = '';
  filters.sortOrder = 'asc';

  fetchOrders(1, pagination.pageSize);
};

// تعریف ستون‌های جدول
const tableColumns = ref([
  {
    key: 'order_number',
    title: 'شناسه',
    sortable: true,
    width: '180px'
  },
  {
    key: 'customer_phone',
    title: 'تماس',
    sortable: true,
    width: '140px'
  },
  {
    key: 'status',
    title: 'وضعیت',
    sortable: true,
    width: '130px'
  },
  {
    key: 'delivery',
    title: 'نوع تحویل',
    sortable: true,
    width: '140px'
  },
  {
    key: 'total_cost',
    title: ' کل',
    sortable: true,
    width: '140px',
    align: 'left'
  },
  {
    key: 'net_cost',
    title: ' خالص',
    sortable: true,
    width: '140px',
    align: 'left'
  },
  {
    key: 'items',
    title: 'آیتم‌ها',
    sortable: false,
    width: '200px'
  },
  {
    key: 'created',
    title: 'تاریخ ',
    sortable: true,
    width: '180px'
  }
]);

// تعریف عملیات
const tableActions = ref([
  {
    name: 'view',
    label: 'مشاهده',
    class: 'view-btn',
    icon: '👁️',
    title: 'مشاهده جزئیات سفارش'
  },
  {
    name: 'location',
    label: 'موقعیت',
    class: 'location-btn',
    icon: '📍',
    title: 'نمایش موقعیت روی نقشه',
    disabled: (row) => {
      return !row.address?.location?.latitude || !row.address?.location?.longitude;
    }
  },
]);

// توابع کمکی
const openGoogleMaps = (row) => {
  const address = row.address;
  if (!address?.location?.latitude || !address?.location?.longitude) {
    alert('موقعیت جغرافیایی برای این آدرس موجود نیست.');
    return;
  }
  const lat = address.location.latitude;
  const lng = address.location.longitude;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=fa`;
  window.open(mapsUrl, '_blank');
};

const processOrdersData = (ordersData) => {
  return ordersData.map(order => {
    // تبدیل وضعیت به فارسی
    let status_fa = '';
    switch(order.status) {
      case 'pending': status_fa = 'در انتظار تایید'; break;
      case 'prep': status_fa = 'در حال آماده‌سازی'; break;
      case 'send': status_fa = 'در حال ارسال'; break;
      case 'deliver': status_fa = 'تحویل داده شده'; break;
      case 'cancel': status_fa = 'لغو شده'; break;
      default: status_fa = order.status;
    }

    // تبدیل نوع تحویل به فارسی
    let delivery_fa = '';
    switch(order.delivery) {
      case 'takeoutN': delivery_fa = 'تحویل حضوری (آنی)'; break;
      case 'takeoutP': delivery_fa = 'تحویل حضوری (پیش‌سفارش)'; break;
      case 'dine-in': delivery_fa = 'مصرف در محل'; break;
      case 'delivery': delivery_fa = 'ارسال به آدرس'; break;
      default: delivery_fa = order.delivery;
    }

    // فرمت قیمت‌ها
    const formatPrice = (price) => {
      return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    const items = order.items.map(item => ({
      ...item,
      name: item.name === 'ایتم حذف شده' ? 'آیتم حذف شده' : item.name
    }));

    const customer_phone = order.customer?.phone_number || 'نامشخص';

    return {
      ...order,
      status_fa,
      customer_phone,
      delivery_fa,
      total_cost_fa: formatPrice(order.total_cost),
      net_cost_fa: formatPrice(order.net_cost),
      items
    };
  });
};

// تابع اصلی دریافت سفارش‌ها
const fetchOrders = async (page = 1, pageSize = pagination.pageSize) => {
  isLoading.value = true;
  try {
    const params = {
      page: page,
      page_size: pageSize
    };

    if (filters.orderNumber) {
      params.order_number = filters.orderNumber;
    }
    if (filters.customerSearch) {
      params.customer_search = filters.customerSearch;
    }
    if (filters.amountMin !== '' && filters.amountMin !== null) {
      params.total_cost__gte = filters.amountMin;
    }
    if (filters.amountMax !== '' && filters.amountMax !== null) {
      params.total_cost__lte = filters.amountMax;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.delivery) {
      params.delivery = filters.delivery;
    }
    if (filters.sortBy) {
      params.ordering = filters.sortOrder === 'desc'
          ? `-${filters.sortBy}`
          : filters.sortBy;
    }

    const response = await OrderApi.getOrdersByRestaurant(restaurantId, params);
    const data = response.data;

    orders.value = processOrdersData(data.results || []);

    pagination.currentPage = data.page || page;
    pagination.pageSize = data.page_size || pageSize;
    pagination.total = data.count || 0;
    pagination.totalPages = data.total_pages || Math.ceil(pagination.total / pageSize);
    pagination.next = data.next || null;
    pagination.previous = data.previous || null;

  } catch (error) {
    console.error("خطا در دریافت سفارش‌ها:", error);
    orders.value = [];
    pagination.currentPage = 1;
    pagination.total = 0;
    pagination.totalPages = 0;
    pagination.next = null;
    pagination.previous = null;

    const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || 'خطا در دریافت اطلاعات سفارش‌ها. لطفاً مجدداً تلاش کنید.';

    alert(errorMessage);

  } finally {
    isLoading.value = false;
  }
};

// توابع فرمت‌دهی تاریخ و زمان
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

// توابع هندلر عملیات
const openOrderModal = (orderId) => {
  selectedOrderId.value = orderId;
  showOrderModal.value = true;
};

const handleTableAction = ({ action, row }) => {
  switch(action) {
    case 'view':
      openOrderModal(row.id);
      break;
    case 'location':
      openGoogleMaps(row);
      break;
    case 'print':
      printInvoice(row);
      break;
  }
};

const handleSort = ({ column, order }) => {
  filters.sortBy = column;
  filters.sortOrder = order;
  fetchOrders(1, pagination.pageSize);
};

const handlePageChange = ({ page, pageSize }) => {
  if (page !== pagination.currentPage || pageSize !== pagination.pageSize) {
    fetchOrders(page, pageSize);
  }
};

const handlePageSizeChange = (newPageSize) => {
  if (newPageSize !== pagination.pageSize) {
    pagination.pageSize = newPageSize;
    fetchOrders(1, newPageSize);
  }
};

// توابع نمونه (می‌توانید حذف یا تغییر دهید)
const printInvoice = (order) => {
  console.log('چاپ فاکتور سفارش:', order.order_number);
  // کد چاپ ...
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.order-list-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e9ecef;
}

.page-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background-color: white;
  font-size: 0.9rem;
  color: #495057;
  cursor: pointer;
  min-width: 160px;
  transition: all 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}

/* دکمه‌ها */
.toggle-filters-btn,
.clear-filters-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.toggle-filters-btn {
  background-color: #e9ecef;
  color: #495057;
}

.toggle-filters-btn:hover {
  background-color: #dee2e6;
  transform: translateY(-2px);
}

.clear-filters-btn {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.clear-filters-btn:hover:not(:disabled) {
  background-color: #e9ecef;
  color: #dc3545;
}

.clear-filters-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* بخش فیلترهای پیشرفته */
.advanced-filters-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #e9ecef;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.advanced-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
}

.filter-input {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}

/* بازه مبلغ */
.amount-range-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.amount-input {
  width: 120px;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
}

.amount-separator {
  color: #6c757d;
  font-size: 0.9rem;
}

.amount-currency {
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-top: 20px;
}

.empty-icon {
  font-size: 4rem;
  color: #adb5bd;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #495057;
  margin-bottom: 10px;
  font-size: 1.5rem;
}

.empty-state p {
  color: #6c757d;
  margin: 0;
  font-size: 1rem;
}

/* ستون‌های سفارشی */
.customer-cell {
  direction: ltr;
  text-align: center;
}

.phone-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #2c3e50;
  background-color: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  text-decoration: none;
  transition: background-color 0.2s;
}

.phone-number:hover {
  background-color: #e9ecef;
}

.status-badge {
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  min-width: 120px;
}

.status-pending {
  background-color: #cce5ff;
  color: #004085;
  border: 1px solid #b8daff;
}

.status-prep {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-send {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-deliver {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-cancel {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.delivery-badge {
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  min-width: 140px;
}

.delivery-takeoutN {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.delivery-takeoutP {
  background-color: #e2f3f5;
  color: #0c5460;
  border: 1px solid #d1ecf1;
}

.delivery-dine-in {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.delivery-delivery {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.price-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.total-price {
  font-weight: 700;
  color: #2c3e50;
  font-size: 0.95rem;
}

.net-price {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.discount-badge {
  background-color: #ff6b6b;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-block;
  margin-top: 4px;
}

.items-cell {
  max-width: 180px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.85rem;
  border-bottom: 1px solid #f0f0f0;
}

.item-row:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 8px;
  color: #495057;
  text-align: right;
}

.item-quantity {
  color: #6c757d;
  font-weight: 600;
  font-size: 0.8rem;
  background-color: #f8f9fa;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.more-items {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 4px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-cell .date {
  font-size: 0.85rem;
  color: #495057;
  font-weight: 600;
}

.date-cell .time {
  font-size: 0.75rem;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

/* رسپانسیو */
@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .advanced-filters-grid {
    grid-template-columns: 1fr;
  }

  .amount-range-inputs {
    flex-direction: column;
    align-items: flex-start;
  }

  .amount-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .order-list-container {
    padding: 10px;
  }

  .filter-select,
  .filter-input {
    min-width: 100%;
  }

  .status-badge,
  .delivery-badge {
    min-width: 100px;
    font-size: 0.75rem;
  }
}
</style>