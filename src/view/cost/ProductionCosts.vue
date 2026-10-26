<template>
  <section class="cost-page costing-center">
    <header class="cost-page-heading">
      <div>
        <p class="eyebrow">مرکز محاسبه محصول</p>
        <h2>آپدیت قیمت</h2>
      </div>
    </header>

    <MonthlyIngredientAnalysis />
    <BulkPricingPreview />
    <form class="cost-filter" @submit.prevent="load">
      <JalaliDatePicker v-model="filters.start_date" placeholder="از تاریخ تولید واقعی"/>
      <JalaliDatePicker v-model="filters.end_date" placeholder="تا تاریخ تولید واقعی"/>
      <input v-model.trim="search" placeholder="جستجوی محصول موجود" aria-label="جستجوی محصول موجود"/>
      <button class="cost-primary" :disabled="loading">{{ loading ? 'در حال محاسبه…' : 'به‌روزرسانی' }}</button>
    </form>

    <div v-if="error" class="cost-notice" role="alert">{{ error }} <button type="button" @click="load">تلاش مجدد</button></div>

    <section class="pricing-alerts" aria-label="پیشنهادهای قیمت">
      <header>
        <div><h3>پیشنهادهای نیازمند بررسی</h3><small>{{ number(reviewRequiredCount) }} افزایش مهم بر اساس آخرین هزینه‌ها</small></div>
        <select v-model="alertFilter" aria-label="فیلتر وضعیت پیشنهاد قیمت">
          <option value="all">همه وضعیت‌ها</option>
          <option value="review_required">نیازمند بررسی</option>
          <option value="calculated">محاسبه‌شده</option>
          <option value="incomplete">اطلاعات ناقص</option>
        </select>
      </header>
      <div v-if="alertsLoading" class="alert-empty">در حال بازبینی هزینه‌های مؤثر…</div>
      <div v-else-if="!filteredAlerts.length" class="alert-empty">پیشنهاد فعالی در این فیلتر وجود ندارد.</div>
      <div v-else class="alert-list">
        <button v-for="item in filteredAlerts" :key="item.id" type="button" @click="selectAlert(item)">
          <span><strong>{{ item.product_name }}</strong><small>{{ item.reason_detail }}</small></span>
          <span class="alert-price"><b>{{ item.suggested_price == null ? 'نامشخص' : money(item.suggested_price) }}</b><em :class="`status-${item.status}`">{{ item.status_display }}</em></span>
        </button>
      </div>
    </section>

    <div class="costing-layout">
      <aside ref="productBrowser" class="product-browser" aria-label="انتخاب محصول">
        <header><div><h3>محصولات موجود</h3><small>{{ number(productPagination.total) }} محصول</small></div><label>تعداد<select v-model.number="productPageSize" aria-label="تعداد محصولات در هر صفحه"><option :value="12">۱۲</option><option :value="24">۲۴</option><option :value="48">۴۸</option></select></label></header>
        <div class="product-list">
          <button
            v-for="row in productPageRows"
            :key="row.id"
            type="button"
            :class="{ selected: selectedId === String(row.id) }"
            @click="selectProduct(row)"
          >
            <span><strong>{{ row.name }}</strong><small>بهای فعلی هر واحد</small></span>
            <b>{{ money(row.expected_cost) }}</b>
          </button>
          <div v-if="loading" class="empty-resource">در حال دریافت محصولات…</div>
          <div v-else-if="!filteredRows.length" class="empty-resource">محصولی مطابق جستجو پیدا نشد.</div>
        </div>
        <nav v-if="filteredRows.length" class="product-pagination" aria-label="صفحه‌بندی محصولات موجود">
          <span>نمایش {{ number(productPagination.rangeStart) }} تا {{ number(productPagination.rangeEnd) }} از {{ number(productPagination.total) }}</span>
          <div><button type="button" :disabled="productPagination.page <= 1" @click="changeProductPage(productPagination.page - 1)">قبلی</button><span>صفحه {{ number(productPagination.page) }} از {{ number(productPagination.totalPages) }}</span><button type="button" :disabled="productPagination.page >= productPagination.totalPages" @click="changeProductPage(productPagination.page + 1)">بعدی</button></div>
        </nav>
      </aside>

      <section class="cost-detail">
        <div v-if="detailLoading" class="detail-state">در حال دریافت رسپی و محاسبه هزینه…</div>
        <div v-else-if="detailError" class="detail-state error" role="alert">{{ detailError }} <button type="button" @click="reloadSelected">تلاش مجدد</button></div>
        <div v-else-if="!product" class="detail-state">برای مشاهده جزئیات، یک محصول را انتخاب کنید.</div>

        <template v-else>
          <header class="detail-heading">
            <div class="product-identity">
              <img v-if="product.image_url" :src="product.image_url" alt=""/>
              <div><span>{{ product.category_name || 'بدون دسته‌بندی محصول' }}</span><h3>{{ product.name }}</h3><small>{{ product.is_active ? 'محصول فعال' : 'محصول غیرفعال' }}</small></div>
            </div>
            <RouterLink :to="`/dashboard/cost-control/products/${product.id}/recipe`" class="recipe-link">مشاهده و ویرایش رسپی</RouterLink>
          </header>

          <div v-if="!recipeLines.length" class="warning-card" role="status"><strong>رسپی ثبت نشده است</strong><span>این محصول همچنان قابل فروش است، اما هزینه مواد آن تا زمان ثبت رسپی صفر خواهد بود.</span></div>
          <div v-else-if="missingPriceLines.length" class="warning-card" role="status"><strong>{{ number(missingPriceLines.length) }} ماده بدون قیمت مؤثر</strong><span>هزینه این ردیف‌ها صفر محاسبه شده و بهای تمام‌شده ناقص است.</span></div>

          <div class="cost-metrics">
            <article><span>مواد اولیه</span><strong>{{ money(product.material_cost) }}</strong></article>
            <article><span>بسته‌بندی</span><strong>{{ money(product.packaging_cost) }}</strong></article>
            <article><span>ضایعات</span><strong>{{ money(product.waste_cost) }}</strong></article>
            <article><span>سربار تخصیص‌یافته</span><strong>{{ money(product.allocated_overhead_cost) }}</strong></article>
            <article class="total"><span>بهای تولید هر واحد</span><strong>{{ money(product.final_production_cost) }}</strong></article>
            <article class="selling"><span>قیمت فروش فعلی · فقط خواندنی</span><strong>{{ money(product.price) }}</strong></article>
          </div>

          <div class="formula">
            <span>مواد + بسته‌بندی + ضایعات + سربار</span>
            <strong>{{ money(product.final_production_cost) }}</strong>
          </div>

          <section class="yield-panel">
            <div><span>بازده رسپی فعلی</span><strong>۱ واحد محصول نهایی</strong><small>قرارداد تاریخی رسپی‌های موجود</small></div>
            <div><span>هزینه کل رسپی</span><strong>{{ money(product.final_production_cost) }}</strong><small>برای همین یک واحد</small></div>
            <div><span>هزینه تولید هر واحد</span><strong>{{ money(product.final_production_cost) }}</strong><small>بدون تقسیم مجدد</small></div>
            <div><span>هزینه واقعی تاریخی هر واحد</span><strong>{{ selectedRow?.actual_unit_cost == null ? 'هنوز ثبت نشده' : money(selectedRow.actual_unit_cost) }}</strong><small>بر اساس تولیدهای تکمیل‌شده در بازه</small></div>
          </section>

          <section class="pricing-panel">
            <header>
              <div><h3>سیاست و پیشنهاد قیمت فروش</h3><p>محاسبه مبلغ فقط در سرور انجام می‌شود و تا تأیید صریح مدیر، قیمت منو تغییر نمی‌کند.</p></div>
              <span v-if="recommendation" :class="['pricing-status', `status-${recommendation.status}`]">{{ recommendation.status_display }}</span>
            </header>

            <form class="pricing-policy" @submit.prevent="savePricingPolicy">
              <label><span>درصد افزوده روی بهای تولید</span><input v-model.trim="pricingForm.markup_percentage" type="number" min="0" step="0.001" inputmode="decimal" required placeholder="مثلاً ۲۰"/></label>
              <label><span>قاعده گردکردن رو به بالا</span><select v-model="pricingForm.roundingPreset">
                <option value="0">بدون گردکردن</option><option value="1000">۱٬۰۰۰ تومان</option><option value="5000">۵٬۰۰۰ تومان</option><option value="10000">۱۰٬۰۰۰ تومان</option><option value="custom">مقدار دلخواه</option>
              </select></label>
              <label v-if="pricingForm.roundingPreset === 'custom'"><span>گام دلخواه (تومان)</span><input v-model.trim="pricingForm.custom_rounding_step" type="number" min="1" step="1" inputmode="numeric" required/></label>
              <label><span>آستانه هشدار افزایش قیمت</span><span class="input-suffix"><input v-model.trim="pricingForm.significant_change_threshold" type="number" min="0" step="0.001" inputmode="decimal" required/><b>٪</b></span></label>
              <button class="cost-primary" :disabled="pricingSaving">{{ pricingSaving ? 'در حال محاسبه…' : 'ذخیره و محاسبه پیشنهاد' }}</button>
            </form>
            <div v-if="pricingError" class="pricing-error" role="alert">{{ pricingError }}</div>

            <template v-if="recommendation">
              <div v-if="!recommendation.is_complete" class="warning-card pricing-warning"><strong>پیشنهاد قابل تأیید نیست</strong><span>{{ recommendation.reason_detail }} فروش محصول متوقف نشده است.</span></div>
              <div class="recommendation-grid">
                <article><span>قیمت فعلی</span><strong>{{ money(recommendation.current_price) }}</strong></article>
                <article><span>بهای تولید</span><strong>{{ money(recommendation.production_cost) }}</strong></article>
                <article><span>افزوده مدیر</span><strong>{{ number(recommendation.markup_percentage) }}٪</strong></article>
                <article><span>قبل از گردکردن</span><strong>{{ recommendation.unrounded_suggested_price == null ? 'نامشخص' : money(recommendation.unrounded_suggested_price) }}</strong></article>
                <article><span>قاعده گردکردن</span><strong>{{ roundingLabel(recommendation.rounding_step) }}</strong></article>
                <article class="suggestion"><span>پیشنهاد نهایی سرور</span><strong>{{ recommendation.suggested_price == null ? 'نامشخص' : money(recommendation.suggested_price) }}</strong></article>
                <article><span>اختلاف مبلغ</span><strong>{{ signedMoney(recommendation.difference_amount) }}</strong></article>
                <article><span>درصد تغییر</span><strong>{{ signedPercent(recommendation.difference_percentage) }}</strong></article>
              </div>
              <div class="recommendation-note"><span>{{ recommendation.reason_detail }}</span><small>محاسبه: {{ dateTime(recommendation.calculated_at) }}</small></div>
              <div v-if="['calculated', 'review_required'].includes(recommendation.status)" class="pricing-actions">
                <button type="button" class="cost-primary" :disabled="!recommendation.can_approve || pricingAction" @click="approvePricing">تأیید و اعمال قیمت جدید</button>
                <button type="button" class="secondary-action" :disabled="pricingAction" @click="dismissPricing">رد پیشنهاد و حفظ قیمت فعلی</button>
              </div>
              <p v-if="pricingData?.options?.length" class="options-note">قیمت {{ number(pricingData.options.length) }} گزینهٔ محصول مستقل است و با این تأیید تغییر نمی‌کند.</p>
            </template>
            <div v-else class="alert-empty">برای دریافت پیشنهاد معتبر، درصد افزوده و قاعده گردکردن را ذخیره کنید.</div>

            <details v-if="recommendationHistory.length || priceHistory.length" class="pricing-history">
              <summary>سوابق پیشنهاد و انتشار قیمت</summary>
              <div class="history-columns">
                <div><h4>پیشنهادهای اخیر</h4><p v-for="item in recommendationHistory.slice(0, 6)" :key="item.id"><span>{{ item.status_display }} · {{ item.suggested_price == null ? 'نامشخص' : money(item.suggested_price) }}</span><small>{{ dateTime(item.calculated_at) }}</small></p></div>
                <div><h4>قیمت‌های منتشرشده</h4><p v-for="item in priceHistory.slice(0, 6)" :key="item.id"><span>{{ money(item.price) }}</span><small>{{ dateTime(item.valid_from) }}<template v-if="item.changed_by"> · {{ item.changed_by }}</template></small></p></div>
              </div>
            </details>
          </section>

          <section class="recipe-card">
            <header><div><h3>جزئیات رسپی موجود</h3><p>مقادیر مصرف برای تولید یک واحد محصول هستند.</p></div><strong>{{ number(recipeLines.length) }} ردیف</strong></header>
            <div class="recipe-table">
              <div class="table-head"><span>ماده</span><span>نوع هزینه</span><span>مقدار مصرف</span><span>قیمت مؤثر واحد</span><span>هزینه ردیف</span></div>
              <article v-for="line in recipeLines" :key="line.id" :class="{ incomplete: Number(line.unit_price || 0) <= 0 }">
                <div><strong>{{ line.ingredient_name }}</strong><small>{{ line.unit_display }}</small></div>
                <span>{{ line.cost_kind_display }}</span>
                <strong>{{ number(line.quantity) }} {{ line.unit_display }}</strong>
                <div><strong>{{ Number(line.unit_price || 0) > 0 ? money(line.unit_price) : 'ثبت نشده' }}</strong><small>{{ costSourceLabel(line.cost_source) }}</small></div>
                <strong>{{ money(line.line_cost) }}</strong>
              </article>
              <div v-if="!recipeLines.length" class="empty-resource">ردیفی برای این رسپی وجود ندارد.</div>
            </div>
          </section>

        </template>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import API from '@/api/product-cost.api.js'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'
import MonthlyIngredientAnalysis from '@/components/cost/MonthlyIngredientAnalysis.vue'
import BulkPricingPreview from '@/components/cost/BulkPricingPreview.vue'
import { costErrorMessage, formatCostNumber as number, formatMoney as money } from '@/utils/costControl'
import { costSourceLabel } from '@/utils/ingredientCost'
import { paginateRows } from '@/utils/clientPagination'

const loading = ref(false)
const detailLoading = ref(false)
const error = ref('')
const detailError = ref('')
const search = ref('')
const productPage = ref(1)
const productPageSize = ref(12)
const productBrowser = ref(null)
const rows = ref([])
const product = ref(null)
const recipeLines = ref([])
const pricingData = ref(null)
const alerts = ref([])
const alertsLoading = ref(false)
const alertFilter = ref('all')
const reviewRequiredCount = ref(0)
const pricingSaving = ref(false)
const pricingAction = ref(false)
const pricingError = ref('')
const selectedId = ref('')
const filters = reactive({ start_date: '', end_date: '' })
const pricingForm = reactive({ markup_percentage: '', roundingPreset: '0', custom_rounding_step: '', significant_change_threshold: '2' })
let detailRequest = 0

const filteredRows = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('fa-IR')
  return term ? rows.value.filter(row => row.name.toLocaleLowerCase('fa-IR').includes(term)) : rows.value
})
const productPagination = computed(() => paginateRows(filteredRows.value, productPage.value, productPageSize.value))
const productPageRows = computed(() => productPagination.value.rows)
const selectedRow = computed(() => rows.value.find(row => String(row.id) === selectedId.value) || null)
const missingPriceLines = computed(() => recipeLines.value.filter(line => Number(line.unit_price || 0) <= 0))
const recommendation = computed(() => pricingData.value?.recommendation || null)
const recommendationHistory = computed(() => pricingData.value?.recommendation_history || [])
const priceHistory = computed(() => pricingData.value?.price_history || [])
const filteredAlerts = computed(() => alertFilter.value === 'all' ? alerts.value : alerts.value.filter(item => item.status === alertFilter.value))

watch(search, () => { productPage.value = 1 })
watch(productPageSize, () => { productPage.value = 1 })
watch(() => productPagination.value.page, page => { if (productPage.value !== page) productPage.value = page })

function changeProductPage(page) {
  productPage.value = page
  productBrowser.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function load() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const [data] = await Promise.all([API.dashboard({ ...filters }), loadAlerts()])
    rows.value = data.production_costs || []
    const retained = rows.value.find(row => String(row.id) === selectedId.value)
    if (retained) await selectProduct(retained)
    else if (rows.value.length) await selectProduct(rows.value[0])
    else clearSelection()
  } catch (cause) {
    error.value = costErrorMessage(cause)
  } finally {
    loading.value = false
  }
}

async function selectProduct(row) {
  const id = String(row.id)
  selectedId.value = id
  product.value = null
  recipeLines.value = []
  pricingData.value = null
  pricingError.value = ''
  detailError.value = ''
  detailLoading.value = true
  const request = ++detailRequest
  try {
    const [productData, recipeData, pricing] = await Promise.all([API.product(id), API.recipes(id), API.productPricing(id)])
    if (request !== detailRequest || selectedId.value !== id) return
    product.value = productData
    recipeLines.value = recipeData || []
    pricingData.value = pricing
    hydratePricingForm(pricing.policy)
  } catch (cause) {
    if (request === detailRequest) detailError.value = costErrorMessage(cause)
  } finally {
    if (request === detailRequest) detailLoading.value = false
  }
}

function clearSelection() {
  detailRequest += 1
  selectedId.value = ''
  product.value = null
  recipeLines.value = []
  pricingData.value = null
  detailError.value = ''
  detailLoading.value = false
}

function reloadSelected() {
  if (selectedRow.value) selectProduct(selectedRow.value)
}

async function loadAlerts() {
  alertsLoading.value = true
  try {
    const data = await API.pricingRecommendations()
    alerts.value = data.results || []
    reviewRequiredCount.value = data.review_required_count || 0
  } catch (cause) {
    error.value ||= costErrorMessage(cause)
  } finally {
    alertsLoading.value = false
  }
}

function hydratePricingForm(policy = {}) {
  pricingForm.markup_percentage = policy.configured ? String(policy.markup_percentage) : ''
  pricingForm.significant_change_threshold = String(policy.significant_change_threshold ?? 2)
  const step = String(Number(policy.rounding_step || 0))
  if (['0', '1000', '5000', '10000'].includes(step)) {
    pricingForm.roundingPreset = step
    pricingForm.custom_rounding_step = ''
  } else {
    pricingForm.roundingPreset = 'custom'
    pricingForm.custom_rounding_step = step
  }
}

function roundingStep() {
  return pricingForm.roundingPreset === 'custom' ? pricingForm.custom_rounding_step : pricingForm.roundingPreset
}

async function savePricingPolicy() {
  if (!selectedId.value || pricingSaving.value) return
  const productId = selectedId.value
  pricingError.value = ''
  const step = Number(roundingStep())
  if (!Number.isFinite(step) || step < 0 || (pricingForm.roundingPreset === 'custom' && step <= 0)) {
    pricingError.value = 'گام گردکردن دلخواه باید یک عدد صحیح مثبت باشد.'
    return
  }
  pricingSaving.value = true
  try {
    const savedPricing = await API.saveProductPricing(productId, {
      markup_percentage: pricingForm.markup_percentage,
      rounding_step: roundingStep(),
      significant_change_threshold: pricingForm.significant_change_threshold,
    })
    if (selectedId.value === productId) {
      pricingData.value = savedPricing
      hydratePricingForm(savedPricing.policy)
    }
    await loadAlerts()
  } catch (cause) {
    if (selectedId.value === productId) pricingError.value = costErrorMessage(cause)
  } finally {
    pricingSaving.value = false
  }
}

async function approvePricing() {
  if (!recommendation.value?.can_approve || pricingAction.value) return
  if (!window.confirm(`قیمت فروش «${product.value.name}» به ${money(recommendation.value.suggested_price)} تغییر کند؟`)) return
  await runPricingAction('approve')
}

async function dismissPricing() {
  if (!recommendation.value || pricingAction.value) return
  if (!window.confirm('این پیشنهاد رد شود و قیمت فروش فعلی بدون تغییر بماند؟')) return
  await runPricingAction('dismiss')
}

async function runPricingAction(action) {
  pricingAction.value = true
  pricingError.value = ''
  const snapshot = recommendation.value
  const productId = selectedId.value
  try {
    const payload = { recommendation_id: snapshot.id, revision: snapshot.revision }
    const updatedPricing = action === 'approve'
      ? await API.approveProductPricing(productId, payload)
      : await API.dismissProductPricing(productId, payload)
    if (selectedId.value === productId) pricingData.value = updatedPricing
    if (action === 'approve') {
      const updatedProduct = await API.product(productId)
      const data = await API.dashboard({ ...filters })
      rows.value = data.production_costs || []
      if (selectedId.value === productId) product.value = updatedProduct
    }
    await loadAlerts()
  } catch (cause) {
    if (selectedId.value === productId) pricingError.value = costErrorMessage(cause)
    if (selectedId.value === productId) {
      try { pricingData.value = await API.productPricing(productId) } catch { /* پیام اصلی حفظ می‌شود */ }
    }
  } finally {
    pricingAction.value = false
  }
}

function selectAlert(item) {
  const row = rows.value.find(candidate => String(candidate.id) === String(item.product_id))
  if (row) selectProduct(row)
}

function roundingLabel(value) {
  return Number(value || 0) === 0 ? 'بدون گردکردن' : `رو به بالا تا ${money(value)}`
}

function signedMoney(value) {
  if (value == null) return 'نامشخص'
  const numeric = Number(value)
  return `${numeric > 0 ? '+' : ''}${money(numeric)}`
}

function signedPercent(value) {
  if (value == null) return 'قابل محاسبه نیست'
  const numeric = Number(value)
  return `${numeric > 0 ? '+' : ''}${number(numeric)}٪`
}

function dateTime(value) {
  return value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(value)) : '—'
}

onMounted(load)
</script>

<style scoped>
.costing-center{min-width:0}.eyebrow{color:var(--primary)!important;font-size:.7rem;font-weight:800}.costing-layout{display:grid;grid-template-columns:minmax(230px,290px) minmax(0,1fr);align-items:start;gap:1rem}.product-browser,.cost-detail{min-width:0;border:1px solid var(--border);border-radius:var(--card-radius);background:var(--surface);box-shadow:var(--shadow)}.product-browser{position:sticky;top:88px;max-height:calc(100dvh - 112px);overflow:hidden;scroll-margin-top:88px}.product-browser>header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.75rem;border-bottom:1px solid var(--border)}.product-browser>header label{display:flex;align-items:center;gap:.3rem;color:var(--muted);font-size:.65rem}.product-browser>header select{padding:.3rem;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--text);font:inherit}.product-browser h3,.recipe-card h3{margin:0;font-size:.95rem}.product-browser small,.recipe-card p{margin:.2rem 0 0;color:var(--muted);font-size:.7rem}.product-list{max-height:calc(100dvh - 250px);overflow-y:auto;padding:.35rem}.product-list>button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:.7rem;padding:.6rem .65rem;border:1px solid transparent;border-radius:var(--control-radius);background:transparent;color:var(--text);text-align:right;font:inherit;cursor:pointer}.product-list>button:hover{background:var(--surface-hover)}.product-list>button.selected{border-color:color-mix(in srgb,var(--primary) 35%,var(--border));background:color-mix(in srgb,var(--primary) 8%,var(--surface))}.product-list button span{display:grid;gap:.2rem;min-width:0}.product-list button strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}.product-list button small{color:var(--muted);font-size:.64rem}.product-list button b{flex:none;color:var(--primary);font-size:.73rem}.product-pagination{display:grid;gap:.4rem;padding:.55rem .65rem;border-top:1px solid var(--border);color:var(--muted);font-size:.64rem}.product-pagination>div{display:flex;align-items:center;justify-content:space-between;gap:.35rem}.product-pagination button{padding:.3rem .45rem;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--text);font:inherit;cursor:pointer}.product-pagination button:disabled{opacity:.45;cursor:not-allowed}.cost-detail{padding:1rem}.detail-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border)}.product-identity{display:flex;align-items:center;gap:.75rem;min-width:0}.product-identity img{width:52px;height:52px;border-radius:12px;object-fit:cover}.product-identity div{display:grid;gap:.12rem}.product-identity span,.product-identity small{color:var(--muted);font-size:.68rem}.product-identity h3{margin:0;font-size:1.1rem}.recipe-link{flex:none;padding:.55rem .75rem;border:1px solid var(--primary);border-radius:var(--button-radius);color:var(--primary);text-decoration:none;font-size:.74rem;font-weight:700}.warning-card{display:grid;gap:.25rem;margin-top:1rem;padding:.75rem .9rem;border:1px solid color-mix(in srgb,var(--color-warning,#b7791f) 40%,var(--border));border-radius:var(--control-radius);background:var(--color-warning-subtle,#fff7df)}.warning-card strong{font-size:.8rem}.warning-card span{color:var(--muted);font-size:.72rem}.cost-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem;margin-top:1rem}.cost-metrics article{display:grid;gap:.3rem;padding:.8rem;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface-subtle)}.cost-metrics span,.yield-panel span{color:var(--muted);font-size:.68rem}.cost-metrics strong{font-size:.88rem}.cost-metrics .total{border-color:color-mix(in srgb,var(--primary) 40%,var(--border));background:color-mix(in srgb,var(--primary) 7%,var(--surface))}.cost-metrics .total strong{color:var(--primary)}.cost-metrics .selling{border-style:dashed}.formula{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:.65rem;padding:.65rem .8rem;border-radius:var(--control-radius);background:var(--brand-panel);color:var(--on-brand);font-size:.75rem}.formula strong{font-size:.9rem}.yield-panel{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem;margin-top:1rem}.yield-panel>div{display:grid;gap:.25rem;padding:.8rem;border-right:3px solid var(--primary);border-radius:var(--control-radius);background:var(--surface-subtle)}.yield-panel strong{font-size:.78rem}.yield-panel small{color:var(--muted);font-size:.64rem;line-height:1.6}.recipe-card{margin-top:1rem;border:1px solid var(--border);border-radius:var(--card-radius);overflow:hidden}.recipe-card>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:.9rem 1rem;background:var(--surface-subtle)}.recipe-card>header>strong{color:var(--primary);font-size:.75rem}.recipe-table{overflow-x:auto}.table-head,.recipe-table article{display:grid;grid-template-columns:minmax(150px,1.3fr) minmax(90px,.8fr) minmax(120px,1fr) minmax(140px,1fr) minmax(110px,.8fr);align-items:center;gap:.7rem;min-width:720px;padding:.75rem 1rem}.table-head{color:var(--muted);font-size:.67rem}.recipe-table article{border-top:1px solid var(--border);font-size:.74rem}.recipe-table article.incomplete{background:color-mix(in srgb,var(--color-warning-subtle,#fff7df) 60%,var(--surface))}.recipe-table article>div{display:grid;gap:.15rem}.recipe-table article small{color:var(--muted);font-size:.63rem}.next-phase{margin-top:1rem;padding:.8rem 1rem;border-right:3px solid var(--primary);border-radius:var(--control-radius);background:var(--surface-subtle);color:var(--muted);font-size:.73rem;line-height:1.9}.next-phase strong{color:var(--text)}.detail-state{min-height:360px;display:grid;place-content:center;justify-items:center;gap:.5rem;color:var(--muted);text-align:center;font-size:.8rem}.detail-state.error{color:var(--danger)}.detail-state button{border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer}@media(max-width:1050px){.costing-layout{grid-template-columns:1fr}.product-browser{position:static;max-height:none}.product-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));max-height:none;overflow:visible}.yield-panel{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:720px){.detail-heading{align-items:flex-start;flex-direction:column}.cost-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.recipe-link{width:100%;text-align:center}.formula{align-items:flex-start;flex-direction:column}}@media(max-width:480px){.cost-metrics,.yield-panel,.product-list{grid-template-columns:1fr}.cost-detail{padding:.75rem}.product-browser>header{align-items:flex-start;flex-direction:column}.product-pagination>div{flex-wrap:wrap}}
.pricing-alerts{min-width:0;border:1px solid var(--border);border-radius:var(--card-radius);background:var(--surface);box-shadow:var(--shadow);overflow:hidden}.pricing-alerts>header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.8rem 1rem;border-bottom:1px solid var(--border)}.pricing-alerts h3,.pricing-panel h3{margin:0;font-size:.9rem}.pricing-alerts small,.pricing-panel p{margin:.15rem 0 0;color:var(--muted);font-size:.68rem}.pricing-alerts select{max-width:180px}.alert-list{display:flex;gap:.55rem;padding:.65rem;overflow-x:auto}.alert-list>button{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-width:285px;max-width:390px;padding:.65rem .75rem;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface-subtle);color:var(--text);text-align:right;font:inherit;cursor:pointer}.alert-list>button:hover{border-color:var(--primary)}.alert-list>button>span:first-child{display:grid;gap:.15rem;min-width:0}.alert-list strong{font-size:.76rem}.alert-list small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.alert-price{display:grid;justify-items:end;gap:.2rem;flex:none}.alert-price b{font-size:.72rem}.alert-price em,.pricing-status{padding:.18rem .42rem;border-radius:999px;background:var(--surface);color:var(--muted);font-size:.6rem;font-style:normal;white-space:nowrap}.alert-empty{padding:.85rem 1rem;color:var(--muted);font-size:.72rem;text-align:center}.status-review_required{background:color-mix(in srgb,var(--color-warning-subtle,#fff7df) 82%,var(--surface))!important;color:var(--color-warning,#9a6700)!important}.status-calculated{background:color-mix(in srgb,var(--primary) 10%,var(--surface))!important;color:var(--primary)!important}.status-incomplete{background:color-mix(in srgb,var(--danger) 8%,var(--surface))!important;color:var(--danger)!important}.status-approved{background:color-mix(in srgb,#238636 10%,var(--surface))!important;color:#238636!important}.status-dismissed,.status-outdated{color:var(--muted)!important}.pricing-panel{margin-top:1rem;border:1px solid color-mix(in srgb,var(--primary) 28%,var(--border));border-radius:var(--card-radius);overflow:hidden}.pricing-panel>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:.9rem 1rem;background:color-mix(in srgb,var(--primary) 5%,var(--surface))}.pricing-status{flex:none;border:1px solid currentColor}.pricing-policy{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr)) auto;align-items:end;gap:.65rem;padding:1rem;border-top:1px solid var(--border)}.pricing-policy label{display:grid;gap:.35rem;color:var(--muted);font-size:.68rem}.pricing-policy input,.pricing-policy select,.pricing-alerts select{width:100%;min-width:0;padding:.55rem .65rem;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface);color:var(--text);font:inherit}.pricing-policy .cost-primary{min-height:39px}.input-suffix{display:flex;align-items:center}.input-suffix input{border-radius:0 var(--control-radius) var(--control-radius) 0}.input-suffix b{align-self:stretch;display:grid;place-items:center;padding:0 .6rem;border:1px solid var(--border);border-right:0;border-radius:var(--control-radius) 0 0 var(--control-radius);background:var(--surface-subtle)}.pricing-error{margin:0 1rem .8rem;padding:.65rem .8rem;border-radius:var(--control-radius);background:color-mix(in srgb,var(--danger) 8%,var(--surface));color:var(--danger);font-size:.72rem}.pricing-warning{margin:0 1rem 1rem}.recommendation-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.55rem;padding:0 1rem 1rem}.recommendation-grid article{display:grid;gap:.25rem;padding:.65rem;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface-subtle)}.recommendation-grid span{color:var(--muted);font-size:.64rem}.recommendation-grid strong{font-size:.76rem}.recommendation-grid .suggestion{border-color:color-mix(in srgb,var(--primary) 42%,var(--border));background:color-mix(in srgb,var(--primary) 7%,var(--surface))}.recommendation-grid .suggestion strong{color:var(--primary)}.recommendation-note{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:0 1rem;padding:.65rem .75rem;border-right:3px solid var(--primary);border-radius:var(--control-radius);background:var(--surface-subtle);font-size:.7rem}.recommendation-note small{color:var(--muted)}.pricing-actions{display:flex;flex-wrap:wrap;gap:.6rem;padding:1rem}.secondary-action{padding:.55rem .8rem;border:1px solid var(--border);border-radius:var(--button-radius);background:var(--surface);color:var(--text);font:inherit;font-size:.72rem;cursor:pointer}.pricing-actions button:disabled{opacity:.5;cursor:not-allowed}.options-note{padding:0 1rem .85rem!important}.pricing-history{margin:0 1rem 1rem;border-top:1px solid var(--border);font-size:.72rem}.pricing-history summary{padding:.8rem 0;color:var(--primary);font-weight:700;cursor:pointer}.history-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;padding-bottom:.75rem}.history-columns h4{margin:.15rem 0 .5rem}.history-columns p{display:flex;justify-content:space-between;gap:.5rem;padding:.4rem 0;border-bottom:1px solid var(--border)}.history-columns small{white-space:nowrap}
@media(max-width:1250px){.pricing-policy{grid-template-columns:repeat(2,minmax(150px,1fr))}.recommendation-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.pricing-alerts>header,.pricing-panel>header,.recommendation-note{align-items:stretch;flex-direction:column}.pricing-alerts select{max-width:none}.pricing-policy{grid-template-columns:1fr}.recommendation-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.history-columns{grid-template-columns:1fr}.pricing-actions>*{width:100%}}
@media(max-width:420px){.recommendation-grid{grid-template-columns:1fr}.alert-list>button{min-width:250px}}
</style>
