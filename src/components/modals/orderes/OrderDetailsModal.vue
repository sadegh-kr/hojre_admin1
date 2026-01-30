<template>
  <BaseModal
      v-model="isVisible"
      :title="modalTitle"
      :size="'lg'"
      :modal-class="['order-details-modal']"
      @close="onClose"
  >
    <!-- حالت لودینگ -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>در حال دریافت جزئیات سفارش...</p>
    </div>

    <!-- حالت خطا -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h4>خطا در دریافت اطلاعات</h4>
      <p>{{ error }}</p>
      <button @click="fetchOrderDetails" class="retry-btn">
        تلاش مجدد
      </button>
    </div>

    <!-- حالت موفق -->
    <div v-else-if="order" class="order-details-content">
      <!-- اطلاعات سفارش -->
      <div class="order-info-section">
        <h4>📋 اطلاعات سفارش</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">شماره سفارش:</span>
            <span class="info-value order-number">{{ order.order_number || order.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">تاریخ ثبت:</span>
            <span class="info-value">
              {{ formatDate(order.created) }} - {{ formatTime(order.created) }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">وضعیت:</span>
            <div class="status-control">
              <select
                  v-model="selectedStatus"
                  @change="updateOrderStatus"
                  class="status-select"
                  :disabled="statusUpdating"
              >
                <option value="pending">در انتظار تایید</option>
                <option value="prep">در حال آماده‌سازی</option>
                <option value="send">در حال ارسال</option>
                <option value="deliver">تحویل داده شده</option>
                <option value="cancel">لغو شده</option>
              </select>
              <div v-if="statusUpdating" class="status-updating">
                در حال بروزرسانی...
              </div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-label">نوع تحویل:</span>
            <span :class="`delivery-badge delivery-${order.delivery}`">
              {{ order.delivery_fa }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">مبلغ کل:</span>
            <span class="info-value price">{{ order.total_cost }} تومان</span>
          </div>
          <div class="info-item">
            <span class="info-label">مبلغ خالص:</span>
            <span class="info-value price">{{ order.net_cost }} تومان</span>
          </div>
          <div v-if="order.discount_percent" class="info-item">
            <span class="info-label">تخفیف:</span>
            <span class="info-value discount">{{ order.discount_percent }}%</span>
          </div>
          <div v-if="order.deliver_time" class="info-item">
            <span class="info-label">زمان تحویل:</span>
            <span class="info-value">{{ order.deliver_time.name }} ({{ order.deliver_time.description }})</span>
          </div>
          <div v-if="order.note" class="info-item full-width">
            <span class="info-label">یادداشت:</span>
            <span class="info-value note">{{ order.note }}</span>
          </div>
        </div>
      </div>

      <!-- اطلاعات مشتری -->
      <div class="customer-info-section">
        <h4>👤 اطلاعات مشتری</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">شماره تماس:</span>
            <a :href="`tel:${order.customer_phone}`" class="info-value phone-link">
              {{ order.customer_phone }}
            </a>
          </div>
          <div class="info-item">
            <span class="info-label">نام:</span>
            <span class="info-value">{{ order.customer?.name || 'ثبت نشده' }}</span>
          </div>
        </div>
      </div>

      <!-- آدرس -->
      <div v-if="order.address" class="address-section">
        <h4>📍 آدرس</h4>
        <div class="info-grid">
          <div class="info-item full-width">
            <span class="info-label">نام آدرس:</span>
            <span class="info-value">{{ order.address.name || 'بدون نام' }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">جزئیات آدرس:</span>
            <span class="info-value">{{ order.address.detail || 'ثبت نشده' }}</span>
          </div>
          <div v-if="order.address.location?.latitude" class="info-item">
            <span class="info-label">موقعیت جغرافیایی:</span>
            <span class="info-value location">
              {{ order.address.location.latitude.toFixed(6) }}, {{ order.address.location.longitude.toFixed(6) }}
              <button @click="openMap" class="map-btn">
                📍 مشاهده در نقشه
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- آیتم‌های سفارش -->
      <div class="items-section">
        <h4>🛒 آیتم‌های سفارش ({{ order.items.length }})</h4>
        <div class="items-table">
          <div class="table-header">
            <div class="col name">نام آیتم</div>
            <div class="col quantity">تعداد</div>
            <div class="col price">قیمت واحد</div>
            <div class="col total">قیمت کل</div>
          </div>
          <div class="table-body">
            <div v-for="(item, index) in order.items" :key="index" class="table-row">
              <div class="col name">{{ item.item?.name || item.name || 'آیتم حذف شده' }}</div>
              <div class="col quantity">{{ item.quantity }} عدد</div>
              <div class="col price">{{ formatPrice(item.item?.price || item.price || 0) }}</div>
              <div class="col total">{{ formatPrice((item.item?.price || item.price || 0) * item.quantity) }}</div>
            </div>
          </div>
          <div class="table-footer">
            <div class="summary">
              <div class="summary-row">
                <span>جمع کل:</span>
                <span class="total-amount">{{ formatPrice(order.total_cost) }} تومان</span>
              </div>
              <div v-if="order.discount_percent" class="summary-row discount">
                <span>تخفیف ({{ order.discount_percent }}%):</span>
                <span>{{ formatPrice(order.total_cost - order.net_cost) }} تومان</span>
              </div>
              <div class="summary-row net">
                <span>مبلغ قابل پرداخت:</span>
                <span class="net-amount">{{ formatPrice(order.net_cost) }} تومان</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- اسلات فوتر -->
    <template #footer>
      <div class="modal-actions">
        <button @click="printInvoice" class="action-btn print-btn" :disabled="loading || statusUpdating">
          🖨️ چاپ فاکتور
        </button>
        <button
            v-if="order?.address?.location?.latitude"
            @click="openMap"
            class="action-btn map-btn"
            :disabled="loading || statusUpdating"
        >
          📍 بازکردن نقشه
        </button>
        <button @click="close" class="action-btn close-btn" :disabled="loading || statusUpdating">
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

const props = defineProps({
  orderId: {
    type: String,
    default: null
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits([
  'update:modelValue',
  'close',
  'print',
  'open-map',
  'status-updated'
]);

// Reactive state
const isVisible = ref(props.modelValue);
const order = ref(props.initialData);
const loading = ref(false);
const error = ref(null);
const selectedStatus = ref('');
const statusUpdating = ref(false);

// عنوان مودال
const modalTitle = computed(() => {
  if (!order.value) return 'جزئیات سفارش';
  return `جزئیات سفارش #${order.value.order_number || order.value.id}`;
});

// فرمت قیمت
const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

// فرمت تاریخ
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// فرمت زمان
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// تابع برای تبدیل کد وضعیت به نام فارسی
const getStatusFaName = (statusCode) => {
  const statusMap = {
    'pending': 'در انتظار تایید',
    'prep': 'در حال آماده‌سازی',
    'send': 'در حال ارسال',
    'deliver': 'تحویل داده شده',
    'cancel': 'لغو شده'
  };
  return statusMap[statusCode] || statusCode;
};

// پردازش داده‌های سفارش
const processOrderData = (orderData) => {
  // ذخیره وضعیت فعلی برای select
  selectedStatus.value = orderData.status;

  // تبدیل وضعیت به فارسی
  let status_fa = getStatusFaName(orderData.status);

  // تبدیل نوع تحویل به فارسی
  let delivery_fa = '';
  switch(orderData.delivery) {
    case 'takeoutN':
      delivery_fa = 'تحویل حضوری (آنی)';
      break;
    case 'takeoutP':
      delivery_fa = 'تحویل حضوری (پیش‌سفارش)';
      break;
    case 'dine-in':
      delivery_fa = 'مصرف در محل';
      break;
    case 'delivery':
      delivery_fa = 'ارسال به آدرس';
      break;
    default:
      delivery_fa = orderData.delivery;
  }

  // استخراج شماره تلفن مشتری
  const customer_phone = orderData.customer?.phone_number || 'نامشخص';

  return {
    ...orderData,
    customer_phone,
    status_fa,
    delivery_fa,
    discount_percent: orderData.discount?.percent || null
  };
};

// دریافت جزئیات سفارش از API
const fetchOrderDetails = async () => {
  if (!props.orderId) {
    error.value = 'شناسه سفارش مشخص نیست';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await OrderApi.getOrder(props.orderId);
    order.value = processOrderData(response.data);
  } catch (err) {
    console.error('خطا در دریافت جزئیات سفارش:', err);
    error.value = err.response?.data?.message || 'خطا در دریافت اطلاعات سفارش';
    order.value = null;
  } finally {
    loading.value = false;
  }
};

// آپدیت وضعیت سفارش
const updateOrderStatus = async () => {
  console.log('شروع آپدیت وضعیت...');
  console.log('orderId:', props.orderId);
  console.log('selectedStatus:', selectedStatus.value);
  console.log('order.status فعلی:', order.value?.status);

  if (!props.orderId || !selectedStatus.value) {
    console.log('❌ orderId یا selectedStatus نامعتبر');
    return;
  }

  if (selectedStatus.value === order.value?.status) {
    console.log('⚠️ وضعیت تغییر نکرده');
    return;
  }

  console.log('statusUpdating = true');
  statusUpdating.value = true;

  try {
    console.log('ارسال درخواست به API...');
    const data = {
      status: selectedStatus.value
    };

    const response = await OrderApi.updateOrderStatus(props.orderId, data);
    console.log('✅ پاسخ API:', response);
    console.log('داده‌های بازگشتی:', response.data);

    // ⚠️ مشکل اینجا است: پاسخ API فقط پیام است، نه کل داده‌های سفارش
    // ما باید دوباره داده‌های کامل سفارش را بگیریم

    // 1. ابتدا وضعیت select را آپدیت کنیم
    selectedStatus.value = response.data.status; // این خط مهم است!

    // 2. اگر order.value داریم، وضعیت آن را آپدیت کنیم
    if (order.value) {
      order.value.status = response.data.status;
      order.value.status_fa = getStatusFaName(response.data.status);
    }

    // 3. یا اگر می‌خواهیم داده‌های کامل را دوباره بگیریم:
    // await fetchOrderDetails(); // این خط را فعال کنید

    console.log('✅ وضعیت آپدیت شد');
    console.log('order.value جدید:', order.value);

    // ارسال event به parent
    emit('status-updated', {
      orderId: props.orderId,
      newStatus: selectedStatus.value,
      order: order.value
    });

    // نمایش پیام موفقیت
    const statusName = getStatusFaName(selectedStatus.value);
    alert(`✅ وضعیت سفارش با موفقیت به "${statusName}" تغییر یافت.`);

  } catch (err) {
    console.error('❌ خطا در بروزرسانی وضعیت:', err);
    console.error('داده خطا:', err.response?.data);
    console.error('کد وضعیت:', err.response?.status);

    // بازگشت به وضعیت قبلی
    selectedStatus.value = order.value?.status || '';

    const errorMessage = err.response?.data?.message ||
        err.response?.data?.status?.[0] ||
        err.message ||
        'خطا در بروزرسانی وضعیت سفارش';

    alert(`❌ خطا: ${errorMessage}`);

  } finally {
    console.log('statusUpdating = false');
    statusUpdating.value = false;
  }
};
// باز کردن نقشه
const openMap = () => {
  if (!order.value?.address?.location?.latitude) return;

  const lat = order.value.address.location.latitude;
  const lng = order.value.address.location.longitude;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=fa`;

  window.open(mapsUrl, '_blank');
  emit('open-map', order.value);
};

// چاپ فاکتور
const printInvoice = () => {
  if (!order.value) return;
  emit('print', order.value);
};

// بستن مودال
const close = () => {
  isVisible.value = false;
  emit('update:modelValue', false);
  emit('close');
};

const onClose = () => {
  // Reset state when modal closes
  setTimeout(() => {
    order.value = null;
    error.value = null;
    loading.value = false;
    selectedStatus.value = '';
    statusUpdating.value = false;
  }, 300);
};

// واچر برای تغییر orderId
watch(() => props.orderId, (newOrderId) => {
  if (newOrderId && isVisible.value) {
    fetchOrderDetails();
  }
});

// واچر برای تغییر modelValue
watch(() => props.modelValue, (newVal) => {
  isVisible.value = newVal;
  if (newVal && props.orderId) {
    // اگر initialData داریم، از آن استفاده می‌کنیم
    if (props.initialData) {
      order.value = processOrderData(props.initialData);
    } else {
      fetchOrderDetails();
    }
  }
});

// واچر برای isVisible
watch(isVisible, (newVal) => {
  if (!newVal && props.modelValue) {
    emit('update:modelValue', false);
  }
});

// تعریف متدهای عمومی
defineExpose({
  open: () => {
    isVisible.value = true;
    if (props.orderId) {
      fetchOrderDetails();
    }
  },
  close,
  fetchOrderDetails,
  updateOrderStatus: (status) => {
    selectedStatus.value = status;
    return updateOrderStatus();
  }
});
</script>

<style scoped>
.order-details-content {
  padding: 4px;
}

/* حالت لودینگ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #6c757d;
  margin: 0;
}

/* حالت خطا */
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-state .error-icon {
  font-size: 3rem;
  color: #ff6b6b;
  margin-bottom: 16px;
}

.error-state h4 {
  color: #721c24;
  margin-bottom: 8px;
}

.error-state p {
  color: #6c757d;
  margin-bottom: 20px;
}

.retry-btn {
  background: #4dabf7;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.retry-btn:hover {
  background: #339af0;
}

/* بخش‌های اطلاعات */
.order-info-section,
.customer-info-section,
.address-section,
.items-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.order-info-section:last-child,
.customer-info-section:last-child,
.address-section:last-child,
.items-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

h4 {
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* گرید اطلاعات */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 500;
  word-break: break-word;
}

.info-value.order-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #2c3e50;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.info-value.price {
  font-family: 'B Nazanin', Tahoma, Arial;
  direction: ltr;
  text-align: left;
}

.info-value.discount {
  color: #20c997;
  font-weight: 600;
}

.info-value.note {
  background: #fff3cd;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.phone-link {
  color: #1971c2;
  text-decoration: none;
  font-family: 'Courier New', monospace;
}

.phone-link:hover {
  text-decoration: underline;
}

.location {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.map-btn {
  background: #51cf66;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.map-btn:hover {
  background: #40c057;
}

/* جدول آیتم‌ها */
.items-table {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.table-body {
  background: white;
}

.table-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.col {
  padding: 0 8px;
}

.col.name {
  font-weight: 500;
  color: #495057;
}

.col.quantity {
  text-align: center;
  color: #6c757d;
}

.col.price,
.col.total {
  text-align: left;
  font-family: 'B Nazanin', Tahoma, Arial;
  direction: ltr;
  color: #2c3e50;
  font-weight: 500;
}

.table-footer {
  background: #f8f9fa;
  padding: 16px;
  border-top: 1px solid #e9ecef;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.summary-row.discount {
  color: #20c997;
}

.summary-row.net {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
  border-top: 2px solid #e9ecef;
  padding-top: 12px;
  margin-top: 4px;
}

.net-amount {
  color: #1971c2;
  font-size: 1.2rem;
}

/* کنترل وضعیت */
.status-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-select {
  padding: 6px 12px;
  border: 2px solid #4dabf7;
  border-radius: 6px;
  background-color: white;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
  min-width: 180px;
  transition: all 0.2s ease;
}

.status-select:focus {
  outline: none;
  border-color: #339af0;
  box-shadow: 0 0 0 3px rgba(51, 154, 240, 0.1);
}

.status-select:disabled {
  background-color: #f8f9fa;
  border-color: #adb5bd;
  cursor: not-allowed;
  opacity: 0.7;
}

.status-select:hover:not(:disabled) {
  border-color: #339af0;
}

.status-updating {
  font-size: 0.8rem;
  color: #6c757d;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

/* گزینه‌های select */
.status-select option {
  padding: 8px;
}

.status-select option[value="pending"] {
  color: #004085;
  background: #cce5ff;
}

.status-select option[value="prep"] {
  color: #856404;
  background: #fff3cd;
}

.status-select option[value="send"] {
  color: #0c5460;
  background: #d1ecf1;
}

.status-select option[value="deliver"] {
  color: #155724;
  background: #d4edda;
}

.status-select option[value="cancel"] {
  color: #721c24;
  background: #f8d7da;
}

/* دکمه‌های وضعیت */
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  min-width: 120px;
}

.status-prep {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-deliver {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-pending {
  background-color: #cce5ff;
  color: #004085;
  border: 1px solid #b8daff;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.delivery-badge {
  padding: 6px 12px;
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

/* دکمه‌های اقدام */
.modal-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.print-btn {
  background-color: #20c997;
  color: white;
}

.print-btn:hover:not(:disabled) {
  background-color: #1ba87e;
}

.map-btn {
  background-color: #51cf66;
  color: white;
}

.map-btn:hover:not(:disabled) {
  background-color: #40c057;
}

.close-btn {
  background-color: #6c757d;
  color: white;
}

.close-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    font-size: 0.85rem;
    padding: 10px 12px;
  }

  .status-control {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .status-select {
    min-width: 100%;
  }

  .modal-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>