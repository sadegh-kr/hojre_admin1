<script setup>
import { computed, ref, watch } from 'vue'
import HojrehIcon from '../components/HojrehIcon.vue'
import sidebarArt from '../assets/hojreh-sidebar-art.png'
import '../assets/hojreh-dashboard-pro.css'

/**
 * UI-only dashboard template. Pass API-derived data into `stats`, `trend`,
 * `alerts`, `recentCustomers`, `orderStatuses` and `financial`.
 * demoMode is opt-in and MUST NOT be enabled in a real admin deployment.
 */
const props = defineProps({
  showShell: { type: Boolean, default: false }, // false when rendered inside existing MainLayout
  cafeName: { type: String, default: 'حجره' },
  managerName: { type: String, default: 'مدیر' },
  dateLabel: { type: String, default: '' },
  dateFromJalali: { type: String, default: '' },
  dateToJalali: { type: String, default: '' },
  selectedPeriod: { type: String, default: 'today' },
  stats: { type: Object, default: () => ({}) },
  trend: { type: Array, default: () => [] },
  alerts: { type: Array, default: () => [] },
  recentCustomers: { type: Array, default: () => [] },
  orderStatuses: { type: Array, default: () => [] },
  financial: { type: Object, default: null },
  canViewFinance: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  demoMode: { type: Boolean, default: false },
})
const emit = defineEmits(['period-change', 'date-range-click', 'action', 'retry', 'logout', 'theme-toggle'])
const period = ref(props.selectedPeriod)
const seriesName = ref((props.demoMode || props.canViewFinance) ? 'sales' : 'orders')
const menuOpen = ref({ loyalty: false, finance: true, management: false })
watch(() => props.selectedPeriod, v => { period.value = v })
const example = {
  stats: { activeOrders: 12, sales: 42850000, orders: 152, customers: 286, activeDelta: 25, salesDelta: 15, ordersDelta: 8, customersDelta: 12 },
  trend: [18000000, 29000000, 20000000, 24500000, 36500000, 40500000, 38000000, 42850000].map((sales, i) => ({ label: `${16 + i} تیر`, sales, orders: [14,18,12,17,22,23,21,25][i], customers: [20,30,22,27,31,34,30,39][i] })),
  alerts: [{ id:'pending',count:3,title:'سفارش در انتظار تأیید',detail:'برای پردازش اقدام کنید', icon:'orders', severity:'danger' },{ id:'delayed',count:5,title:'سفارش بیش از ۳۰ دقیقه',detail:'نیاز به پیگیری دارند',icon:'clock', severity:'warning' },{ id:'stock',count:2,title:'قلم منو ناموجود است',detail:'موجودی انبار را بررسی کنید',icon:'box',severity:'warning' },{ id:'customers',count:4,title:'مشتری جدید',detail:'در ۷ روز اخیر ثبت‌نام کرده‌اند',icon:'users',severity:'neutral' }],
  recentCustomers: [{id:1,name:'علی محمدی',initials:'ع م',when:'۲ ساعت پیش',orders:3},{id:2,name:'سارا حسینی',initials:'س ح',when:'۳ ساعت پیش',orders:2},{id:3,name:'مهدی رضایی',initials:'م ر',when:'۵ ساعت پیش',orders:1},{id:4,name:'نازنین کریمی',initials:'ن ک',when:'۶ ساعت پیش',orders:4}],
  orderStatuses: [{key:'delivered',label:'تحویل‌شده',count:104,percent:68},{key:'preparing',label:'در حال آماده‌سازی',count:21,percent:14},{key:'pending',label:'در انتظار تأیید',count:12,percent:8},{key:'cancelled',label:'لغوشده',count:15,percent:10}],
  financial: {sales:42850000,averageOrder:282000,expenses:8420000,net:34430000},
}
const dataStats = computed(() => props.demoMode ? example.stats : props.stats)
const dataTrend = computed(() => props.demoMode ? example.trend : props.trend)
const dataAlerts = computed(() => props.demoMode ? example.alerts : props.alerts)
const dataCustomers = computed(() => props.demoMode ? example.recentCustomers : props.recentCustomers)
const dataStatuses = computed(() => props.demoMode ? example.orderStatuses : props.orderStatuses)
const dataFinance = computed(() => props.demoMode ? example.financial : props.financial)
const financeAllowed = computed(() => props.demoMode || props.canViewFinance)
watch(financeAllowed, allowed => { if (!allowed && seriesName.value === 'sales') seriesName.value = 'orders' })
const formatter = new Intl.NumberFormat('fa-IR')
function fmt(n) { return n === null || n === undefined ? '—' : formatter.format(n) }
function emitAction(key, payload) { emit('action', { key, payload }) }
function applyPeriod(value) { period.value = value; value === 'custom' ? emit('date-range-click') : emit('period-change', value) }
const chartPoints = computed(() => {
  const rows = dataTrend.value
  if (!rows?.length) return []
  const vals = rows.map(x => Number(x?.[seriesName.value] || 0))
  const max = Math.max(...vals, 1)
  return vals.map((y, i) => ({ x: 24 + (i * 616 / Math.max(1, vals.length-1)), y: 220-(y/max)*174, value:y, label:rows[i].label || '' }))
})
const chartLine = computed(() => chartPoints.value.map((p,i) => `${i ? 'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '))
const chartArea = computed(() => chartPoints.value.length ? `${chartLine.value} L${chartPoints.value.at(-1).x} 235 L${chartPoints.value[0].x} 235 Z` : '')
const chartLabel = computed(() => ({sales:'نمودار فروش',orders:'روند تعداد سفارش‌ها',customers:'روند مشتریان'})[seriesName.value])
const metricCards = computed(() => [
  { label:'سفارش‌های فعال', value:dataStats.value.activeOrders, unit:'', delta:dataStats.value.activeDelta, icon:'clock',tone:'red' },
  financeAllowed.value
    ? { label:'فروش کل', value:dataStats.value.sales, unit:'تومان', delta:dataStats.value.salesDelta, icon:'coin',tone:'gold' }
    : { label:'در انتظار تأیید', value:dataStats.value.pendingOrders, unit:'', icon:'orders',tone:'gold' },
  { label:'تعداد سفارش‌ها',value:dataStats.value.orders,unit:'',delta:dataStats.value.ordersDelta,icon:'bag',tone:'orange' },
  { label:'مشتریان', value:dataStats.value.customers,unit:'',delta:dataStats.value.customersDelta,icon:'users',tone:'yellow' },
])
const quickActions = [{key:'pos',icon:'plus',label:'ثبت سفارش حضوری',sub:'سفارش جدید در کافه'},{key:'phone-order',icon:'phone',label:'ثبت سفارش تلفنی',sub:'سفارش جدید از طریق تماس'},{key:'orders',icon:'orders',label:'مشاهده سفارش‌ها',sub:'لیست و مدیریت سفارش‌ها'},{key:'customer-search',icon:'users',label:'جستجوی مشتری',sub:'مشاهده اطلاعات مشتریان'}]
const nav = [
  {label:'داشبورد',icon:'home',key:'dashboard'},
  {label:'سفارش‌ها',icon:'orders',key:'orders'},
  {label:'مشتریان',icon:'users',key:'customers'},
  {label:'اقلام منو',icon:'fork',key:'menu'},
]
const groups = [
  {key:'loyalty',title:'باشگاه مشتریان',icon:'star',items:[{label:'اعضا',key:'loyalty-members'},{label:'جوایز و امتیازها',key:'loyalty-rewards'}]},
  {key:'finance',title:'مدیریت هزینه',icon:'wallet',items:[{label:'هزینه‌ها',key:'expenses'},{label:'گزارش مالی',key:'finance'}]},
  {key:'management',title:'مدیریت مدیران',icon:'users',items:[{label:'دسترسی‌ها',key:'admins'}]},
]
</script>

<template>
  <div class="hj-pro" :class="{ 'hj-embedded': !showShell }" dir="rtl">
    <aside v-if="showShell" class="hj-sidebar" aria-label="منوی اصلی">
      <div class="hj-brand"><div class="hj-brand-mark">✺</div><div><strong>کافه‌حجره</strong><small>مدیریت رستوران</small></div></div>
      <nav class="hj-nav">
        <button v-for="item in nav" :key="item.key" type="button" class="hj-nav-item" :class="{ 'is-active': item.key==='dashboard' }" @click="emitAction(item.key)"><HojrehIcon :name="item.icon" :size="19"/>{{item.label}}</button>
        <div v-for="g in groups" :key="g.key" class="hj-nav-group">
          <button type="button" class="hj-nav-item" :aria-expanded="Boolean(menuOpen[g.key])" @click="menuOpen[g.key]=!menuOpen[g.key]"><HojrehIcon :name="g.icon" :size="19"/>{{g.title}}<HojrehIcon class="hj-nav-caret" name="down" :size="15"/></button>
          <div v-if="menuOpen[g.key]" class="hj-nav-sub"><button v-for="child in g.items" :key="child.key" type="button" @click="emitAction(child.key)">{{child.label}}</button></div>
        </div>
      </nav>
      <div class="hj-sidebar-bottom"><div class="hj-arch-art" aria-hidden="true"><img :src="sidebarArt" alt="" draggable="false" /></div><button type="button" class="hj-logout" @click="emit('logout')"><HojrehIcon name="logout"/>خروج</button></div>
    </aside>

    <div class="hj-workspace">
      <header v-if="showShell" class="hj-topbar">
        <div class="hj-greeting"><strong>خوش آمدید، {{managerName}} عزیز</strong><span>{{dateLabel || 'داشبورد مدیریت کافه حجره'}}</span></div>
        <div class="hj-toolbar"><span class="hj-toolbar-caption">مجموعه فعال</span><div class="hj-cafe-tag"><HojrehIcon name="restaurant" :size="17"/><strong>{{cafeName}}</strong></div><button type="button" class="hj-round-btn" aria-label="اعلان‌ها" @click="emitAction('notifications')"><HojrehIcon name="bell"/><i class="hj-dot"/></button><button type="button" class="hj-round-btn" aria-label="حساب کاربری" @click="emitAction('profile')"><HojrehIcon name="users"/></button></div>
      </header>

      <main class="hj-content">
        <div class="hj-filter-card">
          <div class="hj-presets"><button v-for="entry in [{label:'امروز',key:'today'},{label:'۷ روز اخیر',key:'7d'},{label:'۳۰ روز اخیر',key:'30d'},{label:'بازه دلخواه',key:'custom'}]" :key="entry.key" type="button" class="hj-pill" :class="{selected:period===entry.key}" :aria-pressed="period===entry.key" @click="applyPeriod(entry.key)">{{entry.label}}</button></div>
          <button type="button" class="hj-date-range" @click="emit('date-range-click')" aria-label="انتخاب بازه تاریخ شمسی"><HojrehIcon name="calendar" :size="20"/><span>{{dateFromJalali || 'شروع بازه'}}</span><span class="hj-date-sep">تا</span><span>{{dateToJalali || 'پایان بازه'}}</span><HojrehIcon name="down" :size="15"/></button>
        </div>

        <div v-if="error" class="hj-state hj-state-error" role="alert"><strong>دریافت اطلاعات ناموفق بود</strong><span>{{error}}</span><button class="hj-pill selected" type="button" @click="emit('retry')">تلاش دوباره</button></div>
        <div v-else-if="loading" class="hj-state" role="status">در حال بارگذاری اطلاعات کافه…</div>
        <template v-else>
          <section class="hj-metrics" aria-label="شاخص‌های اصلی">
            <article v-for="metric in metricCards" :key="metric.label" class="hj-metric hj-surface"><div class="hj-metric-top"><span>{{metric.label}}</span><div class="hj-metric-icon" :class="`tone-${metric.tone}`"><HojrehIcon :name="metric.icon" :size="25"/></div></div><div class="hj-metric-number" :class="{ 'is-money': Boolean(metric.unit) }">{{fmt(metric.value)}} <small v-if="metric.unit">{{metric.unit}}</small></div><div class="hj-metric-footer"><span v-if="metric.delta !== undefined && metric.delta !== null" :class="Number(metric.delta) < 0 ? 'hj-trend-negative':'hj-trend-positive'">{{Number(metric.delta)>=0?'↗':'↘'}} {{fmt(Math.abs(Number(metric.delta)))}}٪</span><span v-else>—</span><small>نسبت به دوره قبل</small></div></article>
          </section>

          <section class="hj-middle">
            <article class="hj-panel hj-surface hj-alerts"><div class="hj-panel-head"><h2><HojrehIcon name="bell"/>نیازمند توجه</h2><span class="hj-count-chip">{{fmt(dataAlerts.length)}}</span></div><div v-if="dataAlerts.length" class="hj-alert-list"><button v-for="a in dataAlerts" :key="a.id" type="button" class="hj-alert-item" @click="emitAction('alert', a)"><span class="hj-alert-icon" :class="`severity-${a.severity || 'neutral'}`"><HojrehIcon :name="a.icon || 'alert'"/></span><span class="hj-alert-copy"><strong>{{fmt(a.count)}} {{a.title}}</strong><small>{{a.detail}}</small></span><HojrehIcon name="chevron" class="hj-alert-chevron" :size="16"/></button></div><div v-else class="hj-empty">مورد نیازمند پیگیری ثبت نشده است.</div></article>

            <article class="hj-panel hj-surface hj-quick"><div class="hj-panel-head"><h2><HojrehIcon name="activity"/>دسترسی سریع</h2></div><div class="hj-quick-grid"><button v-for="a in quickActions" :key="a.key" type="button" class="hj-quick-tile" @click="emitAction(a.key)"><span class="hj-quick-icon"><HojrehIcon :name="a.icon" :size="24"/></span><strong>{{a.label}}</strong><small>{{a.sub}}</small></button></div></article>

            <article class="hj-panel hj-surface hj-chart"><div class="hj-panel-head"><h2><HojrehIcon name="chart"/>{{chartLabel}}</h2><div class="hj-chart-tabs"><button v-for="tab in [{key:'sales',title:'فروش',private:true},{key:'orders',title:'تعداد سفارش'},{key:'customers',title:'مشتریان'}]" :key="tab.key" v-show="!tab.private || financeAllowed" type="button" class="hj-chart-tab" :class="{selected:seriesName===tab.key}" @click="seriesName=tab.key">{{tab.title}}</button></div></div>
              <div v-if="chartPoints.length" class="hj-chart-plot"><svg viewBox="0 0 664 272" preserveAspectRatio="none" role="img" :aria-label="chartLabel"><defs><linearGradient id="hjChartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a66e45" stop-opacity=".32"/><stop offset="1" stop-color="#a66e45" stop-opacity="0"/></linearGradient></defs><path v-for="i in 4" :key="i" :d="`M24 ${25+i*52}H640`" stroke="var(--hj-grid)" stroke-width="1"/><path :d="chartArea" fill="url(#hjChartGradient)"/><path :d="chartLine" fill="none" stroke="#7b492c" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle v-for="p in chartPoints" :key="`${p.x}-${p.y}`" :cx="p.x" :cy="p.y" r="5" fill="#7b492c" stroke="var(--hj-card)" stroke-width="2.5"/></svg><div class="hj-chart-labels"><span v-for="(p,i) in chartPoints" :key="i">{{p.label}}</span></div></div><div v-else class="hj-empty hj-chart-empty">در این بازه داده‌ای برای نمایش نمودار وجود ندارد.</div>
            </article>
          </section>

          <section class="hj-bottom">
            <article class="hj-panel hj-surface hj-recent"><div class="hj-panel-head"><h2><HojrehIcon name="users"/>مشتریان اخیر</h2><button class="hj-text-action" type="button" @click="emitAction('customers')">مشاهده همه <HojrehIcon name="arrow" :size="15"/></button></div><div v-if="dataCustomers.length"><button v-for="c in dataCustomers" :key="c.id" class="hj-customer-item" type="button" @click="emitAction('customer',c)"><span class="hj-avatar">{{c.initials || 'م'}}</span><span class="hj-customer-name"><strong>{{c.name}}</strong><small>{{fmt(c.orders)}} سفارش</small></span><span class="hj-customer-time">{{c.when}}</span><HojrehIcon name="chevron" :size="15"/></button></div><div v-else class="hj-empty">مشتری جدیدی در این بازه ثبت نشده است.</div></article>

            <article v-if="financeAllowed" class="hj-panel hj-surface hj-finance"><div class="hj-panel-head"><h2><HojrehIcon name="wallet"/>خلاصه مالی دوره</h2></div><template v-if="dataFinance"><div v-for="r in [{label:'فروش کل',key:'sales'},{label:'میانگین هر سفارش',key:'averageOrder'},{label:'هزینه‌ها',key:'expenses'},{label:'نتیجه خالص',key:'net'}]" :key="r.key" class="hj-finance-row"><span>{{r.label}}</span><strong>{{fmt(dataFinance[r.key])}} <small v-if="dataFinance[r.key] !== null && dataFinance[r.key] !== undefined">تومان</small></strong></div></template><div v-else class="hj-empty">اطلاعات مالی معتبر این دوره در دسترس نیست.</div></article>

            <article class="hj-panel hj-surface hj-status"><div class="hj-panel-head"><h2><HojrehIcon name="orders"/>وضعیت سفارش‌ها</h2><button class="hj-text-action" type="button" @click="emitAction('orders')">مشاهده همه <HojrehIcon name="arrow" :size="15"/></button></div><div v-if="dataStatuses.length" class="hj-status-grid"><div v-for="s in dataStatuses" :key="s.key" class="hj-status-card" :class="`status-${s.key}`"><strong>{{s.label}}</strong><HojrehIcon :name="s.key==='delivered'?'check':s.key==='cancelled'?'close':s.key==='pending'?'clock':'activity'" :size="23"/><b>{{fmt(s.count)}}</b><small>{{s.percent===null || s.percent===undefined?'':`${fmt(s.percent)}٪`}}</small></div></div><div v-else class="hj-empty">سفارشی برای این بازه ثبت نشده است.</div></article>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>
