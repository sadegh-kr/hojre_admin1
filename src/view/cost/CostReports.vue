<template>
  <section class="cost-page">
    <header class="cost-page-heading"><div><h2>گزارش‌های هزینه</h2><p>هزینه‌های ثبت‌شده، تولید و وضعیت ضایعات را بدون ترکیب مفاهیم مالی بررسی کنید.</p></div></header>
    <form class="cost-filter" @submit.prevent="load">
      <JalaliDatePicker v-model="filters.start_date" placeholder="از تاریخ"/>
      <JalaliDatePicker v-model="filters.end_date" placeholder="تا تاریخ"/>
      <select v-model="view">
        <option value="categories">دسته‌بندی هزینه</option>
        <option value="products">محصول و تولید</option>
        <option value="materials">قیمت فعلی مواد</option>
        <option value="waste">تحلیل ضایعات</option>
      </select>
      <button class="cost-primary" :disabled="loading">تهیه گزارش</button>
    </form>
    <div v-if="error" class="cost-notice" role="alert">{{ error }} <button @click="load">تلاش مجدد</button></div>

    <div class="report-summary">
      <article><span>کل هزینه ثبت‌شده</span><strong>{{ money(dashboard.total_expenses) }}</strong></article>
      <article><span>تعداد هزینه‌ها</span><strong>{{ number(dashboard.expense_count) }} مورد</strong></article>
      <article><span>هزینه تولیدهای تکمیل‌شده</span><strong>{{ money(dashboard.completed_order_cost) }}</strong></article>
      <article><span>هزینه سربار</span><strong>{{ money(dashboard.overhead_total) }}</strong></article>
    </div>

    <section v-if="view === 'categories'" class="report-card">
      <header><h3>هزینه بر اساس دسته‌بندی</h3></header>
      <div v-for="row in dashboard.expense_by_category" :key="row.category_id" class="report-row"><span>{{ row.category__name }}</span><strong>{{ money(row.total) }}</strong><small>{{ number(row.count) }} هزینه</small></div>
      <p v-if="!dashboard.expense_by_category?.length" class="empty-state">در این بازه هزینه‌ای ثبت نشده است.</p>
    </section>

    <section v-else-if="view === 'products'" class="report-card">
      <header><h3>هزینه تولید محصولات</h3></header>
      <div v-for="row in dashboard.production_costs" :key="row.id" class="report-row"><span>{{ row.name }}</span><strong>{{ money(row.expected_cost) }}</strong><small>هزینه واقعی: {{ row.actual_unit_cost === null ? 'هنوز تولیدی ثبت نشده' : money(row.actual_unit_cost) }} · اختلاف: {{ row.variance === null ? '—' : money(row.variance) }}</small></div>
      <p v-if="!dashboard.production_costs?.length" class="empty-state">محصولی برای تحلیل وجود ندارد.</p>
    </section>

    <section v-else-if="view === 'materials'" class="report-card">
      <header><h3>قیمت فعلی مواد اولیه</h3><small>این قیمت‌ها وابسته به بازه تاریخی نیستند.</small></header>
      <div v-for="item in materials" :key="item.id" class="report-row"><span>{{ item.name }}</span><strong>{{ money(item.effective_cost ?? item.unit_cost) }}</strong><small>{{ item.cost_source === 'inventory_average' ? 'میانگین موجودی' : 'قیمت مرجع' }} برای هر {{ item.unit_display }}</small></div>
      <p v-if="!materials.length" class="empty-state">ماده اولیه‌ای ثبت نشده است.</p>
    </section>

    <section v-else class="waste-report">
      <header class="waste-heading"><div><h3>ضایعات واقعی مواد اولیه</h3><p>{{ waste.context?.restaurant_name }} · {{ waste.context?.branch_name }}؛ مستقل از موجودی و ضایعات برآوردی دستور تولید</p></div></header>
      <div class="waste-summary">
        <article><span>هزینه ضایعات ارزش‌گذاری‌شده</span><strong>{{ waste.total_valued_cost === null ? 'فاقد مبلغ معتبر' : money(waste.total_valued_cost) }}</strong></article>
        <article><span>تعداد رویداد واقعی</span><strong>{{ number(waste.event_count) }} مورد</strong></article>
        <article><span>دارای قیمت معتبر</span><strong>{{ number(waste.valued_event_count) }} مورد</strong></article>
        <article :class="{ warning: waste.unvalued_event_count }"><span>فاقد قیمت معتبر</span><strong>{{ number(waste.unvalued_event_count) }} مورد</strong></article>
      </div>
      <div v-if="waste.quantity_by_unit?.length" class="quantity-summary">
        <article v-for="row in waste.quantity_by_unit" :key="row.unit"><span>مقدار ضایعات بر حسب {{ row.unit_display }}</span><strong>{{ number(row.quantity) }} {{ row.unit_display }}</strong><small>{{ number(row.event_count) }} رویداد</small></article>
      </div>
      <div v-if="waste.event_count" class="waste-charts">
        <article class="report-card">
          <header><h3>روند زمانی ضایعات</h3></header>
          <div v-for="row in waste.by_date" :key="row.date" class="waste-bar-row"><div><span>{{ date(row.date) }}</span><strong>{{ row.total_cost === null ? `${number(row.event_count)} رویداد بدون مبلغ` : money(row.total_cost) }}</strong></div><i><b :style="{ width: actualBarWidth(row.total_cost, row.event_count, waste.by_date) }"></b></i></div>
        </article>
        <article class="report-card">
          <header><h3>ضایعات بر اساس ماده</h3></header>
          <div v-for="row in waste.by_ingredient" :key="row.ingredient_id" class="waste-bar-row"><div><span>{{ row.ingredient__name }} · {{ number(row.quantity) }} {{ unitLabel(row.ingredient__unit) }}</span><strong>{{ row.total_cost === null ? 'فاقد مبلغ معتبر' : money(row.total_cost) }}</strong></div><i><b :style="{ width: actualBarWidth(row.total_cost, row.event_count, waste.by_ingredient) }"></b></i></div>
        </article>
        <article class="report-card">
          <header><h3>ضایعات بر اساس علت</h3></header>
          <div v-for="row in waste.by_reason" :key="row.reason" class="waste-bar-row"><div><span>{{ row.reason_display }} · {{ number(row.event_count) }} مورد</span><strong>{{ row.total_cost === null ? 'فاقد مبلغ معتبر' : money(row.total_cost) }}</strong></div><i><b :style="{ width: actualBarWidth(row.total_cost, row.event_count, waste.by_reason) }"></b></i></div>
        </article>
      </div>
      <article v-else class="report-card empty-waste"><strong>در این بازه ضایعات واقعی ثبت نشده است</strong><span>پس از ثبت از صفحه مواد اولیه، داده واقعی همین‌جا نمایش داده می‌شود.</span></article>
      <article v-if="waste.recent_events?.length" class="report-card recent-waste">
        <header><h3>رویدادهای اخیر</h3></header>
        <div v-for="row in waste.recent_events" :key="row.id" class="report-row"><span>{{ row.ingredient_name }} · {{ number(row.input_quantity) }} {{ row.input_unit_display }}</span><strong>{{ row.estimated_cost === null ? 'ارزش‌گذاری‌نشده' : money(row.estimated_cost) }}</strong><small>{{ row.reason_display }} · {{ dateTime(row.occurred_at) }}<template v-if="row.note"> · {{ row.note }}</template></small></div>
      </article>
      <article class="report-card recipe-waste-card">
        <header><div><h3>ضایعات برآوردی داخل دستور تولید</h3><small>هزینهٔ تخمینی برای تولید یک واحد محصول؛ جدا از ضایعات فیزیکی انبار</small></div></header>
        <div v-for="row in recipeWasteRows" :key="row.id" class="waste-bar-row">
          <div><span>{{ row.name }}</span><strong>{{ money(row.waste_cost) }}</strong></div>
          <i><b :style="{ width: wasteBarWidth(row.waste_cost) }"></b></i>
        </div>
        <p v-if="!recipeWasteRows.length" class="empty-state">برای رسپی محصولات، هزینهٔ ضایعات برآوردی ثبت نشده است.</p>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import API from '@/api/product-cost.api.js'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'
import { costErrorMessage, formatCostNumber as number, formatMoney as money } from '@/utils/costControl'

const route = useRoute()
const loading = ref(false)
const error = ref('')
const view = ref(route.query.view === 'waste' ? 'waste' : 'categories')
const materials = ref([])
const filters = reactive({ start_date: '', end_date: '' })
const dashboard = reactive({ total_expenses: 0, expense_count: 0, completed_order_cost: 0, overhead_total: 0, expense_by_category: [], production_costs: [] })
const waste = reactive({ event_count: 0, valued_event_count: 0, unvalued_event_count: 0, total_valued_cost: null, quantity_by_unit: [], by_date: [], by_ingredient: [], by_reason: [], recent_events: [], context: {} })
const recipeWasteRows = computed(() => (dashboard.production_costs || []).filter(row => Number(row.waste_cost || 0) > 0))
const maxRecipeWaste = computed(() => Math.max(...recipeWasteRows.value.map(row => Number(row.waste_cost || 0)), 0))
const wasteBarWidth = value => maxRecipeWaste.value > 0 ? `${Math.max((Number(value) / maxRecipeWaste.value) * 100, 2)}%` : '0%'

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [data, ingredients, wasteData] = await Promise.all([
      API.dashboard({ ...filters }),
      materials.value.length ? Promise.resolve(materials.value) : API.activeIngredients(),
      view.value === 'waste' ? API.ingredientWasteReport({ ...filters }) : Promise.resolve(null),
    ])
    Object.assign(dashboard, data)
    materials.value = ingredients
    if (wasteData) Object.assign(waste, wasteData)
  } catch (cause) { error.value = costErrorMessage(cause) } finally { loading.value = false }
}
const unitLabel = value => ({ g: 'گرم', ml: 'میلی‌لیتر', each: 'عدد' }[value] || value)
const date = value => value ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeZone: 'Asia/Tehran' }).format(new Date(`${value}T12:00:00`)) : '—'
const dateTime = value => value ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(value)) : '—'
function actualBarWidth(cost, count, rows) {
  const metric = Number(cost ?? count ?? 0)
  const max = Math.max(...(rows || []).map(row => Number(row.total_cost ?? row.event_count ?? 0)), 0)
  return max > 0 ? `${Math.max(metric / max * 100, 2)}%` : '0%'
}
onMounted(load)
</script>

<style scoped>
.report-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.report-summary article{display:grid;gap:5px;padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:11px}.report-summary span{color:var(--muted);font-size:.72rem}.report-card{padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:13px}.report-card>header{display:flex;justify-content:space-between;margin-bottom:8px}.report-card h3{margin:0;font-size:.95rem}.report-card header small,.empty-state{color:var(--muted);font-size:.72rem}.report-row{display:grid;grid-template-columns:1fr auto;gap:4px;padding:11px 0;border-bottom:1px solid var(--border);font-size:.8rem}.report-row small{grid-column:1/-1;color:var(--muted)}.waste-report{display:grid;gap:12px}.waste-heading{padding:14px 16px;border:1px solid color-mix(in srgb,var(--primary) 30%,var(--border));border-right:4px solid var(--primary);border-radius:12px;background:color-mix(in srgb,var(--primary) 6%,var(--surface))}.waste-heading h3,.waste-heading p{margin:0}.waste-heading p{margin-top:4px;color:var(--muted);font-size:.72rem}.waste-summary,.quantity-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.waste-summary article,.quantity-summary article{display:grid;gap:5px;padding:13px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}.waste-summary span,.quantity-summary span,.quantity-summary small{color:var(--muted);font-size:.68rem}.waste-summary strong,.quantity-summary strong{font-size:.82rem}.waste-summary .warning{border-color:color-mix(in srgb,var(--color-warning,#b7791f) 45%,var(--border))}.waste-charts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.waste-bar-row{display:grid;gap:7px;padding:10px 0;border-bottom:1px solid var(--border)}.waste-bar-row>div{display:flex;justify-content:space-between;gap:10px;font-size:.76rem}.waste-bar-row i{display:block;height:8px;overflow:hidden;border-radius:999px;background:var(--surface-subtle)}.waste-bar-row b{display:block;height:100%;border-radius:inherit;background:var(--color-warning,#b7791f)}.empty-waste{display:grid;justify-items:center;gap:5px;padding:30px;color:var(--muted);text-align:center}.empty-waste span{font-size:.72rem}@media(max-width:1050px){.waste-charts{grid-template-columns:1fr}.waste-summary,.quantity-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.report-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){.report-summary,.waste-summary,.quantity-summary{grid-template-columns:1fr}.waste-bar-row>div{align-items:flex-start;flex-direction:column}}
</style>
