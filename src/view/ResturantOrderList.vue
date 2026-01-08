<template>
  <div class="order-list-container">
    <div class="page-header">
      <h2>لیست سفارشات</h2>
      <div class="header-actions">
        <button @click="fetchOrders()" class="refresh-btn" :disabled="isLoading">
          <span class="refresh-icon">🔄</span>
          بروزرسانی
        </button>
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
        :searchable="true"
        :search-fields="['customer_phone', 'status_fa', 'delivery_fa']"
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
        @search="handleSearch"
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
      <p>هنوز هیچ سفارشی برای این رستوران ثبت نشده است.</p>
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
import { ref, onMounted, reactive } from "vue";
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

// اطلاعات صفحه‌بندی
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  next: null,
  previous: null,
  totalPages: 0
});
console.log(pagination)
// اطلاعات جستجو و مرتب‌سازی
const filters = reactive({
  search: '',
  sortBy: '',
  sortOrder: 'asc'
});

// تعریف ستون‌های جدول
const tableColumns = ref([
  {
    key: 'order_number',
    title: 'شناسه سفارش',
    sortable: true,
    width: '180px'
  },
  {
    key: 'customer_phone',
    title: 'شماره مشتری',
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
    title: 'مبلغ کل',
    sortable: true,
    width: '140px',
    align: 'left'
  },
  {
    key: 'net_cost',
    title: 'مبلغ خالص',
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
    title: 'تاریخ ثبت',
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
    name: 'edit',
    label: 'ویرایش',
    class: 'edit-btn',
    icon: '✏️',
    title: 'ویرایش سفارش'
  },
  {
    name: 'print',
    label: 'چاپ',
    class: 'print-btn',
    icon: '🖨️',
    title: 'چاپ فاکتور'
  },
  {
    name: 'location',
    label: 'موقعیت',
    class: 'location-btn',
    icon: '📍',
    title: 'نمایش موقعیت روی نقشه',
    disabled: (row) => {
      // غیرفعال کردن اگر موقعیت موجود نباشد
      return !row.address?.location?.latitude || !row.address?.location?.longitude;
    }
  },
]);
// تابع باز کردن موقعیت در Google Maps
const openGoogleMaps = (row) => {
  const address = row.address;

  // بررسی اینکه آیا مختصات وجود دارد
  if (!address?.location?.latitude || !address?.location?.longitude) {
    alert('موقعیت جغرافیایی برای این آدرس موجود نیست.');
    return;
  }

  const lat = address.location.latitude;
  const lng = address.location.longitude;

  // ایجاد لینک Google Maps
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=fa`;

  // باز کردن در تب جدید
  window.open(mapsUrl, '_blank');
};
// تابع تبدیل داده‌های انگلیسی به فارسی
const processOrdersData = (ordersData) => {
  return ordersData.map(order => {
    // تبدیل وضعیت به فارسی
    let status_fa = '';
    switch(order.status) {
      case 'prep':
        status_fa = 'در حال آماده‌سازی';
        break;
      case 'deliver':
        status_fa = 'تحویل داده شده';
        break;
      case 'pending':
        status_fa = 'در انتظار';
        break;
      case 'cancelled':
        status_fa = 'لغو شده';
        break;
      default:
        status_fa = order.status;
    }

    // تبدیل نوع تحویل به فارسی
    let delivery_fa = '';
    switch(order.delivery) {
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
        delivery_fa = order.delivery;
    }

    // فرمت قیمت‌ها
    const formatPrice = (price) => {
      return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    // پردازش آیتم‌ها
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
// تابع اصلی دریافت سفارش‌ها
const fetchOrders = async (page = 1, pageSize = pagination.pageSize) => {
  isLoading.value = true;
  try {
    const params = {
      page: page,
      page_size: pageSize
    };

    // اضافه کردن فیلتر جستجو
    if (filters.search) {
      params.search = filters.search;
    }

    // اضافه کردن مرتب‌سازی
    if (filters.sortBy) {
      params.ordering = filters.sortOrder === 'desc' ? `-${filters.sortBy}` : filters.sortBy;
    }

    const response = await OrderApi.getOrdersByRestaurant(restaurantId, params);
    const data = response.data;

    orders.value = processOrdersData(data.results || []);

    // بروزرسانی اطلاعات صفحه‌بندی
    pagination.currentPage = data.page || page;
    pagination.pageSize = data.page_size || pageSize;
    pagination.total = data.count || 0;
    pagination.totalPages = data.total_pages || Math.ceil(pagination.total / pageSize);
    pagination.next = data.next || null;
    pagination.previous = data.previous || null;

  } catch (error) {
    console.error("خطا در دریافت سفارش‌ها:", error);
    orders.value = [];

    // ریست کردن صفحه‌بندی
    pagination.currentPage = 1;
    pagination.total = 0;
    pagination.totalPages = 0;
    pagination.next = null;
    pagination.previous = null;

    alert('خطا در دریافت اطلاعات سفارش‌ها. لطفاً مجدداً تلاش کنید.');
  } finally {
    isLoading.value = false;
  }
};
// تابع دریافت صفحه بعدی
const fetchNextPage = async () => {
  if (pagination.next) {
    isLoading.value = true;
    try {
      const response = await OrderApi.getOrdersByPage(pagination.next);
      const data = response.data;

      orders.value = processOrdersData(data.results || []);

      pagination.currentPage += 1;
      pagination.next = data.next;
      pagination.previous = data.previous;

    } catch (error) {
      console.error("خطا در دریافت صفحه بعدی:", error);
    } finally {
      isLoading.value = false;
    }
  }
};

// تابع دریافت صفحه قبلی
const fetchPreviousPage = async () => {
  if (pagination.previous) {
    isLoading.value = true;
    try {
      const response = await OrderApi.getOrdersByPage(pagination.previous);
      const data = response.data;

      orders.value = processOrdersData(data.results || []);

      pagination.currentPage -= 1;
      pagination.next = data.next;
      pagination.previous = data.previous;

    } catch (error) {
      console.error("خطا در دریافت صفحه قبلی:", error);
    } finally {
      isLoading.value = false;
    }
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

const openOrderModal = (orderId) => {
  selectedOrderId.value = orderId;
  showOrderModal.value = true;
};

// هندلر چاپ از مودال
const handlePrintFromModal = (order) => {
  printInvoice(order);
};

// هندلر نقشه از مودال
const handleOpenMapFromModal = (order) => {
  openGoogleMaps(order);
};
const handleTableAction = ({ action, row }) => {
  console.log('عملیات:', action, 'سفارش:', row);

  switch(action) {
    case 'view':
      openOrderModal(row.id); // تغییر اینجا
      break;
    case 'edit':
      editOrder(row);
      break;
    case 'location':
      openGoogleMaps(row);
      break;
    case 'print':
      printInvoice(row);
      break;
  }
};

const handleSearch = (query) => {
  filters.search = query;
  // جستجوی سمت سرور با تأخیر
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchOrders(1, pagination.pageSize);
  }, 500);
};

const handleSort = ({ column, order }) => {
  filters.sortBy = column;
  filters.sortOrder = order;
  fetchOrders(1, pagination.pageSize);
};

const handlePageChange = ({ page, pageSize }) => {
  // فقط اگر صفحه یا اندازه صفحه تغییر کرده
  if (page !== pagination.currentPage || pageSize !== pagination.pageSize) {
    fetchOrders(page, pageSize);
  }
};

const handlePageSizeChange = (newPageSize) => {
  // اگر اندازه صفحه تغییر کرده
  if (newPageSize !== pagination.pageSize) {
    pagination.pageSize = newPageSize;
    fetchOrders(1, newPageSize); // همیشه به صفحه اول برو
  }
};

// متغیر برای تأخیر جستجو
let searchTimeout = null;

// توابع نمونه برای عملیات
const viewOrderDetails = (order) => {
  const itemsList = order.items.map(item =>
      `‫${item.name} - ${item.quantity} عدد - ${new Intl.NumberFormat('fa-IR').format(item.price)} تومان`
  ).join('\n');

  const message = `
    سفارش شماره: ${order.id}
    مشتری: ${order.customer.phone_number}
    وضعیت: ${order.status_fa}
    نوع تحویل: ${order.delivery_fa}
    مبلغ کل: ${order.total_cost_fa}
    مبلغ خالص: ${order.net_cost_fa}
    تاریخ ثبت: ${formatDate(order.created)}

    آیتم‌های سفارش:
    ${itemsList}
  `;

  alert(message);
};

const editOrder = (order) => {
  const newStatus = prompt(
      `ویرایش وضعیت سفارش ${order.id}\n` +
      `وضعیت فعلی: ${order.status_fa}\n` +
      `وضعیت‌های ممکن:\n` +
      `1. در حال آماده‌سازی\n` +
      `2. تحویل داده شده\n` +
      `3. در انتظار\n` +
      `4. لغو شده\n\n` +
      `وضعیت جدید را وارد کنید:`,
      order.status_fa
  );

  if (newStatus) {
    console.log(`آپدیت سفارش ${order.id} به وضعیت: ${newStatus}`);
    alert(`وضعیت سفارش ${order.id} به "${newStatus}" تغییر یافت.`);

    // بروزرسانی لیست
    fetchOrders(pagination.currentPage, pagination.pageSize);
  }
};

const printInvoice = (order) => {
  console.log('چاپ فاکتور سفارش:', order.id);

  // شبیه‌سازی چاپ فاکتور
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html dir="rtl">
      <head>
        <title>فاکتور سفارش ${order.id}</title>
        <style>
          body { font-family: 'B Nazanin', Tahoma, Arial; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { width: 150px; font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #333; padding: 8px; text-align: center; }
          .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>فاکتور سفارش</h1>

        <div class="header">
          <div class="info-row">
            <span class="info-label">شماره سفارش:</span>
            <span>${order.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاریخ ثبت:</span>
            <span>${formatDate(order.created)}</span>
          </div>
        </div>

        <div class="info">
          <div class="info-row">
            <span class="info-label">شماره مشتری:</span>
            <a href="tel:${order.customer.customer_phone}">${order.customer.customer_phone}</a>
          </div>
          <div class="info-row">
            <span class="info-label">وضعیت:</span>
            <span>${order.status_fa}</span>
          </div>
          <div class="info-row">
            <span class="info-label">نوع تحویل:</span>
            <span>${order.delivery_fa}</span>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>ردیف</th>
              <th>نام آیتم</th>
              <th>تعداد</th>
              <th>قیمت واحد</th>
              <th>قیمت کل</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${new Intl.NumberFormat('fa-IR').format(item.price)} تومان</td>
                <td>${new Intl.NumberFormat('fa-IR').format(item.price * item.quantity)} تومان</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          <div>مبلغ کل: ${order.total_cost_fa}</div>
          <div>مبلغ خالص: ${order.net_cost_fa}</div>
          ${order.discount_percent ? `<div>تخفیف: ${order.discount_percent}%</div>` : ''}
        </div>

        <div class="footer">
          <p>با تشکر از خرید شما</p>
          <p>رستوران شماره: ${restaurantId}</p>
          <p>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</p>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
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
  gap: 12px;
}

.refresh-btn {
  background-color: #4dabf7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #339af0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(51, 154, 240, 0.3);
}

.refresh-btn:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.1rem;
}

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

/* استایل‌های سفارشی برای سلول‌های جدول */
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
}

.status-badge {
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  min-width: 120px;
  letter-spacing: -0.5px;
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
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  min-width: 140px;
  letter-spacing: -0.5px;
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
  font-family: 'B Nazanin', Tahoma, Arial;
}

.net-price {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
  font-family: 'B Nazanin', Tahoma, Arial;
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
  align-items: center;
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

/* استایل دکمه‌های عملیات */
.view-btn {
  background-color: #4dabf7;
  color: white;
  border: none;
}

.view-btn:hover {
  background-color: #339af0;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
  border: none;
}

.edit-btn:hover {
  background-color: #e0a800;
}

.print-btn {
  background-color: #20c997;
  color: white;
  border: none;
}

.print-btn:hover {
  background-color: #1ba87e;
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .order-list-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-header h2 {
    font-size: 1.3rem;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .loading-container {
    padding: 40px 10px;
  }

  .empty-state {
    padding: 40px 15px;
  }

  .empty-icon {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 1.2rem;
  }

  .refresh-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  .status-badge,
  .delivery-badge {
    min-width: 100px;
    padding: 6px 10px;
    font-size: 0.75rem;
  }
}
.view-btn {
  background-color: #4dabf7;
  color: white;
  border: none;
}

.view-btn:hover {
  background-color: #339af0;
}

.location-btn {
  background-color: #51cf66;
  color: white;
  border: none;
}

.location-btn:hover {
  background-color: #40c057;
}

.location-btn:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
  opacity: 0.5;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
  border: none;
}

.edit-btn:hover {
  background-color: #e0a800;
}

.print-btn {
  background-color: #20c997;
  color: white;
  border: none;
}

.print-btn:hover {
  background-color: #1ba87e;
}
</style>