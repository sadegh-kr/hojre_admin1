<template>
  <BaseModal
      v-model="isVisible"
      :title="modalTitle"
      :size="'full'"
      :modal-class="['user-orders-modal', 'wide-modal']"
      @close="onClose"
  >
    <!-- حالت لودینگ -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>در حال دریافت لیست سفارشات...</p>
    </div>

    <!-- حالت خطا -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h4>خطا در دریافت سفارشات</h4>
      <p>{{ error }}</p>
      <button @click="fetchOrders" class="retry-btn">
        تلاش مجدد
      </button>
    </div>

    <!-- حالت موفق -->
    <div v-else class="orders-content">
      <!-- هدر و اطلاعات کاربر -->
      <div v-if="userInfo" class="user-info-header">
        <div class="user-info-avatar">
          <span class="avatar-text">{{ userInitials }}</span>
        </div>
        <div class="user-info-details">
          <h3>{{ userInfo.name || 'کاربر' }}</h3>
          <div class="user-meta">
            <span class="meta-item">
              <span class="meta-icon">📱</span>
              {{ userInfo.phone_number }}
            </span>
            <span class="meta-item" v-if="userInfo.code">
              <span class="meta-icon">🎫</span>
              کد: {{ userInfo.code }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">🏪</span>
              {{ userInfo.restaurant_name }}
            </span>
          </div>
        </div>
        <div class="orders-stats">
          <div class="stat-badge">
            <span class="stat-number">{{ paginationData.count || totalOrders }}</span>
            <span class="stat-label">کل سفارشات</span>
          </div>
          <div class="stat-badge">
            <span class="stat-number">{{ formatPrice(totalSpent) }}</span>
            <span class="stat-label">مجموع خرید</span>
          </div>
        </div>
      </div>

      <!-- فیلترها و جستجو -->
      <div class="orders-filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجو در سفارشات..."
              class="search-input"
          >
        </div>

        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select">
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="prep">در حال آماده‌سازی</option>
            <option value="deliver">تحویل شده</option>
          </select>

          <select v-model="dateFilter" class="filter-select">
            <option value="all">همه زمان‌ها</option>
            <option value="today">امروز</option>
            <option value="week">این هفته</option>
            <option value="month">این ماه</option>
            <option value="year">امسال</option>
          </select>
        </div>
      </div>

      <!-- لیست سفارشات -->
      <div v-if="orders.length === 0" class="no-orders">
        <div class="no-orders-icon">🛒</div>
        <h4>هیچ سفارشی یافت نشد</h4>
        <p>این کاربر تاکنون سفارشی ثبت نکرده است</p>
      </div>

      <div v-else class="orders-list">
        <div
            v-for="order in orders"
            :key="order.id"
            class="order-card"
            :class="`order-status-${order.status}`"
        >
          <!-- هدر کارت سفارش -->
          <div class="order-card-header">
            <div class="order-info">
              <div class="order-id">
                <span class="id-label">🆔</span>
                <span class="id-value">#{{ order.order_number }}</span>
              </div>
              <div class="order-date">
                <span class="date-icon">📅</span>
                <span class="date-value">{{ formatDate(order.created) }}</span>
                <span class="time-value">{{ formatTime(order.created) }}</span>
              </div>
            </div>
            <div class="order-status">
              <span :class="`status-badge status-${order.status}`">
                {{ getOrderStatusText(order.status) }}
              </span>
            </div>
          </div>

          <!-- محتوای سفارش -->
          <div class="order-card-body">
            <div class="order-items">
              <div class="items-header">
                <span class="items-count">{{ getItemCount(order) }} قلم</span>
                <button @click="toggleOrderItems(order)" class="toggle-items-btn">
                  {{ expandedOrders[order.id] ? '📖 بستن' : '📋 مشاهده اقلام' }}
                </button>
              </div>

              <!-- لیست اقلام سفارش (expandable) -->
              <div v-if="expandedOrders[order.id]" class="items-list">
                <div v-for="item in order.items" :key="item.id" class="order-item">
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                  </div>
                  <div class="item-details">
                    <span class="item-quantity">{{ item.quantity }}×</span>
                    <span class="item-price">{{ formatPrice(item.price) }}</span>
                    <span class="item-total">{{ formatPrice(item.quantity * item.price) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="order-divider"></div>

            <!-- اطلاعات تکمیلی -->
            <div class="order-details">
              <div class="detail-row">
                <div class="detail-item">
                  <span class="detail-icon">📍</span>
                  <span class="detail-label">نوع تحویل:</span>
                  <span class="detail-value">{{ getDeliveryTypeText(order.delivery) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">📞</span>
                  <span class="detail-label">شماره مشتری:</span>
                  <span class="detail-value">{{ order.customer_phone }}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-item">
                  <span class="detail-icon">💰</span>
                  <span class="detail-label">هزینه خالص:</span>
                  <span class="detail-value">{{ formatPrice(order.net_cost) }}</span>
                </div>
                <div class="detail-item" v-if="order.discount_percent">
                  <span class="detail-icon">🎁</span>
                  <span class="detail-label">تخفیف:</span>
                  <span class="detail-value">{{ order.discount_percent }}%</span>
                </div>
              </div>
            </div>

            <!-- فوتر کارت -->
            <div class="order-card-footer">
              <div class="order-total">
                <span class="total-label">مبلغ کل:</span>
                <span class="total-amount">{{ formatPrice(order.total_cost) }}</span>
                <span class="total-currency">تومان</span>
              </div>

              <div class="order-actions">
                <button @click="viewOrderDetails(order)" class="action-btn view-btn">
                  <span class="btn-icon">👁️</span>
                  <span>جزئیات</span>
                </button>
                <button @click="repeatOrder(order)" class="action-btn repeat-btn">
                  <span class="btn-icon">🔄</span>
                  <span>تکرار</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- صفحه‌بندی سرورساید -->
        <div v-if="paginationData.total_pages > 1" class="pagination">
          <button
              @click="changePage(currentPage - 1)"
              :disabled="!paginationData.has_previous"
              class="pagination-btn"
          >
            ←
          </button>

          <div class="pagination-info">
            صفحه {{ paginationData.page }} از {{ paginationData.total_pages }}
          </div>

          <button
              @click="changePage(currentPage + 1)"
              :disabled="!paginationData.has_next"
              class="pagination-btn"
          >
            →
          </button>
        </div>

        <!-- اطلاعات تعداد نمایش -->
        <div class="pagination-stats" v-if="orders.length > 0">
          نمایش {{ orders.length }} از {{ paginationData.count }} سفارش
        </div>
      </div>
    </div>

    <!-- اسلات فوتر -->
    <template #footer>
      <div class="modal-footer-actions">
        <div class="total-summary">
          <span class="summary-label">جمع کل سفارشات:</span>
          <span class="summary-value">{{ formatPrice(totalSpent) }}</span>
          <span class="summary-currency">تومان</span>
        </div>
        <button @click="exportOrders" class="footer-btn export-btn">
          📥 خروجی اکسل
        </button>
        <button @click="close" class="footer-btn close-btn">
          بستن
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseModal from '../BaseModal.vue';
import OrderApi from '@/api/order.api.js';
import UserApi from '@/api/user.api.js';

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:modelValue',
  'close',
  'view-order',
  'repeat-order'
]);

// State
const isVisible = ref(props.modelValue);
const loading = ref(false);
const error = ref(null);
const orders = ref([]);
const userInfo = ref(null);
const expandedOrders = ref({});

// Pagination state - مطابق با ساختار API
const paginationData = ref({
  count: 0,
  page: 1,
  page_size: 10,
  total_pages: 0,
  has_next: false,
  has_previous: false
});

// Filters
const searchQuery = ref('');
const statusFilter = ref('all');
const dateFilter = ref('all');

// Current page
const currentPage = ref(1);

// Computed
const modalTitle = computed(() => {
  if (!userInfo.value) return '🛒 لیست سفارشات';
  return `🛒 سفارشات ${userInfo.value.name || 'کاربر'}`;
});

const userInitials = computed(() => {
  if (!userInfo.value?.name) return '👤';
  const names = userInfo.value.name.split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return names[0].substring(0, 2).toUpperCase();
});

const totalOrders = computed(() => orders.value.length);

const totalSpent = computed(() => {
  return orders.value.reduce((sum, order) => {
    return sum + (order.total_cost || 0);
  }, 0);
});

// Methods
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatPrice = (price) => {
  if (!price && price !== 0) return '۰';
  return new Intl.NumberFormat('fa-IR').format(price);
};

const getItemCount = (order) => {
  return order.items?.length || 0;
};

const toggleOrderItems = (order) => {
  expandedOrders.value[order.id] = !expandedOrders.value[order.id];
};

const getOrderStatusText = (status) => {
  const statusMap = {
    'pending': 'در انتظار',
    'prep': 'در حال آماده‌سازی',
    'deliver': 'تحویل شده'
  };
  return statusMap[status] || status;
};

const getDeliveryTypeText = (delivery) => {
  const deliveryMap = {
    'dine-in': 'سفارش حضوری',
    'takeoutP': 'تحویل در محل',
    'takeout': 'تحویل در محل'
  };
  return deliveryMap[delivery] || delivery;
};

// Fetch user info
const fetchUserInfo = async () => {
  try {
    const response = await UserApi.getCustomerDetail(props.userId);
    userInfo.value = response.data;
  } catch (err) {
    console.error('خطا در دریافت اطلاعات کاربر:', err);
  }
};

// Fetch orders with server-side pagination
const fetchOrders = async (page = 1) => {
  if (!props.userId) {
    error.value = 'شناسه کاربر مشخص نیست';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // ارسال پارامترهای صفحه‌بندی به سرور
    const params = {
      page: page,
      page_size: 10
    };

    // اضافه کردن فیلترها در صورت نیاز
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }

    // TODO: اضافه کردن فیلتر تاریخ اگر API پشتیبانی می‌کند

    const response = await OrderApi.userOrderList(props.userId, { params });

    // ذخیره داده‌های صفحه‌بندی شده
    orders.value = response.data.results || [];

    // ذخیره اطلاعات صفحه‌بندی
    paginationData.value = {
      count: response.data.count || 0,
      page: response.data.page || page,
      page_size: response.data.page_size || 10,
      total_pages: response.data.total_pages || 0,
      has_next: response.data.has_next || false,
      has_previous: response.data.has_previous || false
    };

    currentPage.value = paginationData.value.page;

  } catch (err) {
    console.error('خطا در دریافت سفارشات:', err);
    error.value = err.response?.data?.message || 'خطا در دریافت لیست سفارشات';
    orders.value = [];
    paginationData.value = {
      count: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
      has_next: false,
      has_previous: false
    };
  } finally {
    loading.value = false;
  }
};

// Change page
const changePage = (page) => {
  if (page < 1 || page > paginationData.value.total_pages) return;
  fetchOrders(page);
};

// Actions
const viewOrderDetails = (order) => {
  emit('view-order', order);
};

const repeatOrder = (order) => {
  emit('repeat-order', order);
};

const exportOrders = async () => {
  try {
    // دریافت تمام سفارشات برای خروجی اکسل
    const response = await OrderApi.userOrderList(props.userId, {
      params: { page_size: paginationData.value.count || 100 }
    });

    const allOrders = response.data.results || [];

    const exportData = allOrders.map(order => ({
      'شماره سفارش': order.order_number,
      'تاریخ': formatDateTime(order.created),
      'وضعیت': getOrderStatusText(order.status),
      'نوع تحویل': getDeliveryTypeText(order.delivery),
      'مبلغ کل': formatPrice(order.total_cost),
      'مبلغ خالص': formatPrice(order.net_cost),
      'تعداد اقلام': order.items?.length || 0,
      'شماره مشتری': order.customer_phone
    }));

    const csv = convertToCSV(exportData);
    downloadCSV(csv, `orders-${props.userId}-${new Date().toISOString().split('T')[0]}.csv`);
  } catch (err) {
    console.error('خطا در خروجی اکسل:', err);
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return `${formatDate(dateStr)} ساعت ${formatTime(dateStr)}`;
};

const convertToCSV = (data) => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header]?.toString() || '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const close = () => {
  isVisible.value = false;
  emit('update:modelValue', false);
  emit('close');
};

const onClose = () => {
  setTimeout(() => {
    orders.value = [];
    userInfo.value = null;
    error.value = null;
    loading.value = false;
    searchQuery.value = '';
    statusFilter.value = 'all';
    dateFilter.value = 'all';
    currentPage.value = 1;
    expandedOrders.value = {};
    paginationData.value = {
      count: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
      has_next: false,
      has_previous: false
    };
  }, 300);
};

// Watchers
watch(() => props.userId, (newId) => {
  if (newId && isVisible.value) {
    fetchUserInfo();
    fetchOrders(1);
  }
});

watch(() => props.modelValue, (newVal) => {
  isVisible.value = newVal;
  if (newVal && props.userId) {
    fetchUserInfo();
    fetchOrders(1);
  }
});

watch(isVisible, (newVal) => {
  if (!newVal && props.modelValue) {
    emit('update:modelValue', false);
  }
});

// Watch for filter changes - reset to page 1 and fetch
watch([statusFilter, dateFilter], () => {
  if (isVisible.value && props.userId) {
    fetchOrders(1);
  }
});

// Expose methods
defineExpose({
  open: () => {
    isVisible.value = true;
    if (props.userId) {
      fetchUserInfo();
      fetchOrders(1);
    }
  },
  close,
  refresh: () => fetchOrders(currentPage.value)
});
</script>

<style scoped>
/* استایل برای عرض بیشتر مودال */
:deep(.wide-modal) {
  width: 90% !important;
  max-width: 1400px !important;
}

:deep(.modal-content) {
  width: 100%;
}

/* تنظیمات برای نمایش بهتر محتوا */
.orders-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 4px;
}

/* اطلاعات صفحه‌بندی */
.pagination-stats {
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #495057;
  font-size: 0.9rem;
}

.pagination-info {
  padding: 10px 20px;
  background: #f1f3f5;
  border-radius: 20px;
  font-size: 0.95rem;
  color: #495057;
}
</style>
<style scoped>
.orders-content {
  padding: 8px;
  max-height: 70vh;
  overflow-y: auto;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.loading-state .spinner {
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

/* User Info Header */
.user-info-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 20px;
  margin-bottom: 24px;
  border: 1px solid #e9ecef;
}

.user-info-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4dabf7, #1971c2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: white;
  font-size: 1.8rem;
  font-weight: bold;
}

.user-info-details {
  flex: 1;
}

.user-info-details h3 {
  margin: 0 0 8px 0;
  font-size: 1.4rem;
  color: #212529;
}

.user-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #495057;
  font-size: 0.9rem;
}

.meta-icon {
  font-size: 1rem;
}

.orders-stats {
  display: flex;
  gap: 20px;
}

.stat-badge {
  background: white;
  padding: 12px 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.stat-number {
  font-size: 1.6rem;
  font-weight: 700;
  color: #4dabf7;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: #868e96;
}

/* Filters */
.orders-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.search-box {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 0 16px;
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}

.search-icon {
  color: #adb5bd;
  font-size: 1.1rem;
}

.search-input {
  flex: 1;
  padding: 14px 12px;
  border: none;
  background: transparent;
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  background: white;
  font-size: 0.95rem;
  color: #495057;
  cursor: pointer;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.order-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  border-color: #4dabf7;
  transform: translateY(-2px);
}

/* Order Status Border */
.order-card.order-status-pending { border-right: 6px solid #ffd43b; }
.order-card.order-status-processing { border-right: 6px solid #4dabf7; }
.order-card.order-status-preparing { border-right: 6px solid #51cf66; }
.order-card.order-status-delivered { border-right: 6px solid #20c997; }
.order-card.order-status-cancelled { border-right: 6px solid #ff6b6b; }
.order-card.order-status-refunded { border-right: 6px solid #868e96; }

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.order-info {
  display: flex;
  gap: 24px;
  align-items: center;
}

.order-id {
  display: flex;
  align-items: center;
  gap: 6px;
}

.id-label {
  font-size: 1.1rem;
}

.id-value {
  font-family: var(--font-family-base);
  font-weight: 600;
  color: #212529;
  background: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid #dee2e6;
}

.order-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-size: 0.9rem;
}

.date-icon {
  font-size: 1rem;
}

.time-value {
  color: #868e96;
  font-size: 0.85rem;
}

.status-badge {
  padding: 8px 20px;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

.status-pending { background: #fff9db; color: #e67700; }
.status-processing { background: #e7f5ff; color: #1971c2; }
.status-preparing { background: #ebfbee; color: #2b8e3c; }
.status-delivered { background: #e6fcf5; color: #0ca678; }
.status-cancelled { background: #fff5f5; color: #c92a2a; }
.status-refunded { background: #f1f3f5; color: #495057; }

.order-card-body {
  padding: 20px;
}

/* Order Items */
.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.items-count {
  font-size: 0.9rem;
  color: #495057;
  background: #f1f3f5;
  padding: 4px 12px;
  border-radius: 20px;
}

.toggle-items-btn {
  background: none;
  border: 1px solid #4dabf7;
  color: #4dabf7;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-items-btn:hover {
  background: #4dabf7;
  color: white;
}

.items-list {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px dashed #dee2e6;
}

.order-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: 600;
  color: #212529;
}

.item-note {
  font-size: 0.8rem;
  color: #868e96;
}

.item-details {
  display: flex;
  align-items: center;
  gap: 16px;
  direction: ltr;
}

.item-quantity {
  color: #4dabf7;
  font-weight: 600;
}

.item-price {
  color: #868e96;
  font-size: 0.85rem;
}

.item-total {
  font-weight: 700;
  color: #212529;
}

.order-note {
  margin-top: 16px;
  padding: 12px;
  background: #fff9db;
  border-radius: 8px;
  border-right: 4px solid #ffd43b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-icon {
  font-size: 1rem;
}

.note-text {
  color: #e67700;
  font-size: 0.9rem;
}

.order-divider {
  height: 1px;
  background: #e9ecef;
  margin: 20px 0;
}

/* Order Details */
.order-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.detail-icon {
  font-size: 1rem;
  color: #4dabf7;
}

.detail-label {
  font-size: 0.85rem;
  color: #868e96;
}

.detail-value {
  font-size: 0.9rem;
  color: #212529;
  font-weight: 500;
}

/* Order Footer */
.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.payment-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.payment-pending { background: #fff9db; color: #e67700; }
.payment-paid { background: #ebfbee; color: #2b8e3c; }
.payment-failed { background: #fff5f5; color: #c92a2a; }
.payment-refunded { background: #f1f3f5; color: #495057; }

.payment-method {
  font-size: 0.85rem;
  color: #868e96;
}

.order-total {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-label {
  font-size: 0.9rem;
  color: #868e96;
}

.total-amount {
  font-size: 1.3rem;
  font-weight: 700;
  color: #4dabf7;
}

.total-currency {
  font-size: 0.8rem;
  color: #868e96;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn {
  background: #e7f5ff;
  color: #1971c2;
}

.view-btn:hover {
  background: #d0ebff;
}

.repeat-btn {
  background: #ebfbee;
  color: #2b8e3c;
}

.repeat-btn:hover {
  background: #d3f9d8;
}

.track-btn {
  background: #fff3bf;
  color: #e67700;
}

.track-btn:hover {
  background: #ffec99;
}

/* No Orders */
.no-orders {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 20px;
}

.no-orders-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.no-orders h4 {
  color: #212529;
  margin-bottom: 8px;
}

.no-orders p {
  color: #868e96;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.pagination-btn {
  padding: 10px 16px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #4dabf7;
  color: white;
  border-color: #4dabf7;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 8px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #f1f3f5;
}

.page-btn.active {
  background: #4dabf7;
  color: white;
  border-color: #4dabf7;
}

/* Modal Footer */
.modal-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
  gap: 16px;
}

.total-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  padding: 8px 20px;
  border-radius: 12px;
}

.summary-label {
  font-size: 0.9rem;
  color: #495057;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #4dabf7;
}

.summary-currency {
  font-size: 0.8rem;
  color: #868e96;
}

.footer-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-btn {
  background: #51cf66;
  color: white;
}

.export-btn:hover {
  background: #40c057;
}

.close-btn {
  background: #868e96;
  color: white;
}

.close-btn:hover {
  background: #6c757d;
}

/* Responsive */
@media (max-width: 768px) {
  .user-info-header {
    flex-direction: column;
    text-align: center;
  }

  .user-meta {
    justify-content: center;
  }

  .orders-stats {
    width: 100%;
    justify-content: center;
  }

  .orders-filters {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .filter-group {
    width: 100%;
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .order-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .order-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .order-card-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-actions {
    width: 100%;
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .modal-footer-actions {
    flex-direction: column;
  }

  .total-summary {
    width: 100%;
    justify-content: center;
  }

  .footer-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .order-details {
    gap: 8px;
  }

  .detail-row {
    flex-direction: column;
    gap: 8px;
  }

  .detail-item {
    width: 100%;
  }

  .order-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .item-details {
    width: 100%;
    justify-content: space-between;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>
