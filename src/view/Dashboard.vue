<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>داشبورد مدیریت</h1>
      <p>آمار و گزارشات عملکرد فروشگاه</p>
    </header>

    <!-- کارت‌های خلاصه امروز -->
    <div class="cards-container">
      <div class="card card-blue">
        <div class="card-header">
          <div class="card-title">
            <p class="card-label">سفارشات امروز</p>
            <h2 class="card-value">{{ summary?.orders || 0 }}</h2>
          </div>
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div class="card-footer" :class="(today?.orders_growth || 0) < 0 ? 'negative' : 'positive'">
          <span v-if="today?.orders_growth !== 0 && today?.orders_growth !== undefined">
            {{ (today?.orders_growth || 0) > 0 ? '+' : '' }}{{ today?.orders_growth || 0 }}%
          </span>
          <span v-else class="no-change">بدون تغییر</span>
          <span>نسبت به روز قبل</span>
        </div>
      </div>

      <div class="card card-green">
        <div class="card-header">
          <div class="card-title">
            <p class="card-label">درآمد امروز</p>
            <h2 class="card-value">{{ formatCurrency(summary?.revenue || 0) }}</h2>
          </div>
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="card-footer" :class="(today?.revenue_growth || 0) < 0 ? 'negative' : 'positive'">
          <span v-if="today?.revenue_growth !== 0 && today?.revenue_growth !== undefined">
            {{ (today?.revenue_growth || 0) > 0 ? '+' : '' }}{{ today?.revenue_growth || 0 }}%
          </span>
          <span v-else class="no-change">بدون تغییر</span>
          <span>نسبت به روز قبل</span>
        </div>
      </div>

      <div class="card card-purple">
        <div class="card-header">
          <div class="card-title">
            <p class="card-label">تحویل شده</p>
            <h2 class="card-value">{{ summary?.delivered || 0 }}</h2>
          </div>
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="card-detail">
          <span>میانگین زمان سفارش: {{ summary?.avg_order_time || 0 }} دقیقه</span>
        </div>
      </div>

      <div class="card card-yellow">
        <div class="card-header">
          <div class="card-title">
            <p class="card-label">مشتریان جدید</p>
            <h2 class="card-value">{{ summary?.new_customers || 0 }}</h2>
          </div>
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div class="card-detail">
          <span>مجموع مشتریان: {{ overview?.total_customers || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- ردیف دوم: نمودارها و آمار -->
    <div class="row">
      <div class="chart-container">
        <div class="chart-card">
          <h3>سفارشات ۷ روز گذشته</h3>
          <div class="chart">
            <div v-if="charts?.last_7_days_orders && charts.last_7_days_orders.length > 0" class="bars-container">
              <div v-for="(day, index) in charts.last_7_days_orders"
                   :key="index"
                   class="bar-wrapper">
                <div class="bar-label">{{ day.date_display }}</div>
                <div class="bar-container">
                  <div class="bar"
                       :style="{
                         height: maxOrders > 0 ? (day.total / maxOrders * 100) + '%' : '0%',
                         minHeight: '4px'
                       }"></div>
                </div>
                <div class="bar-value">{{ day.total }}</div>
              </div>
            </div>
            <div v-else class="no-data">
              داده‌ای برای نمایش وجود ندارد
            </div>
          </div>
        </div>
      </div>

      <div class="stats-container">
        <div class="stats-card">
          <h3>آمار کلی</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">کل سفارشات</span>
              <span class="stat-value">{{ overview?.total_orders || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">کل درآمد</span>
              <span class="stat-value">{{ formatCurrency(overview?.total_revenue || 0) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">میانگین ارزش سفارش</span>
              <span class="stat-value">{{ formatCurrency(overview?.avg_order_value || 0) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">موجودی کیف پول کل</span>
              <span class="stat-value">{{ formatCurrency(overview?.total_wallet_balance || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ردیف سوم: لیست برترین‌ها -->
    <div class="row">
      <div class="list-container">
        <div class="list-card">
          <h3>برترین مشتریان (بر اساس سفارش)</h3>
          <div class="list-content">
            <div v-if="top_lists?.customers_by_orders && top_lists.customers_by_orders.length > 0">
              <div v-for="(customer, index) in top_lists.customers_by_orders"
                   :key="customer.id"
                   class="customer-item">
                <div class="customer-info">
                  <div class="customer-rank">{{ index + 1 }}</div>
                  <div class="customer-details">
                    <p class="customer-name">{{ customer.name || 'نامشخص' }}</p>
                    <p class="customer-phone">{{ customer.phone }}</p>
                  </div>
                </div>
                <div class="customer-stats">
                  <p class="customer-orders">{{ customer.delivered_orders || 0 }} سفارش</p>
                  <p class="customer-spent">{{ formatCurrency(customer.total_spent || 0) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="no-data">
              داده‌ای برای نمایش وجود ندارد
            </div>
          </div>
        </div>
      </div>

      <div class="list-container">
        <div class="list-card">
          <h3>برترین موجودی‌های کیف پول</h3>
          <div class="list-content">
            <div v-if="top_lists?.customers_by_wallet && top_lists.customers_by_wallet.length > 0">
              <div v-for="(customer, index) in top_lists.customers_by_wallet.slice(0, 5)"
                   :key="customer.id"
                   class="customer-item">
                <div class="customer-info">
                  <div class="customer-rank wallet-rank">{{ index + 1 }}</div>
                  <div class="customer-details">
                    <p class="customer-name">{{ customer.name || 'نامشخص' }}</p>
                    <p class="customer-phone">{{ customer.phone }}</p>
                  </div>
                </div>
                <div class="customer-stats">
                  <p class="customer-balance">{{ formatCurrency(customer.wallet_balance || 0) }}</p>
                  <p class="customer-orders-small">{{ customer.total_orders || 0 }} سفارش</p>
                </div>
              </div>
            </div>
            <div v-else class="no-data">
              داده‌ای برای نمایش وجود ندارد
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- فوت -->
    <footer class="dashboard-footer">
      <p>آخرین بروزرسانی: {{ formatDate(meta?.generated_at) }}</p>
      <p>منطقه زمانی: {{ meta?.timezone || 'Asia/Tehran' }}</p>
    </footer>
  </div>
</template>

<script>
import DashboardAPI from '../api/dashboard.js'

export default {
  name: 'Dashboard',

  data() {
    return {
      overview: {},
      today: {},
      summary: {},
      period_stats: {},
      top_lists: {},
      charts: {},
      distributions: {},
      meta: {},
      maxOrders: 0,
      loading: true,
      error: null
    }
  },

  mounted() {
    this.loadDashboardData()
  },

  methods: {
    async loadDashboardData() {
      try {
        this.loading = true
        this.error = null

        const response = await DashboardAPI.dashboard()
        const data = response?.data || response || {}

        this.overview = data.overview || {}
        this.today = data.today || {}
        this.summary = data.summary || {}
        this.period_stats = data.period_stats || {}
        this.top_lists = data.top_lists || {}
        this.charts = data.charts || {}
        this.distributions = data.distributions || {}
        this.meta = data.meta || {}

        if (this.charts?.last_7_days_orders && this.charts.last_7_days_orders.length > 0) {
          this.maxOrders = Math.max(...this.charts.last_7_days_orders.map(d => d.total || 0))
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error)
        this.error = 'خطا در بارگذاری داده‌ها'
      } finally {
        this.loading = false
      }
    },

    formatCurrency(value) {
      if (!value && value !== 0) return '۰ ریال'
      return new Intl.NumberFormat('fa-IR').format(value) + ' ریال'
    },

    formatDate(dateString) {
      if (!dateString) return 'نامشخص'
      try {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date)
      } catch (error) {
        return 'فرمت تاریخ نامعتبر'
      }
    }
  }
}
</script>

<style scoped>
/* متغیرها */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  --accent-color: #8b5cf6;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --light-color: #f9fafb;
  --dark-color: #1f2937;
  --gray-light: #e5e7eb;
  --gray-medium: #9ca3af;
  --gray-dark: #6b7280;
  --border-radius: 12px;
  --box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --transition: all 0.3s ease;
}

/* استایل کلی داشبورد */
.dashboard {
  padding: 24px;
  background-color: var(--light-color);
  min-height: 100vh;
  font-family: 'Vazir', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  direction: rtl;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--dark-color);
  margin: 0;
}

.dashboard-header p {
  font-size: 16px;
  color: var(--gray-dark);
  margin-top: 8px;
}

/* کارت‌ها */
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.card {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 24px;
  border-right: 4px solid;
  transition: var(--transition);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card-blue {
  border-color: var(--primary-color);
}

.card-green {
  border-color: var(--secondary-color);
}

.card-purple {
  border-color: var(--accent-color);
}

.card-yellow {
  border-color: var(--warning-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.card-title .card-label {
  font-size: 14px;
  color: var(--gray-dark);
  margin: 0 0 8px 0;
}

.card-title .card-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--dark-color);
  margin: 0;
}

.card-icon {
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-blue .card-icon {
  background-color: rgba(59, 130, 246, 0.1);
}

.card-green .card-icon {
  background-color: rgba(16, 185, 129, 0.1);
}

.card-purple .card-icon {
  background-color: rgba(139, 92, 246, 0.1);
}

.card-yellow .card-icon {
  background-color: rgba(245, 158, 11, 0.1);
}

.icon {
  width: 24px;
  height: 24px;
}

.card-blue .icon {
  stroke: var(--primary-color);
}

.card-green .icon {
  stroke: var(--secondary-color);
}

.card-purple .icon {
  stroke: var(--accent-color);
}

.card-yellow .icon {
  stroke: var(--warning-color);
}

.card-footer {
  font-size: 14px;
  display: flex;
  gap: 4px;
}

.card-footer.positive {
  color: var(--secondary-color);
}

.card-footer.negative {
  color: var(--danger-color);
}

.card-footer .no-change {
  color: var(--gray-medium);
}

.card-detail {
  font-size: 14px;
  color: var(--gray-dark);
  margin-top: 16px;
}

/* ردیف‌ها */
.row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

@media (min-width: 1024px) {
  .row {
    grid-template-columns: 1fr 1fr;
  }
}

/* نمودار */
.chart-card,
.stats-card,
.list-card {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 24px;
  height: 100%;
}

.chart-card h3,
.stats-card h3,
.list-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark-color);
  margin: 0 0 24px 0;
}

.chart {
  height: 300px;
  display: flex;
  align-items: center;
}

.bars-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  height: 200px;
  gap: 8px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-label {
  font-size: 12px;
  color: var(--gray-dark);
  margin-bottom: 8px;
}

.bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.bar {
  width: 32px;
  background-color: var(--primary-color);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: var(--transition);
}

.bar:hover {
  background-color: #2563eb;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--dark-color);
  margin-top: 8px;
}

/* آمار */
.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: rgba(249, 250, 251, 0.8);
  border-radius: 8px;
  transition: var(--transition);
}

.stat-item:hover {
  background-color: var(--gray-light);
}

.stat-label {
  font-size: 14px;
  color: var(--gray-dark);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--dark-color);
}

/* لیست مشتریان */
.list-content {
  min-height: 300px;
}

.customer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: white;
  border: 1px solid var(--gray-light);
  border-radius: 8px;
  margin-bottom: 12px;
  transition: var(--transition);
}

.customer-item:hover {
  background-color: rgba(249, 250, 251, 0.8);
  border-color: var(--gray-medium);
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-rank {
  width: 32px;
  height: 32px;
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.wallet-rank {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--secondary-color);
}

.customer-details {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dark-color);
  margin: 0;
}

.customer-phone {
  font-size: 12px;
  color: var(--gray-dark);
  margin: 4px 0 0 0;
}

.customer-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: left;
}

.customer-orders,
.customer-balance {
  font-size: 14px;
  font-weight: 600;
  color: var(--dark-color);
  margin: 0 0 4px 0;
}

.customer-spent,
.customer-orders-small {
  font-size: 12px;
  color: var(--gray-dark);
  margin: 0;
}

/* حالت‌های خالی */
.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--gray-medium);
  font-size: 14px;
}

/* فوت */
.dashboard-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--gray-light);
  text-align: center;
  color: var(--gray-dark);
  font-size: 14px;
}

.dashboard-footer p {
  margin: 8px 0;
}

/* لودینگ */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--gray-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.error-message {
  color: var(--danger-color);
  font-size: 18px;
  margin-bottom: 20px;
}

.retry-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.retry-button:hover {
  background-color: #2563eb;
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .cards-container {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 20px;
  }

  .chart-card,
  .stats-card,
  .list-card {
    padding: 20px;
  }

  .customer-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .customer-stats {
    align-items: flex-start;
  }
}
</style>