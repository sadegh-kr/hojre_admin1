<template>
  <section class="bulk-pricing" dir="rtl" aria-label="انتخاب پیشنهادهای قیمت">
    <header><h3>انتخاب و بازبینی قیمت‌ها</h3><button type="button" :disabled="loading" @click="load">به‌روزرسانی پیشنهادها</button></header>
    <p class="safety-note" role="status">انتخاب و بازبینی هیچ قیمتی را تغییر نمی‌دهد؛ فقط تأیید نهایی مدیر، همه قیمت‌های انتخاب‌شده را یکجا اعمال می‌کند.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="loading">در حال دریافت پیشنهادها…</p>
    <template v-else>
      <div class="toolbar">
        <input v-model="search" type="search" placeholder="جستجوی محصول" aria-label="جستجو در پیشنهادهای قیمت" />
        <label class="page-size">تعداد در صفحه<select v-model.number="pageSize" aria-label="تعداد پیشنهاد قیمت در هر صفحه"><option :value="10">۱۰</option><option :value="20">۲۰</option><option :value="50">۵۰</option></select></label>
        <button type="button" :disabled="!eligibleVisible.length" @click="selected = selectVisible(pageRows, selected)">انتخاب همه موارد مجازِ نمایش‌داده‌شده</button>
        <button type="button" :disabled="!selectedRows.length" @click="selected = []">حذف همه انتخاب‌ها</button>
        <span>{{ number(selectedRows.length) }} محصول انتخاب شده</span>
      </div>
      <div class="table-wrap"><table><thead><tr><th>اعمال</th><th>محصول</th><th>قیمت فعلی</th><th>بهای تولید</th><th>افزوده</th><th>گردکردن</th><th>پیشنهاد خام</th><th>پیشنهاد نهایی</th><th>تفاوت</th><th>تغییر</th><th>وضعیت</th></tr></thead>
        <tbody><tr v-for="row in pageRows" :key="row.product_id">
          <td><input type="checkbox" :checked="selected.includes(row.product_id)" :disabled="!isEligible(row)" :aria-label="`انتخاب ${row.product_name}`" @change="selected = toggleSelection(selected, row)" /></td>
          <td>{{ row.product_name }}</td><td>{{ money(row.current_price) }}</td><td>{{ amount(row.recommendation?.production_cost) }}</td>
          <td>{{ percent(row.recommendation?.markup_percentage) }}</td><td>{{ rounding(row.recommendation?.rounding_step) }}</td>
          <td>{{ amount(row.recommendation?.unrounded_suggested_price) }}</td><td>{{ amount(row.recommendation?.suggested_price) }}</td>
          <td>{{ amount(row.recommendation?.difference_amount) }}</td><td>{{ percent(row.recommendation?.difference_percentage) }}</td>
          <td>{{ row.recommendation?.approval_blocker?.message || row.recommendation?.reason_detail || 'سیاست قیمت‌گذاری ثبت نشده است' }}</td>
        </tr></tbody></table></div>
      <p v-if="!filtered.length">محصولی برای نمایش وجود ندارد.</p>
      <nav v-if="filtered.length" class="pagination" aria-label="صفحه‌بندی پیشنهادهای قیمت">
        <span>نمایش {{ number(pagination.rangeStart) }} تا {{ number(pagination.rangeEnd) }} از {{ number(pagination.total) }} محصول</span>
        <div><button type="button" :disabled="pagination.page <= 1" @click="tablePage = pagination.page - 1">قبلی</button><span>صفحه {{ number(pagination.page) }} از {{ number(pagination.totalPages) }}</span><button type="button" :disabled="pagination.page >= pagination.totalPages" @click="tablePage = pagination.page + 1">بعدی</button></div>
      </nav>
      <button ref="previewButton" type="button" :disabled="!selectedRows.length" @click="preview = true">بررسی قیمت‌های انتخاب‌شده</button>
    </template>
    <Teleport to="body"><div v-if="preview" class="preview-backdrop" @click.self="closePreview" @keydown.esc="closePreview">
      <section ref="previewDialog" class="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="bulk-preview-title" tabindex="-1">
        <h3 id="bulk-preview-title">بازبینی {{ number(selectedRows.length) }} قیمت انتخاب‌شده</h3>
        <p>اعمال نهایی قیمت فروش منتشرشده را تغییر می‌دهد. قیمت گزینه‌های جداگانه تغییر نمی‌کند و باید جداگانه بررسی شود.</p>
        <div class="table-wrap"><table><thead><tr><th>محصول</th><th>قیمت فعلی</th><th>بهای تولید</th><th>پیشنهاد نهایی</th><th>تفاوت</th><th>افزوده</th><th>گردکردن</th></tr></thead><tbody>
          <tr v-for="row in selectedRows" :key="row.product_id"><td>{{ row.product_name }}</td><td>{{ money(row.current_price) }}</td><td>{{ amount(row.recommendation.production_cost) }}</td><td>{{ amount(row.recommendation.suggested_price) }}</td><td>{{ amount(row.recommendation.difference_amount) }}</td><td>{{ percent(row.recommendation.markup_percentage) }}</td><td>{{ rounding(row.recommendation.rounding_step) }}</td></tr>
        </tbody></table></div>
        <p class="safety-note">با تأیید نهایی، فقط همین قیمت‌های انتخاب‌شده در یک تراکنش کامل اعمال می‌شوند. در صورت نامعتبر بودن حتی یک پیشنهاد، هیچ قیمتی تغییر نمی‌کند.</p>
        <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
        <footer><button type="button" :disabled="submitting" @click="closePreview">انصراف</button><button type="button" :disabled="submitting || !selectedRows.length" @click="confirmApproval">{{ submitting ? 'در حال اعمال…' : 'تأیید و اعمال قیمت‌های انتخاب‌شده' }}</button></footer>
      </section>
    </div></Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import API from '@/api/product-cost.api.js'
import { costErrorMessage, formatCostNumber as number, formatMoney as money } from '@/utils/costControl'
import { isEligible, selectVisible, toggleSelection, visibleRows } from '@/utils/bulkPricingSelection'
import { pricingWarningEvent } from '@/utils/pricingWarnings'
import { paginateRows } from '@/utils/clientPagination'

const rows = ref([])
const search = ref('')
const tablePage = ref(1)
const pageSize = ref(10)
const selected = ref([])
const preview = ref(false)
const previewDialog = ref(null)
const previewButton = ref(null)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const submitError = ref('')
let generation = 0
const filtered = computed(() => visibleRows(rows.value, search.value))
const pagination = computed(() => paginateRows(filtered.value, tablePage.value, pageSize.value))
const pageRows = computed(() => pagination.value.rows)
const eligibleVisible = computed(() => pageRows.value.filter(isEligible))
const selectedRows = computed(() => rows.value.filter(row => isEligible(row) && selected.value.includes(row.product_id)))
const amount = value => value == null ? 'نامشخص' : money(value)
const percent = value => value == null ? 'نامشخص' : `${number(value)}٪`
const rounding = value => value == null ? 'نامشخص' : Number(value) === 0 ? 'بدون گردکردن' : `رو به بالا تا ${money(value)}`
watch(search, () => { tablePage.value = 1; selected.value = []; preview.value = false })
watch(pageSize, () => { tablePage.value = 1 })
watch(() => pagination.value.page, page => { if (tablePage.value !== page) tablePage.value = page })
watch(preview, async open => {
  await nextTick()
  if (open) previewDialog.value?.focus()
  else previewButton.value?.focus()
})
async function load() {
  const request = ++generation
  selected.value = []
  tablePage.value = 1
  preview.value = false
  rows.value = []
  error.value = ''
  loading.value = true
  try {
    const data = await API.bulkPricingPreview()
    if (request === generation) rows.value = data.results || []
  }
  catch (cause) { if (request === generation) error.value = costErrorMessage(cause) }
  finally { if (request === generation) loading.value = false }
}
function closePreview() {
  if (!submitting.value) preview.value = false
}
async function confirmApproval() {
  if (submitting.value || !selectedRows.value.length) return
  const recommendations = selectedRows.value.map(row => ({
    recommendation_id: row.recommendation.id,
    revision: row.recommendation.revision,
  }))
  submitting.value = true
  submitError.value = ''
  try {
    await API.bulkPricingApprove(recommendations)
    selected.value = []
    preview.value = false
  }
  catch (cause) {
    const message = costErrorMessage(cause)
    if (cause.response?.status === 409) {
      await load()
      error.value = message
    } else submitError.value = message
  }
  finally { submitting.value = false }
}
function refreshWhenVisible() { if (!document.hidden) load() }
onMounted(() => {
  load()
  window.addEventListener(pricingWarningEvent, load)
  document.addEventListener('visibilitychange', refreshWhenVisible)
})
onUnmounted(() => {
  generation++
  window.removeEventListener(pricingWarningEvent, load)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
})
</script>

<style scoped>
.bulk-pricing { border: 1px solid var(--border-color, #ccc); border-radius: 12px; padding: .85rem; margin: .75rem 0; min-width: 0; }
header, .toolbar, footer { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; justify-content: space-between; }
header h3 { margin: 0; } .toolbar input { min-width: 180px; max-width: 100%; flex: 1; }.page-size{display:flex;align-items:center;gap:.4rem;color:var(--muted);font-size:.75rem}.page-size select{padding:.35rem;border:1px solid var(--border-color,#ccc);border-radius:7px;background:var(--surface,#fff);color:var(--text,#222)}
.safety-note { padding: .6rem; border-inline-start: 3px solid #bc8130; }
.submit-error { padding: .6rem; border-radius: 8px; background: color-mix(in srgb, var(--danger, #b42318) 10%, transparent); color: var(--danger, #b42318); }
.table-wrap { max-width: 100%; overflow-x: auto; margin: .8rem 0; }
.pagination{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.65rem;margin:.7rem 0;color:var(--muted);font-size:.75rem}.pagination div{display:flex;align-items:center;gap:.5rem}.pagination button{min-width:64px}
table { border-collapse: collapse; width: 100%; font-size: .85rem; }
td, th { padding: .5rem; border-bottom: 1px solid var(--border-color, #ccc); text-align: right; white-space: nowrap; }
button, input { font: inherit; } button { cursor: pointer; } button:disabled { cursor: not-allowed; opacity: .55; }
.preview-backdrop { position: fixed; inset: 0; z-index: 10000; background: #0009; display: grid; place-items: center; padding: 1rem; }
.preview-dialog { direction: rtl; background: var(--surface, #fff); color: var(--text, #222); border-radius: 12px; padding: 1rem; width: min(100%, 900px); max-height: 90vh; overflow: auto; }
@media(max-width:640px){.toolbar>*{width:100%}.page-size{justify-content:space-between}.pagination{align-items:stretch;flex-direction:column}.pagination div{justify-content:space-between}}
</style>
