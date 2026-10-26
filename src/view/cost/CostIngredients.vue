<template>
  <section class="cost-page">
    <header class="cost-page-heading">
      <div><h2>مواد اولیه</h2><p>با ثبت ماده اولیه، قیمت هر واحد محاسبه و ذخیره می‌شود و ماده برای استفاده در دستور تولید در دسترس خواهد بود.</p></div>
      <button class="cost-primary" @click="openCreate">ماده اولیه جدید</button>
    </header>

    <nav class="materials-nav" aria-label="دسترسی‌های مواد و انبار">
      <RouterLink to="/dashboard/inventory/materials">مواد اولیه</RouterLink>
      <RouterLink to="/dashboard/inventory/recipes">دستور تولید</RouterLink>
    </nav>

    <div v-if="context.branch_name" class="operational-context" role="status">
      ثبت ضایعات در این صفحه یک رویداد مستقل است و موجودی فیزیکی را کم نمی‌کند.
    </div>
    <div v-if="legacyUnscopedCount" class="legacy-note" role="note">
      {{ number(legacyUnscopedCount) }} ماده تاریخی فاقد مالکیت قابل اثبات است و برای جلوگیری از اختلاط اطلاعات مجموعه‌ها در عملیات جدید نمایش داده نمی‌شود.
    </div>

    <form class="cost-filter" @submit.prevent="search">
      <input v-model.trim="query" placeholder="جستجوی نام ماده اولیه" @input="debouncedSearch"/>
      <select v-model="activeFilter" @change="search"><option value="">همه وضعیت‌ها</option><option value="true">فعال</option><option value="false">غیرفعال</option></select>
      <button class="cost-primary">جستجو</button>
    </form>

    <div v-if="error" class="cost-notice" role="alert">{{ error }} <button @click="load">تلاش مجدد</button></div>

    <div class="materials-table">
      <header><span>ماده اولیه</span><span>دسته‌بندی</span><span>قیمت مرجع</span><span>مبنای مؤثر رسپی</span><span>وضعیت</span><span>عملیات</span></header>
      <article v-for="item in ingredients" :key="item.id">
        <div class="material-name"><strong>{{ item.name }}</strong><small>{{ item.unit_display }}</small></div>
        <span>{{ item.category_name || 'بدون دسته‌بندی' }}</span>
        <strong>{{ price(item.purchase_price) }}</strong>
        <div class="effective-cost"><strong>{{ price(effectiveCost(item)) }}</strong><small>{{ sourceLabel(item.cost_source) }}</small></div>
        <span :class="['status', item.is_active ? 'on' : 'off']">{{ item.is_active ? 'فعال' : 'غیرفعال' }}</span>
        <footer><button class="row-action" @click="openEdit(item)">ویرایش</button><button class="row-action waste" :disabled="!item.waste_eligible" @click="openWaste(item)">ثبت ضایعات</button><button class="danger-action" @click="remove(item)">حذف</button></footer>
      </article>
      <div v-if="loading" class="empty-resource">در حال دریافت مواد اولیه…</div>
      <div v-else-if="!ingredients.length" class="empty-resource">ماده اولیه‌ای پیدا نشد.</div>
    </div>

    <div v-if="pagination.total_pages > 1" class="resource-pagination">
      <button class="cost-secondary" :disabled="!pagination.has_previous" @click="goPage(pagination.page - 1)">قبلی</button>
      <span>صفحه {{ number(pagination.page) }} از {{ number(pagination.total_pages) }}</span>
      <button class="cost-secondary" :disabled="!pagination.has_next" @click="goPage(pagination.page + 1)">بعدی</button>
    </div>

    <IngredientModal
      v-model="modalOpen"
      :ingredient="editing"
      mode="catalog"
      :units="meta.units"
      :reference-units="meta.reference_units"
      :categories="categories"
      :loading="saving"
      :server-error="modalError"
      :field-errors="fieldErrors"
      @category-created="handleCategoryCreated"
      @submit="save"
    />
    <IngredientWasteModal
      v-model="wasteModalOpen"
      :ingredient="wasteIngredient"
      :reference-units="meta.reference_units"
      :loading="wasteSaving"
      :server-error="wasteError"
      :field-errors="wasteFieldErrors"
      @submit="saveWaste"
    />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import API from '@/api/product-cost.api.js'
import IngredientModal from '@/components/modals/IngredientModal.vue'
import IngredientWasteModal from '@/components/modals/IngredientWasteModal.vue'
import { costErrorMessage, formatCostNumber as number, formatMoney as money } from '@/utils/costControl'
import { costSourceLabel, effectiveIngredientCost } from '@/utils/ingredientCost'

const ingredients = ref([])
const categories = ref([])
const query = ref('')
const activeFilter = ref('')
const editing = ref(null)
const modalOpen = ref(false)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const modalError = ref('')
const fieldErrors = ref({})
const wasteModalOpen = ref(false)
const wasteIngredient = ref(null)
const wasteSaving = ref(false)
const wasteError = ref('')
const wasteFieldErrors = ref({})
const legacyUnscopedCount = ref(0)
const context = reactive({ restaurant_name: '', branch_name: '' })
const meta = reactive({ units: [], reference_units: [] })
const pagination = reactive({ page: 1, page_size: 10, total_pages: 1, has_next: false, has_previous: false })
let timer

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [metadata, data, categoryData] = await Promise.all([
      meta.units.length ? Promise.resolve(meta) : API.meta(),
      API.operationalIngredients({ search: query.value, is_active: activeFilter.value, page: pagination.page, page_size: pagination.page_size }),
      API.materialCategories({ page_size: 200, is_active: true }),
    ])
    Object.assign(meta, metadata)
    ingredients.value = data.results || []
    Object.assign(pagination, data)
    legacyUnscopedCount.value = data.legacy_unscoped_count || 0
    Object.assign(context, data.context || {})
    categories.value = categoryData.results || []
  } catch (cause) { error.value = costErrorMessage(cause) } finally { loading.value = false }
}

function openCreate() { editing.value = null; modalError.value = ''; fieldErrors.value = {}; modalOpen.value = true }
function openEdit(item) { editing.value = item; modalError.value = ''; fieldErrors.value = {}; modalOpen.value = true }
function handleCategoryCreated(category) {
  if (!categories.value.some(item => item.id === category.id)) categories.value = [...categories.value, category].sort((a, b) => a.name.localeCompare(b.name, 'fa'))
}
async function save(payload) {
  if (saving.value) return
  saving.value = true; modalError.value = ''; fieldErrors.value = {}
  try {
    if (editing.value) await API.updateOperationalIngredient(editing.value.id, payload)
    else await API.createOperationalIngredient(payload)
    modalOpen.value = false
    await load()
  } catch (cause) {
    modalError.value = costErrorMessage(cause)
    fieldErrors.value = cause.cost?.errors || {}
  } finally { saving.value = false }
}
async function remove(item) {
  if (!confirm(`ماده اولیه «${item.name}» حذف شود؟`)) return
  try { await API.deleteOperationalIngredient(item.id); await load() } catch (cause) { error.value = costErrorMessage(cause) }
}
function openWaste(item) {
  if (!item.waste_eligible) return
  wasteIngredient.value = item
  wasteError.value = ''
  wasteFieldErrors.value = {}
  wasteModalOpen.value = true
}
async function saveWaste(payload) {
  if (wasteSaving.value) return
  wasteSaving.value = true
  wasteError.value = ''
  wasteFieldErrors.value = {}
  try {
    await API.createIngredientWaste(payload)
    wasteModalOpen.value = false
  } catch (cause) {
    wasteError.value = costErrorMessage(cause)
    wasteFieldErrors.value = cause.cost?.errors || {}
  } finally { wasteSaving.value = false }
}
function search() { pagination.page = 1; load() }
function debouncedSearch() { clearTimeout(timer); timer = setTimeout(search, 400) }
function goPage(page) { pagination.page = page; load() }
const effectiveCost = item => item.effective_cost ?? effectiveIngredientCost(item)
const price = value => Number(value || 0) > 0 ? money(value) : 'ثبت نشده'
const sourceLabel = costSourceLabel

onMounted(load)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.materials-nav{display:flex;flex-wrap:wrap;gap:.5rem}.materials-nav a{min-height:36px;padding:.45rem .75rem;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--muted);text-decoration:none;font-size:.76rem;font-weight:700}.materials-nav a.router-link-exact-active{border-color:var(--primary);background:var(--primary);color:var(--on-primary)}.operational-context,.legacy-note{padding:.8rem 1rem;border-radius:11px;font-size:.75rem;line-height:1.8}.operational-context{border:1px solid color-mix(in srgb,var(--primary) 30%,var(--border));border-right:4px solid var(--primary);background:color-mix(in srgb,var(--primary) 6%,var(--surface))}.operational-context strong{display:block}.legacy-note{border:1px solid color-mix(in srgb,var(--color-warning,#b7791f) 35%,var(--border));background:color-mix(in srgb,var(--color-warning-subtle,#fff7df) 72%,var(--surface))}.materials-table{overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:13px}.materials-table>header,.materials-table>article{display:grid;grid-template-columns:minmax(145px,1.2fr) minmax(105px,.8fr) minmax(110px,.9fr) minmax(125px,1fr) 75px minmax(210px,1.35fr);align-items:center;gap:10px;padding:12px 14px}.materials-table>header{background:var(--surface-subtle);color:var(--muted);font-size:.69rem}.materials-table>article{border-top:1px solid var(--border);font-size:.77rem}.materials-table footer{display:flex;flex-wrap:wrap;gap:5px}.materials-table footer button{font-size:.7rem}.waste{color:var(--primary)}.material-name,.effective-cost{display:grid;gap:3px}.material-name small,.effective-cost small{color:var(--muted);font-size:.66rem}@media(max-width:1100px){.materials-table>header{display:none}.materials-table>article{grid-template-columns:repeat(2,minmax(0,1fr))}.materials-table footer{grid-column:1/-1}}@media(max-width:560px){.materials-table>article{grid-template-columns:1fr}.materials-table footer{grid-column:auto}.materials-nav{display:grid}.materials-nav a{width:100%}}
</style>
