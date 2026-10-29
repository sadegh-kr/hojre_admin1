<template>
  <section class="cost-page costing-center">
    <header class="cost-page-heading">
      <div>
        <p class="eyebrow">مرکز محاسبه محصول</p>
        <h2>آپدیت قیمت</h2>
      </div>
    </header>

    <div class="pricing-summary" aria-label="خلاصه پیشنهادهای قیمت" aria-live="polite">
      <article><span>پیشنهادهای نیازمند بررسی</span><strong>{{ summary ? number(summary.review) : '—' }}</strong></article>
      <article><span>آماده اعمال</span><strong>{{ summary ? number(summary.eligible) : '—' }}</strong></article>
      <article class="selected-summary"><span>انتخاب‌شده برای اعمال</span><strong>{{ summary ? number(summary.selected) : '—' }}</strong></article>
    </div>
    <MonthlyIngredientAnalysis />
    <BulkPricingPreview @summary="summary = $event" @inspect="inspectProduct" />

    <details ref="productDetails" class="product-details" :open="detailsOpen" @toggle="detailsOpen = $event.target.open">
      <summary>سیاست و جزئیات قیمت محصول <small>محاسبه، تأیید تکی و سوابق</small></summary>
    <form class="cost-filter" @submit.prevent="load">
      <JalaliDatePicker v-model="filters.start_date" placeholder="از تاریخ تولید واقعی"/>
      <JalaliDatePicker v-model="filters.end_date" placeholder="تا تاریخ تولید واقعی"/>
      <input v-model.trim="search" placeholder="جستجوی محصول موجود" aria-label="جستجوی محصول موجود"/>
      <button class="cost-primary" :disabled="loading">{{ loading ? 'در حال محاسبه…' : 'به‌روزرسانی' }}</button>
    </form>

    <div v-if="error" class="cost-notice" role="alert">{{ error }} <button type="button" @click="load">تلاش مجدد</button></div>

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
        <div v-if="detailLoading" class="detail-state">در حال دریافت و محاسبه هزینه…</div>
        <div v-else-if="detailError" class="detail-state error" role="alert">{{ detailError }} <button type="button" @click="reloadSelected">تلاش مجدد</button></div>
        <div v-else-if="!product" class="detail-state">برای مشاهده جزئیات، یک محصول را انتخاب کنید.</div>

        <template v-else>
          <header class="detail-heading">
            <div class="product-identity">
              <img v-if="product.image_url" :src="product.image_url" alt=""/>
              <div><span>{{ product.category_name || 'بدون دسته‌بندی محصول' }}</span><h3>{{ product.name }}</h3><small>{{ product.is_active ? 'محصول فعال' : 'محصول غیرفعال' }}</small></div>
            </div>
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

          <section class="pricing-panel">
            <header>
              <div><h3>سیاست و پیشنهاد قیمت فروش</h3><p>قیمت فروش فقط پس از تأیید نهایی تغییر می‌کند.</p></div>
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

        </template>
      </section>
    </div>
    </details>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import API from '@/api/product-cost.api.js'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'
import MonthlyIngredientAnalysis from '@/components/cost/MonthlyIngredientAnalysis.vue'
import BulkPricingPreview from '@/components/cost/BulkPricingPreview.vue'
import { costErrorMessage, formatCostNumber as number, formatMoney as money } from '@/utils/costControl'
import { paginateRows } from '@/utils/clientPagination'
import { pricingWarningEvent } from '@/utils/pricingWarnings'

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
const summary = ref(null)
const detailsOpen = ref(false)
const productDetails = ref(null)
const pricingSaving = ref(false)
const pricingAction = ref(false)
const pricingError = ref('')
const selectedId = ref('')
const filters = reactive({ start_date: '', end_date: '' })
const pricingForm = reactive({ markup_percentage: '', roundingPreset: '0', custom_rounding_step: '', significant_change_threshold: '2' })
let detailRequest = 0
let refreshAfterLoad = false

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
    const data = await API.dashboard({ ...filters })
    rows.value = data.production_costs || []
    const retained = rows.value.find(row => String(row.id) === selectedId.value)
    if (retained) await selectProduct(retained)
    else if (rows.value.length) await selectProduct(rows.value[0])
    else clearSelection()
  } catch (cause) {
    error.value = costErrorMessage(cause)
  } finally {
    loading.value = false
    if (refreshAfterLoad) {
      refreshAfterLoad = false
      await load()
    }
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
  } catch (cause) {
    if (selectedId.value === productId) pricingError.value = costErrorMessage(cause)
    if (selectedId.value === productId) {
      try { pricingData.value = await API.productPricing(productId) } catch { /* پیام اصلی حفظ می‌شود */ }
    }
  } finally {
    pricingAction.value = false
  }
}

async function inspectProduct(item) {
  detailsOpen.value = true
  const row = rows.value.find(candidate => String(candidate.id) === String(item.product_id))
  await selectProduct(row || { id: item.product_id })
  await nextTick()
  productDetails.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function refreshPricingDetails() {
  // Local actions already update their own detail; bulk approvals must refresh it too.
  if (pricingAction.value || pricingSaving.value) return
  if (loading.value) refreshAfterLoad = true
  else load()
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

onMounted(() => {
  load()
  window.addEventListener(pricingWarningEvent, refreshPricingDetails)
})
onUnmounted(() => {
  detailRequest++
  refreshAfterLoad = false
  window.removeEventListener(pricingWarningEvent, refreshPricingDetails)
})
</script>

<style scoped>

.costing-center{min-width:0}.eyebrow{color:var(--primary)!important;font-size:.7rem;font-weight:800}
.pricing-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem}.pricing-summary article{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.8rem 1rem;border:1px solid var(--border);border-radius:var(--card-radius);background:var(--surface)}.pricing-summary span{color:var(--muted);font-size:.78rem}.pricing-summary strong{font-size:1.25rem}.selected-summary strong{color:var(--primary)}
.product-details{min-width:0;scroll-margin-top:88px;border:1px solid var(--border);border-radius:var(--card-radius);background:var(--surface)}.product-details>summary{padding:1rem;font-size:.9rem;font-weight:700;cursor:pointer}.product-details>summary small{margin-inline-start:.5rem;color:var(--muted);font-size:.7rem;font-weight:400}.product-details[open]{padding:0 1rem 1rem}.product-details[open]>summary{padding-inline:0}.cost-filter{margin-bottom:1rem}
.costing-layout{display:grid;grid-template-columns:minmax(210px,260px) minmax(0,1fr);align-items:start;gap:1rem}.product-browser,.cost-detail{min-width:0;border:1px solid var(--border);border-radius:var(--card-radius);background:var(--surface)}.product-browser{position:sticky;top:88px;max-height:calc(100dvh - 112px);overflow:hidden;scroll-margin-top:88px}.product-browser>header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.75rem;border-bottom:1px solid var(--border)}.product-browser>header label{display:flex;align-items:center;gap:.3rem;color:var(--muted);font-size:.65rem}.product-browser>header select{width:auto;font:inherit}.product-browser h3{margin:0;font-size:.95rem}.product-browser small{color:var(--muted);font-size:.7rem}
.product-list{max-height:calc(100dvh - 250px);overflow-y:auto;padding:.35rem}.product-list>button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:.7rem;padding:.6rem .65rem;border:1px solid transparent;border-radius:var(--control-radius);background:transparent;color:var(--text);text-align:right;font:inherit;cursor:pointer}.product-list>button:hover{background:var(--surface-hover)}.product-list>button.selected{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 8%,var(--surface))}.product-list button span{display:grid;gap:.2rem;min-width:0}.product-list button strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}.product-list button small{color:var(--muted);font-size:.64rem}.product-list button b{flex:none;color:var(--primary);font-size:.73rem}
.product-pagination{display:grid;gap:.4rem;padding:.55rem .65rem;border-top:1px solid var(--border);color:var(--muted);font-size:.64rem}.product-pagination>div{display:flex;align-items:center;justify-content:space-between;gap:.35rem}.product-pagination button,.detail-state button{padding:.3rem .45rem;border:1px solid var(--border);border-radius:var(--button-radius);background:var(--surface);color:var(--text);font:inherit;cursor:pointer}button:disabled{opacity:.5;cursor:not-allowed}
.cost-detail{padding:1rem}.detail-heading{padding-bottom:.8rem;border-bottom:1px solid var(--border)}.product-identity{display:flex;align-items:center;gap:.75rem;min-width:0}.product-identity img{width:52px;height:52px;border-radius:12px;object-fit:cover}.product-identity div{display:grid;gap:.12rem}.product-identity span,.product-identity small{color:var(--muted);font-size:.68rem}.product-identity h3{margin:0;font-size:1.1rem}
.warning-card{display:grid;gap:.25rem;margin-top:1rem;padding:.75rem .9rem;border:1px solid var(--warning-text);border-radius:var(--control-radius);background:var(--warning-subtle)}.warning-card strong{font-size:.8rem}.warning-card span{color:var(--warning-text);font-size:.72rem}
.cost-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem;margin-top:1rem}.cost-metrics article{display:grid;gap:.3rem;padding:.8rem;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface-subtle)}.cost-metrics span{color:var(--muted);font-size:.68rem}.cost-metrics strong{font-size:.88rem}.cost-metrics .total{border-color:var(--primary)}.cost-metrics .total strong{color:var(--primary)}.formula{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:.65rem;padding:.65rem .8rem;border-radius:var(--control-radius);background:var(--brand-panel);color:var(--on-brand);font-size:.75rem}
.detail-state{min-height:200px;display:grid;place-content:center;justify-items:center;gap:.5rem;color:var(--muted);text-align:center;font-size:.8rem}.detail-state.error{color:var(--danger)}
.pricing-panel{margin-top:1rem;border:1px solid var(--border);border-radius:var(--card-radius);overflow:hidden}.pricing-panel>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:.9rem 1rem;background:var(--surface-subtle)}.pricing-panel h3{margin:0;font-size:.9rem}.pricing-panel p{margin:.15rem 0 0;color:var(--muted);font-size:.68rem}.pricing-status{padding:.2rem .5rem;border:1px solid currentColor;border-radius:999px;color:var(--muted);font-size:.65rem;white-space:nowrap}.status-review_required{color:var(--warning-text);background:var(--warning-subtle)}.status-incomplete{color:var(--danger-text);background:var(--color-danger-subtle)}.status-approved{color:var(--success-text);background:var(--color-success-subtle)}
.pricing-policy{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end;gap:.65rem;padding:1rem}.pricing-policy label{display:grid;gap:.35rem;color:var(--muted);font-size:.68rem}.pricing-policy input,.pricing-policy select{width:100%;min-width:0;font:inherit}.input-suffix{display:flex;align-items:center}.input-suffix b{padding:0 .5rem}.pricing-error{margin:0 1rem .8rem;padding:.65rem .8rem;border-radius:var(--control-radius);background:var(--color-danger-subtle);color:var(--danger-text);font-size:.72rem}.pricing-warning{margin:0 1rem 1rem}
.recommendation-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.55rem;padding:0 1rem 1rem}.recommendation-grid article{display:grid;gap:.25rem;padding:.65rem;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface-subtle)}.recommendation-grid span{color:var(--muted);font-size:.64rem}.recommendation-grid strong{font-size:.76rem}.recommendation-grid .suggestion{border-color:var(--primary)}.recommendation-grid .suggestion strong{color:var(--primary)}.recommendation-note{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:0 1rem;padding:.65rem .75rem;border-inline-start:3px solid var(--primary);background:var(--surface-subtle);font-size:.7rem}.recommendation-note small{color:var(--muted)}
.pricing-actions{display:flex;flex-wrap:wrap;gap:.6rem;padding:1rem}.secondary-action{padding:.55rem .8rem;border:1px solid var(--border);border-radius:var(--button-radius);background:var(--surface);color:var(--text);font:inherit;font-size:.72rem;cursor:pointer}.options-note{padding:0 1rem .85rem!important}.alert-empty{padding:.85rem 1rem;color:var(--muted);font-size:.72rem;text-align:center}.pricing-history{margin:0 1rem 1rem;border-top:1px solid var(--border);font-size:.72rem}.pricing-history summary{padding:.8rem 0;color:var(--primary);font-weight:700;cursor:pointer}.history-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;padding-bottom:.75rem}.history-columns h4{margin:.15rem 0 .5rem}.history-columns p{display:flex;justify-content:space-between;gap:.5rem;padding:.4rem 0;border-bottom:1px solid var(--border)}.history-columns small{white-space:nowrap}
@media(max-width:1150px){.costing-layout{grid-template-columns:1fr}.product-browser{position:static;max-height:none}.product-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));max-height:none;overflow:visible}.recommendation-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.pricing-summary{gap:.4rem}.pricing-summary article{align-items:flex-start;flex-direction:column;padding:.65rem}.pricing-summary span{font-size:.68rem}.pricing-panel>header,.recommendation-note,.formula{align-items:stretch;flex-direction:column}.pricing-policy{grid-template-columns:1fr}.cost-metrics,.recommendation-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.history-columns{grid-template-columns:1fr}.pricing-actions>*{width:100%}.product-details>summary small{display:block;margin-top:.3rem}.product-details[open]{padding:0 .65rem .65rem}}
@media(max-width:480px){.product-list{grid-template-columns:1fr}.cost-detail{padding:.75rem}.product-browser>header{align-items:flex-start;flex-direction:column}.product-pagination>div{flex-wrap:wrap}}

</style>
