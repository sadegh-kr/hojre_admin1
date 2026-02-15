<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-title">
        <h1>داشبورد مدیریت</h1>
        <p class="date-info">{{ period?.jalali_today }} - {{ period?.jalali_month }}</p>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" @click="loadDashboardData" :disabled="loading">
          <span class="refresh-icon">⟳</span>
          بروزرسانی
        </button>
      </div>
    </header>

    <!-- کارت‌های خلاصه امروز -->
    <div class="cards-container">
      <!-- سفارشات امروز -->
      <div class="card card-blue">
        <div class="card-header">
          <div class="card-title">
            <p class="card-label">سفارشات امروز</p>
            <h2 class="card-value">{{ today?.stats?.orders?.all || 0 }}</h2>
          </div>
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div class="card-stats-detail">
          <div class="stat-row">
            <span>آنلاین:</span>
            <span>{{ today?.stats?.orders?.online || 0 }}</span>
          </div>
          <div class="stat-row">
            <span>حضوری:</span>
            <span>{{ today?.stats?.orders?.in_store || 0 }}</span>
          </div>
        </div>
        <div class="card-footer" :class="getGrowthClass(today?.comparison?.orders?.all)">
          <span v-if="today?.comparison?.orders?.all !== 0">
            {{ formatGrowth(today?.comparison?.orders?.all) }} نسبت به دیروز
          </span>
          <span v-else>مشابه دیروز</span>
        </div>
      </div>

      <!-- درآمد امروز -->
      <div class="card card-green">
        <div class="card-header">
          <div class="card-title">
            <p class="card-label">درآمد امروز</p>
            <h2 class="card-value">{{ formatCurrency(today?.stats?.revenue?.all || 0) }}</h2>
          </div>
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="card-stats-detail">
          <div class="stat-row">
            <span>آنلاین:</span>
            <span>{{ formatCurrency(today?.stats?.revenue?.online || 0) }}</span>
          </div>
          <div class="stat-row">
            <span>حضوری:</span>
            <span>{{ formatCurrency(today?.stats?.revenue?.in_store || 0) }}</span>
          </div>
        </div>
        <div class="card-footer" :class="getGrowthClass(today?.comparison?.revenue?.all)">
          <span v-if="today?.comparison?.revenue?.all !== 0">
            {{ formatGrowth(today?.comparison?.revenue?.all) }} نسبت به دیروز
          </span>
          <span v-else>مشابه دیروز</span>
        </div>
      </div>

      <!-- سفارشات ماه -->
      <div class="card card-purple">
        <div class="card-header">
          <div class="card-title">
            <p class="card-label">سفارشات ماه</p>
            <h2 class="card-value">{{ monthly?.stats?.total_orders || 0 }}</h2>
          </div>
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div class="card-stats-detail">
          <div class="stat-row">
            <span>تحویل شده:</span>
            <span>{{ monthly?.stats?.delivered_orders || 0 }}</span>
          </div>
          <div class="stat-row">
            <span>درآمد:</span>
            <span>{{ formatCurrency(monthly?.stats?.total_revenue || 0) }}</span>
          </div>
        </div>
        <div class="card-detail">
          میانگین روزانه: {{ formatCurrency(monthly?.stats?.average_daily || 0) }}
        </div>
      </div>

      <!-- آمار کلی -->
      <div class="card card-yellow">
        <div class="card-header">
          <div class="card-title">
            <p class="card-label">کل درآمد</p>
            <h2 class="card-value">{{ formatCurrency(total_stats?.revenue?.all || 0) }}</h2>
          </div>
          <div class="card-icon">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div class="card-stats-detail">
          <div class="stat-row">
            <span>آنلاین:</span>
            <span>{{ formatCurrency(total_stats?.revenue?.online || 0) }} ({{ total_stats?.revenue?.online_percentage || 0 }}%)</span>
          </div>
          <div class="stat-row">
            <span>حضوری:</span>
            <span>{{ formatCurrency(total_stats?.revenue?.in_store || 0) }} ({{ total_stats?.revenue?.in_store_percentage || 0 }}%)</span>
          </div>
        </div>
        <div class="card-detail">
          میانگین ارزش: {{ formatCurrency(total_stats?.average_order_value?.all || 0) }}
        </div>
      </div>
    </div>

    <!-- ساعت‌های شلوغ -->
    <div class="section-header">
      <h2>⏰ ساعت‌های شلوغ</h2>
      <p>تعداد سفارش در هر ساعت (از اول ماه)</p>
    </div>
    <div class="hours-grid">
      <div v-for="hour in hourly" :key="hour.hour" class="hour-card" :class="{ 'peak-hour': hour.orders.all > getAverageOrders() }">
        <div class="hour-time">{{ hour.hour_display }}</div>
        <div class="hour-stats">
          <div class="hour-stat">
            <span class="stat-label">کل:</span>
            <span class="stat-value">{{ hour.orders.all }}</span>
          </div>
          <div class="hour-stat online">
            <span class="stat-label">آنلاین:</span>
            <span class="stat-value">{{ hour.orders.online }}</span>
          </div>
          <div class="hour-stat in-store">
            <span class="stat-label">حضوری:</span>
            <span class="stat-value">{{ hour.orders.in_store }}</span>
          </div>
        </div>
        <div class="hour-bar">
          <div class="bar-fill" :style="{ width: getHourPercentage(hour.orders.all) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- دو ستون: آیتم‌های پرفروش و وضعیت سفارشات -->
    <div class="row">
      <!-- آیتم‌های پرفروش -->
      <div class="chart-container">
        <div class="chart-card">
          <h3>🔥 آیتم‌های پرفروش</h3>
          <div class="tabs">
            <button class="tab-btn" :class="{ active: activeTopItemsTab === 'all' }" @click="activeTopItemsTab = 'all'">همه</button>
            <button class="tab-btn" :class="{ active: activeTopItemsTab === 'online' }" @click="activeTopItemsTab = 'online'">آنلاین</button>
            <button class="tab-btn" :class="{ active: activeTopItemsTab === 'in_store' }" @click="activeTopItemsTab = 'in_store'">حضوری</button>
          </div>
          <div class="items-list">
            <div v-if="topItemsByTab.length > 0">
              <div v-for="(item, index) in topItemsByTab" :key="index" class="item-row">
                <div class="item-rank">{{ index + 1 }}</div>
                <div class="item-info">
                  <p class="item-name">{{ item.name }}</p>
                  <p class="item-quantity">{{ item.quantity }} عدد</p>
                </div>
                <div class="item-revenue">{{ formatCurrency(item.revenue || 0) }}</div>
              </div>
            </div>
            <div v-else class="no-data">آیتمی یافت نشد</div>
          </div>
        </div>
      </div>

      <!-- وضعیت سفارشات -->
      <div class="stats-container">
        <div class="stats-card">
          <h3>📊 وضعیت سفارشات</h3>
          <div class="tabs">
            <button class="tab-btn" :class="{ active: activeStatusTab === 'all' }" @click="activeStatusTab = 'all'">همه</button>
            <button class="tab-btn" :class="{ active: activeStatusTab === 'online' }" @click="activeStatusTab = 'online'">آنلاین</button>
            <button class="tab-btn" :class="{ active: activeStatusTab === 'in_store' }" @click="activeStatusTab = 'in_store'">حضوری</button>
          </div>
          <div class="status-list">
            <div v-for="(status, key) in currentStatusStats" :key="key" class="status-item">
              <div class="status-header">
                <span class="status-name">{{ getStatusName(key) }}</span>
                <span class="status-count">{{ status.count }}</span>
              </div>
              <div class="status-bar">
                <div class="status-fill" :class="`status-${key}`" :style="{ width: status.percentage + '%' }"></div>
              </div>
              <div class="status-footer">
                <span class="status-percentage">{{ status.percentage }}%</span>
                <span class="status-revenue">{{ formatCurrency(status.revenue || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- برترین مشتریان -->
    <div class="section-header">
      <h2>👑 برترین مشتریان</h2>
    </div>
    <div class="customers-grid">
      <!-- آنلاین -->
      <div class="customers-card">
        <h4>سفارش آنلاین</h4>
        <div class="customers-list">
          <div v-if="top_customers?.online?.length > 0">
            <div v-for="(customer, index) in top_customers.online" :key="customer.id" class="customer-item">
              <div class="customer-rank">{{ index + 1 }}</div>
              <div class="customer-info">
                <p class="customer-name">{{ customer.name }}</p>
                <p class="customer-phone">{{ customer.phone }}</p>
              </div>
              <div class="customer-stats">
                <p class="customer-orders">{{ customer.orders }} سفارش</p>
                <p class="customer-spent">{{ formatCurrency(customer.spent) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="no-data">مشتری آنلاین ندارد</div>
        </div>
      </div>

      <!-- حضوری -->
      <div class="customers-card">
        <h4>سفارش حضوری</h4>
        <div class="customers-list">
          <div v-if="top_customers?.in_store?.length > 0">
            <div v-for="(customer, index) in top_customers.in_store" :key="customer.id" class="customer-item">
              <div class="customer-rank in-store">{{ index + 1 }}</div>
              <div class="customer-info">
                <p class="customer-name">{{ customer.name }}</p>
                <p class="customer-phone">{{ customer.phone }}</p>
              </div>
              <div class="customer-stats">
                <p class="customer-orders">{{ customer.orders }} سفارش</p>
                <p class="customer-spent">{{ formatCurrency(customer.spent) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="no-data">مشتری حضوری ندارد</div>
        </div>
      </div>
    </div>

    <footer class="dashboard-footer">
      <p>آخرین بروزرسانی: {{ meta?.jalali_generated_at }}</p>
    </footer>
  </div>
</template>

<script>
import DashboardAPI from '../api/dashboard.js'

export default {
  name: 'Dashboard',

  data() {
    return {
      loading: true,
      error: null,
      period: null,
      total_stats: null,
      today: null,
      weekly: null,
      monthly: null,
      hourly: [],
      top_items: null,
      top_customers: null,
      order_status: null,
      meta: null,
      activeTopItemsTab: 'all',
      activeStatusTab: 'all'
    }
  },

  computed: {
    topItemsByTab() {
      if (!this.top_items) return []
      return this.top_items[this.activeTopItemsTab] || []
    },

    currentStatusStats() {
      if (!this.order_status) return {}
      return this.order_status[this.activeStatusTab] || {}
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

        this.period = data.period || null
        this.total_stats = data.total_stats || null
        this.today = data.today || null
        this.weekly = data.weekly || null
        this.monthly = data.monthly || null
        this.hourly = data.hourly || []
        this.top_items = data.top_items || null
        this.top_customers = data.top_customers || null
        this.order_status = data.order_status || null
        this.meta = data.meta || null

      } catch (error) {
        console.error('Error loading dashboard data:', error)
        this.error = 'خطا در بارگذاری داده‌ها'
      } finally {
        this.loading = false
      }
    },

    formatCurrency(value) {
      if (!value && value !== 0) return '۰ تومان'
      return new Intl.NumberFormat('fa-IR').format(value) + ' تومان'
    },

    formatGrowth(value) {
      if (value > 0) return `+${value}%`
      return `${value}%`
    },

    getGrowthClass(value) {
      if (value > 0) return 'positive'
      if (value < 0) return 'negative'
      return ''
    },

    getAverageOrders() {
      if (!this.hourly || this.hourly.length === 0) return 0
      const total = this.hourly.reduce((sum, h) => sum + (h.orders.all || 0), 0)
      return total / this.hourly.length
    },

    getHourPercentage(count) {
      const maxOrders = Math.max(...this.hourly.map(h => h.orders.all || 0))
      if (maxOrders === 0) return 0
      return (count / maxOrders) * 100
    },

    getStatusName(key) {
      const names = {
        'pending': 'در انتظار',
        'prep': 'در حال آماده‌سازی',
        'send': 'در حال ارسال',
        'deliver': 'تحویل شده',
        'cancel': 'لغو شده'
      }
      return names[key] || key
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
  direction: rtl;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.date-info {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.refresh-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 18px;
}

/* کارت‌ها */
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border-top: 4px solid;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-blue { border-color: #3b82f6; }
.card-green { border-color: #10b981; }
.card-purple { border-color: #8b5cf6; }
.card-yellow { border-color: #f59e0b; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-title .card-label {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.card-title .card-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.card-icon {
  padding: 12px;
  border-radius: 12px;
  background-color: rgba(59, 130, 246, 0.1);
}

.card-blue .card-icon { background-color: rgba(59, 130, 246, 0.1); }
.card-green .card-icon { background-color: rgba(16, 185, 129, 0.1); }
.card-purple .card-icon { background-color: rgba(139, 92, 246, 0.1); }
.card-yellow .card-icon { background-color: rgba(245, 158, 11, 0.1); }

.icon {
  width: 24px;
  height: 24px;
}

.card-blue .icon { stroke: #3b82f6; }
.card-green .icon { stroke: #10b981; }
.card-purple .icon { stroke: #8b5cf6; }
.card-yellow .icon { stroke: #f59e0b; }

.card-stats-detail {
  margin: 16px 0;
  padding: 16px 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-row span:first-child {
  color: #6b7280;
}

.stat-row span:last-child {
  font-weight: 600;
  color: #2c3e50;
}

.card-footer {
  font-size: 14px;
  margin-top: 12px;
}

.card-footer.positive { color: #10b981; }
.card-footer.negative { color: #ef4444; }

.card-detail {
  font-size: 14px;
  color: #6b7280;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

/* ساعت‌های شلوغ */
.section-header {
  margin: 32px 0 20px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.section-header p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.hour-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.hour-card.peak-hour {
  border-color: #f59e0b;
  background-color: #fff7ed;
}

.hour-time {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.hour-stats {
  margin-bottom: 12px;
}

.hour-stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.hour-stat .stat-label {
  color: #6b7280;
}

.hour-stat .stat-value {
  font-weight: 600;
}

.hour-stat.online .stat-value { color: #3b82f6; }
.hour-stat.in-store .stat-value { color: #10b981; }

.hour-bar {
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s;
}

/* تب‌ها */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  background-color: #f3f4f6;
}

.tab-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* آیتم‌ها */
.items-list {
  max-height: 400px;
  overflow-y: auto;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.item-row:hover {
  background-color: #f9fafb;
}

.item-rank {
  width: 28px;
  height: 28px;
  background-color: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.item-quantity {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.item-revenue {
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
}

/* وضعیت سفارشات */
.status-list {
  margin-top: 16px;
}

.status-item {
  margin-bottom: 20px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.status-name {
  color: #6b7280;
}

.status-count {
  font-weight: 600;
  color: #2c3e50;
}

.status-bar {
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.status-fill {
  height: 100%;
  transition: width 0.3s;
}

.status-fill.status-pending { background-color: #f59e0b; }
.status-fill.status-prep { background-color: #3b82f6; }
.status-fill.status-send { background-color: #8b5cf6; }
.status-fill.status-deliver { background-color: #10b981; }
.status-fill.status-cancel { background-color: #ef4444; }

.status-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.status-percentage {
  color: #6b7280;
}

.status-revenue {
  font-weight: 600;
  color: #10b981;
}

/* مشتریان */
.customers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.customers-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.customers-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.customers-list {
  max-height: 400px;
  overflow-y: auto;
}

.customer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.customer-item:hover {
  background-color: #f9fafb;
}

.customer-rank {
  width: 32px;
  height: 32px;
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.customer-rank.in-store {
  background-color: #10b981;
}

.customer-info {
  flex: 1;
}

.customer-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.customer-phone {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.customer-stats {
  text-align: left;
}

.customer-orders {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.customer-spent {
  font-size: 12px;
  color: #10b981;
  margin: 0;
}

/* ردیف‌ها */
.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.chart-card,
.stats-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.chart-card h3,
.stats-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
}

/* فوتر */
.dashboard-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

/* حالت‌های خالی */
.no-data {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* لودینگ */
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .cards-container {
    grid-template-columns: 1fr;
  }

  .hours-grid {
    grid-template-columns: 1fr;
  }

  .row {
    grid-template-columns: 1fr;
  }

  .customers-grid {
    grid-template-columns: 1fr;
  }
}
</style>