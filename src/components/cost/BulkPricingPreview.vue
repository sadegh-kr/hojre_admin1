<template>
  <section class="bulk-pricing" dir="rtl" aria-label="انتخاب پیشنهادهای قیمت">
    <header><div><h3>پیشنهاد قیمت محصولات</h3><small>مبالغ به تومان · اعمال قیمت فقط با تأیید نهایی</small></div><button type="button" :disabled="loading || submitting" @click="load">به‌روزرسانی پیشنهادها</button></header>
    <p v-if="error" class="submit-error" role="alert">{{ error }}</p>
    <p v-if="loading" class="table-state" role="status">در حال دریافت پیشنهادها…</p>
    <template v-else>
      <div class="toolbar">
        <input v-model="search" type="search" placeholder="جستجوی محصول" aria-label="جستجو در پیشنهادهای قیمت" :disabled="submitting" />
        <select v-model="statusFilter" aria-label="فیلتر وضعیت پیشنهاد قیمت" :disabled="submitting">
          <option value="all">همه وضعیت‌ها</option><option value="review_required">نیازمند بررسی</option><option value="calculated">محاسبه‌شده</option><option value="incomplete">اطلاعات ناقص</option>
        </select>
        <label class="page-size">تعداد در صفحه<select v-model.number="pageSize" aria-label="تعداد پیشنهاد قیمت در هر صفحه"><option :value="10">۱۰</option><option :value="20">۲۰</option><option :value="50">۵۰</option></select></label>
      </div>
      <div class="selection-tools">
        <button type="button" :disabled="submitting || !eligibleVisible.length" @click="selected = selectVisible(pageRows, selected)">انتخاب همه مجازهای این صفحه</button>
        <button type="button" :disabled="submitting || !selectedRows.length" @click="selected = []">پاک‌کردن انتخاب‌ها</button>
        <small>جستجو و تغییر فیلتر، انتخاب‌ها را پاک می‌کند.</small>
      </div>
      <div class="table-wrap" tabindex="0" role="region" aria-label="جدول پیشنهاد قیمت محصولات"><table><thead><tr><th scope="col">انتخاب</th><th scope="col">محصول</th><th scope="col">قیمت فعلی</th><th scope="col">بهای تولید</th><th scope="col">قیمت پیشنهادی</th><th scope="col">تغییر قیمت</th><th scope="col">سیاست قیمت</th><th scope="col">وضعیت</th><th scope="col">بررسی و تأیید</th></tr></thead>
        <tbody><tr v-for="row in pageRows" :key="row.product_id" :class="{ 'is-selected': selected.includes(row.product_id) }">
          <td class="selection-cell"><input type="checkbox" :checked="selected.includes(row.product_id)" :disabled="submitting || !isEligible(row)" :aria-label="`انتخاب ${row.product_name}`" @change="selected = toggleSelection(selected, row)" /></td>
          <th scope="row" class="product-cell">{{ row.product_name }}</th><td>{{ money(row.current_price) }}</td><td>{{ amount(row.recommendation?.production_cost) }}</td>
          <td class="suggested-price"><strong>{{ amount(row.recommendation?.suggested_price) }}</strong><small>پیش از گردکردن: {{ amount(row.recommendation?.unrounded_suggested_price) }}</small></td>
          <td :class="`change-${changeKind(row.recommendation?.difference_amount)}`"><strong>{{ changeLabel(row.recommendation?.difference_amount) }} · {{ amount(row.recommendation?.difference_amount) }}</strong><small>{{ percent(row.recommendation?.difference_percentage) }}</small></td>
          <td><span>افزوده {{ percent(row.recommendation?.markup_percentage) }}</span><small>{{ rounding(row.recommendation?.rounding_step) }}</small></td>
          <td class="status-cell"><span :class="['price-status', `status-${row.recommendation?.status || 'incomplete'}`]">{{ row.recommendation?.status_display || 'بدون سیاست قیمت' }}</span><small>{{ row.recommendation?.approval_blocker?.message || row.recommendation?.reason_detail || 'سیاست قیمت‌گذاری ثبت نشده است' }}</small></td>
          <td><button type="button" :aria-label="`جزئیات و تأیید ${row.product_name}`" :disabled="submitting" @click="emit('inspect', row)">جزئیات و تأیید تکی</button></td>
        </tr><tr v-if="!filtered.length"><td colspan="9" class="table-state">{{ error ? 'دریافت پیشنهادها انجام نشد؛ دوباره تلاش کنید.' : search || statusFilter !== 'all' ? 'محصولی مطابق جستجو و وضعیت پیدا نشد.' : 'محصولی برای نمایش وجود ندارد.' }}</td></tr></tbody></table></div>
      <nav v-if="filtered.length" class="pagination" aria-label="صفحه‌بندی پیشنهادهای قیمت">
        <span>نمایش {{ number(pagination.rangeStart) }} تا {{ number(pagination.rangeEnd) }} از {{ number(pagination.total) }} محصول</span>
        <div><button type="button" :disabled="pagination.page <= 1" @click="tablePage = pagination.page - 1">قبلی</button><span>صفحه {{ number(pagination.page) }} از {{ number(pagination.totalPages) }}</span><button type="button" :disabled="pagination.page >= pagination.totalPages" @click="tablePage = pagination.page + 1">بعدی</button></div>
      </nav>
      <footer class="apply-bar">
        <div aria-live="polite"><strong>{{ number(selectedRows.length) }} محصول انتخاب‌شده</strong><small>انتخاب‌ها در جابه‌جایی صفحه‌ها حفظ می‌شوند.</small></div>
        <button ref="previewButton" type="button" class="cost-primary" :disabled="submitting || !selectedRows.length" @click="submitError = ''; preview = true">بازبینی و اعمال قیمت‌های انتخاب‌شده</button>
      </footer>
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
        <footer><button type="button" :disabled="submitting" @click="closePreview">انصراف</button><button type="button" class="cost-primary" :disabled="submitting || !selectedRows.length" @click="confirmApproval">{{ submitting ? 'در حال اعمال…' : 'تأیید و اعمال قیمت‌های انتخاب‌شده' }}</button></footer>
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
import { changeKind, changeLabel } from '@/utils/pricingPresentation'

const emit = defineEmits(['summary', 'inspect'])
const rows = ref([])
const search = ref('')
const statusFilter = ref('all')
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
let refreshPending = false
let conflictMessage = ''
const filtered = computed(() => visibleRows(rows.value, search.value).filter(row => statusFilter.value === 'all' || row.recommendation?.status === statusFilter.value))
const pagination = computed(() => paginateRows(filtered.value, tablePage.value, pageSize.value))
const pageRows = computed(() => pagination.value.rows)
const eligibleVisible = computed(() => pageRows.value.filter(isEligible))
const selectedRows = computed(() => rows.value.filter(row => isEligible(row) && selected.value.includes(row.product_id)))
const amount = value => value == null ? 'نامشخص' : money(value)
const percent = value => value == null ? 'نامشخص' : `${number(value)}٪`
const rounding = value => value == null ? 'نامشخص' : Number(value) === 0 ? 'بدون گردکردن' : `رو به بالا تا ${money(value)}`
watch(() => ({
  eligible: rows.value.filter(isEligible).length,
  review: rows.value.filter(row => row.recommendation?.status === 'review_required').length,
  selected: selectedRows.value.length,
  unavailable: loading.value || Boolean(error.value),
}), summary => emit('summary', summary.unavailable ? null : summary), { immediate: true })
watch(search, () => { tablePage.value = 1; selected.value = []; preview.value = false })
watch(statusFilter, () => { tablePage.value = 1; selected.value = []; preview.value = false })
watch(pageSize, () => { tablePage.value = 1 })
watch(() => pagination.value.page, page => { if (tablePage.value !== page) tablePage.value = page })
watch(preview, async open => {
  await nextTick()
  if (open) previewDialog.value?.focus()
  else previewButton.value?.focus()
})
async function load() {
  if (submitting.value) { refreshPending = true; return }
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
  if (!preview.value || submitting.value || !selectedRows.value.length) return
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
    refreshPending = true
  }
  catch (cause) {
    const message = costErrorMessage(cause)
    if (cause.response?.status === 409) {
      selected.value = []
      preview.value = false
      refreshPending = true
      conflictMessage = message
    } else {
      submitError.value = message
      if (refreshPending) conflictMessage = message
    }
  }
  finally {
    submitting.value = false
    if (refreshPending) {
      refreshPending = false
      await load()
      if (conflictMessage) error.value = [conflictMessage, error.value].filter(Boolean).join(' ')
      conflictMessage = ''
    }
  }
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

.bulk-pricing{min-width:0;padding:1rem;border:1px solid var(--border);border-radius:var(--card-radius);background:var(--surface);box-shadow:var(--shadow)}
header,.toolbar,.selection-tools,footer{display:flex;align-items:center;flex-wrap:wrap;gap:.65rem;justify-content:space-between}
header h3{margin:0;font-size:1rem}small{display:block;color:var(--muted);font-size:.7rem;line-height:1.7}header small{margin-top:.2rem}
.toolbar{margin-top:1rem}.toolbar input{flex:1;min-width:180px;max-width:100%}.toolbar>select{width:auto}.page-size{display:flex;align-items:center;gap:.4rem;color:var(--muted);font-size:.75rem}.page-size select{width:auto}
.selection-tools{justify-content:flex-start;margin-top:.65rem}.selection-tools small{margin-inline-start:auto}
button,input,select{font:inherit}button{padding:.5rem .7rem;border:1px solid var(--border-strong);border-radius:var(--button-radius);background:var(--surface);color:var(--text);font-size:.75rem;cursor:pointer}button:hover:not(:disabled){border-color:var(--primary);background:var(--surface-hover)}button:disabled{cursor:not-allowed;opacity:.55}.cost-primary,.cost-primary:hover:not(:disabled){background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.table-wrap{max-width:100%;max-height:65vh;overflow:auto;margin:.8rem 0;border:1px solid var(--border);border-radius:var(--control-radius)}
table{border-collapse:separate;border-spacing:0;width:100%;font-size:.78rem}td,th{padding:.7rem .65rem;border-bottom:1px solid var(--border);text-align:start;white-space:nowrap;vertical-align:middle;font-variant-numeric:tabular-nums}thead th{position:sticky;top:0;z-index:1;background:var(--surface-subtle);color:var(--muted);font-size:.7rem}tbody tr:last-child>*{border-bottom:0}tbody tr:hover{background:var(--surface-hover)}tbody tr.is-selected{background:color-mix(in srgb,var(--primary) 9%,var(--surface))}tbody tr.is-selected .selection-cell{box-shadow:inset -3px 0 var(--primary)}
.selection-cell{text-align:center}.selection-cell input{width:18px;height:18px;min-height:18px;accent-color:var(--primary);vertical-align:middle;cursor:pointer}.product-cell{min-width:140px;max-width:210px;white-space:normal;overflow-wrap:anywhere}.suggested-price>strong{color:var(--primary)}.status-cell{min-width:170px;max-width:240px;white-space:normal}.price-status{display:inline-block;padding:.2rem .5rem;border-radius:99px;background:var(--surface-subtle);color:var(--muted);font-size:.68rem}.status-review_required{background:var(--warning-subtle);color:var(--warning-text)}.status-incomplete{background:var(--color-danger-subtle);color:var(--danger-text)}.status-approved{background:var(--color-success-subtle);color:var(--success-text)}
.change-increase{color:var(--danger-text)}.change-decrease{color:var(--success-text)}.change-unchanged,.change-unknown{color:var(--muted)}
.table-state{padding:1.5rem;text-align:center;white-space:normal;color:var(--muted)}.pagination{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.65rem;margin:.7rem 0;color:var(--muted);font-size:.75rem}.pagination div{display:flex;align-items:center;gap:.5rem}.pagination button{min-width:64px}
.apply-bar{margin-top:1rem;padding-top:.85rem;border-top:1px solid var(--border)}.apply-bar strong{font-size:.82rem}.safety-note{padding:.6rem;border-inline-start:3px solid var(--warning-text);font-size:.8rem}.submit-error{padding:.7rem;border-radius:var(--control-radius);background:var(--color-danger-subtle);color:var(--danger-text)}
.preview-backdrop{position:fixed;inset:0;z-index:10000;background:#0009;display:grid;place-items:center;padding:1rem}.preview-dialog{direction:rtl;background:var(--surface);color:var(--text);border-radius:var(--card-radius);padding:1rem;width:min(100%,1000px);max-height:90vh;overflow:auto;font-family:var(--font-family-primary)}.preview-dialog h3{margin-top:0}.preview-dialog p{font-size:.82rem;line-height:1.9}
@media(max-width:640px){.bulk-pricing{padding:.75rem}.toolbar>input{flex:1 1 100%;width:100%}.toolbar>select{flex:1;min-width:0;width:auto}.page-size{flex:none;width:auto;justify-content:space-between}.selection-tools small{margin-inline-start:0;width:100%}.pagination{align-items:stretch;flex-direction:column}.pagination div{justify-content:space-between}.apply-bar{align-items:stretch;flex-direction:column}.preview-dialog footer{flex-direction:column;align-items:stretch}}

</style>
