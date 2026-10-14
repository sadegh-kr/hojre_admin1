<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useRestaurantStore } from '@/store/restaurant.js'
import RestaurantAPI from '@/api/restaurant.api.js'

const router = useRouter()
const authStore = useAuthStore()
const restaurantContext = useRestaurantStore()
const restaurants = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const response = await RestaurantAPI.listBranch()
    restaurants.value = response.data.results
  } catch (err) {
    console.error('Error fetching restaurants:', err)
  } finally {
    loading.value = false
  }
})

const goToOrderList = (branch) => {
  restaurantContext.setActiveRestaurant(branch.restaurant)
  router.push(`/dashboard/restaurant/order-list/${branch.id}`)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>لیست رستوران‌ها</h1>
      <p>مدیریت رستوران‌های ثبت شده در سیستم</p>
    </div>

    <!-- آمار کلی -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">کل رستوران‌ها</div>
        <div class="stat-value">{{ restaurants.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">رستوران‌های فعال</div>
        <div class="stat-value active">{{ restaurants.filter(r => r.is_active).length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">رستوران‌های غیرفعال</div>
        <div class="stat-value inactive">{{ restaurants.filter(r => !r.is_active).length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">دارای اسلاگ</div>
        <div class="stat-value slug">{{ restaurants.filter(r => r.slug).length }}</div>
      </div>
    </div>

    <!-- جدول رستوران‌ها -->
    <div class="table-container">
      <!-- هدر جدول -->
      <div class="table-header">
        <div class="table-header-left">
          <h2>همه رستوران‌ها</h2>
        </div>
        <div class="table-header-right">
          نمایش {{ restaurants.length }} رستوران
        </div>
      </div>

      <!-- حالت لودینگ -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>در حال بارگذاری اطلاعات...</p>
      </div>

      <!-- حالت خالی -->
      <div v-else-if="restaurants.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>رستورانی یافت نشد</h3>
        <p>هنوز هیچ رستورانی ثبت نشده است.</p>
      </div>

      <!-- جدول -->
      <div v-else class="table-wrapper">
        <table class="restaurant-table">
          <thead>
          <tr>
            <th>رستوران</th>
            <th>وضعیت</th>
            <th>اسلاگ</th>
            <th>تاریخ ایجاد</th>
            <th v-if="authStore.isAdmin">عملیات</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="restaurant in restaurants"
              :key="restaurant.id"
              class="table-row"
          >
            <!-- ستون نام و لوگو -->
            <td class="restaurant-info">
              <div class="logo-container">
                <div
                    class="logo-placeholder"
                    :class="restaurant.is_active ? 'active-logo' : 'inactive-logo'"
                >
                  <img
                      v-if="restaurant.logo"
                      :src="restaurant.logo"
                      :alt="restaurant.name"
                      class="logo-image"
                  >
                  <span v-else class="logo-text">
                      {{ restaurant.name.charAt(0) }}
                    </span>
                </div>
              </div>
              <div class="restaurant-details">
                <div class="restaurant-name">
                  {{ restaurant.name }}
                </div>
                <div v-if="restaurant.slogan" class="restaurant-slogan">
                  {{ restaurant.slogan }}
                </div>
              </div>
            </td>

            <!-- ستون وضعیت -->
            <td v-if="authStore.isAdmin">
                <span
                    class="status-badge"
                    :class="restaurant.is_active ? 'active-status' : 'inactive-status'"
                >
                  <span class="status-dot"></span>
                  {{ restaurant.is_active ? 'فعال' : 'غیرفعال' }}
                </span>
            </td>

            <!-- ستون اسلاگ -->
            <td>
              <div v-if="restaurant.slug" class="slug-value">
                {{ restaurant.slug }}
              </div>
              <div v-else class="no-slug">
                ندارد
              </div>
            </td>

            <!-- ستون تاریخ -->
            <td class="date-cell">
              {{ formatDate(restaurant.created) }}
            </td>

            <!-- ستون عملیات -->
            <td>
              <button
                  @click="goToOrderList(restaurant)"
                  class="action-btn"
                  :class="{ disabled: !restaurant.is_active }"
              >
                مشاهده سفارش‌ها
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- فوتر جدول -->
      <div class="table-footer">
        <div class="footer-left">
          رستوران‌های فعال:
          <span class="active-count">{{ restaurants.filter(r => r.is_active).length }}</span>
          از
          <span class="total-count">{{ restaurants.length }}</span>
        </div>
        <div class="footer-right">
          آخرین به‌روزرسانی: امروز
        </div>
      </div>
    </div>

    <!-- راهنما -->
    <div class="help-box">
      <div class="help-icon">💡</div>
      <div class="help-content">
        <h4>راهنما</h4>
        <p>
          برای مشاهده سفارش‌های هر رستوران، بر روی دکمه "مشاهده سفارش‌ها" در سطر مربوطه کلیک کنید.
          فقط رستوران‌های فعال قابلیت مشاهده سفارش‌ها را دارند.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reset and base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family-base);
  direction: rtl;
  background-color: var(--app-bg);
}

.container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.header p {
  font-size: 14px;
  color: var(--muted);
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-label {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--text);
}

.stat-value.active {
  color: var(--color-success);
}

.stat-value.inactive {
  color: var(--muted);
}

.stat-value.slug {
  color: var(--primary);
}

/* Table container */
.table-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
  background-color: var(--table-header);
}

.table-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.table-header-right {
  font-size: 14px;
  color: var(--muted);
}

/* Loading state */
.loading-state {
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: var(--muted);
  font-size: 14px;
}

/* Empty state */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--muted);
  font-size: 14px;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.restaurant-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.restaurant-table thead {
  background-color: var(--table-header);
}

.restaurant-table th {
  padding: 16px 20px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}

.restaurant-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.table-row:hover {
  background-color: var(--table-row-hover);
}

/* Restaurant info cell */
.restaurant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-container {
  flex-shrink: 0;
}

.logo-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-logo {
  border: 2px solid var(--color-success);
  background-color: var(--color-success-subtle);
}

.inactive-logo {
  border: 2px solid var(--border);
  background-color: var(--surface-subtle);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
}

.active-logo .logo-text {
  color: var(--color-success);
}

.inactive-logo .logo-text {
  color: var(--muted);
}

.restaurant-details {
  flex: 1;
  min-width: 0;
}

.restaurant-name {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.restaurant-slogan {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.active-status {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}

.inactive-status {
  background-color: var(--surface-subtle);
  color: var(--muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 6px;
}

.active-status .status-dot {
  background-color: var(--color-success);
}

.inactive-status .status-dot {
  background-color: var(--muted);
}

/* Slug cell */
.slug-value {
  color: var(--primary);
  font-weight: 500;
  font-size: 14px;
}

.no-slug {
  color: var(--muted);
  font-size: 14px;
}

/* Date cell */
.date-cell {
  color: var(--muted);
  font-size: 14px;
  white-space: nowrap;
}

/* Action button */
.action-btn {
  background-color: var(--surface-subtle);
  color: var(--primary);
  border: 1px solid var(--border-strong);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(.disabled) {
  background-color: var(--surface-hover);
  border-color: var(--primary);
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table footer */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--table-header);
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--muted);
}

.active-count {
  color: var(--color-success);
  font-weight: 600;
  margin: 0 4px;
}

.total-count {
  color: var(--text);
  font-weight: 600;
  margin-right: 4px;
}

/* Help box */
.help-box {
  background-color: var(--surface-raised);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.help-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.help-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 4px;
}

.help-content p {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .table-footer {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .restaurant-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .logo-container {
    align-self: flex-start;
  }
}
</style>
