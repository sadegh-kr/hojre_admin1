<template>
  <section class="cost-page">
    <header class="cost-page-heading">
      <div>
        <h2>{{ catalogMode ? 'مواد اولیه' : 'هزینه مواد و بسته‌بندی' }}</h2>
        <p>{{ catalogMode ? 'ماده مصرفی یا بسته‌بندی را یک‌بار در کاتالوگ تعریف کنید.' : 'یک ماده موجود را انتخاب کنید و فقط قیمت مرجع آن را ثبت یا به‌روزرسانی کنید.' }}</p>
      </div>
      <button v-if="catalogMode" class="cost-primary" @click="openCreate">ماده اولیه جدید</button>
    </header>

    <div class="next-step">
      <template v-if="catalogMode">تعریف ماده موجودی ایجاد نمی‌کند. قیمت و رسید فیزیکی آن در مراحل جداگانه ثبت می‌شوند.</template>
      <template v-else>محاسبه رسپی ابتدا از میانگین موجودی استفاده می‌کند و فقط در نبود آن به قیمت مرجع برمی‌گردد. تغییر قیمت مرجع موجودی را افزایش نمی‌دهد. <RouterLink to="/dashboard/inventory/materials">تعریف ماده جدید</RouterLink></template>
    </div>

    <form class="cost-filter" @submit.prevent="search">
      <input v-model.trim="query" placeholder="جستجوی نام ماده اولیه" @input="debouncedSearch"/>
      <select v-model="activeFilter" @change="search"><option value="">همه وضعیت‌ها</option><option value="true">فعال</option><option value="false">غیرفعال</option></select>
      <button class="cost-primary">جستجو</button>
    </form>

    <div v-if="error" class="cost-notice" role="alert">{{ error }} <button @click="load">تلاش مجدد</button></div>

    <div class="materials-table" :class="{ 'cost-table': !catalogMode }">
      <header v-if="catalogMode"><span>ماده اولیه</span><span>دسته‌بندی</span><span>واحد</span><span>وضعیت</span><span>عملیات</span></header>
      <header v-else><span>ماده اولیه</span><span>قیمت مرجع</span><span>میانگین موجودی</span><span>مبنای فعلی رسپی</span><span>وضعیت</span><span>عملیات</span></header>

      <article v-for="item in ingredients" :key="item.id">
        <div class="material-name"><strong>{{ item.name }}</strong><small>{{ item.unit_display }}</small></div>
        <template v-if="catalogMode">
          <span>{{ item.category_name || 'بدون دسته‌بندی' }}</span>
          <span>{{ item.unit_display }}</span>
          <span :class="['status', item.is_active ? 'on' : 'off']">{{ item.is_active ? 'فعال' : 'غیرفعال' }}</span>
          <footer><button class="row-action" @click="openEdit(item)">ویرایش ماده</button><button class="danger-action" @click="remove(item)">حذف</button></footer>
        </template>
        <template v-else>
          <strong>{{ price(item.purchase_price) }}</strong>
          <strong>{{ price(item.inventory_average_cost) }}</strong>
          <div class="effective-cost"><strong>{{ price(effectiveCost(item)) }}</strong><small>{{ sourceLabel(item.cost_source) }}</small></div>
          <span :class="['status', item.is_active ? 'on' : 'off']">{{ item.is_active ? 'فعال' : 'غیرفعال' }}</span>
          <footer><button class="row-action" @click="openEdit(item)">ثبت هزینه</button></footer>
        </template>
      </article>

      <div v-if="loading" class="empty-resource">در حال دریافت مواد اولیه…</div>
      <div v-else-if="!ingredients.length" class="empty-resource">ماده اولیه‌ای پیدا نشد.</div>
    </div>

    <div class="resource-pagination" v-if="pagination.total_pages > 1">
      <button class="cost-secondary" :disabled="!pagination.has_previous" @click="goPage(pagination.page - 1)">قبلی</button>
      <span>صفحه {{ number(pagination.page) }} از {{ number(pagination.total_pages) }}</span>
      <button class="cost-secondary" :disabled="!pagination.has_next" @click="goPage(pagination.page + 1)">بعدی</button>
    </div>

    <IngredientModal v-model="modalOpen" :ingredient="editing" :mode="catalogMode ? 'catalog' : 'cost'" :units="meta.units" :categories="categories" :loading="saving" :server-error="modalError" :field-errors="fieldErrors" @submit="save"/>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import API from '@/api/product-cost.api.js'
import IngredientModal from '@/components/modals/IngredientModal.vue'
import { costErrorMessage, formatCostNumber as number, formatMoney as money } from '@/utils/costControl'
import { costSourceLabel, effectiveIngredientCost } from '@/utils/ingredientCost'

const route = useRoute()
const catalogMode = computed(() => route.meta.ingredientCatalog === true)
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
const meta = reactive({ units: [] })
const pagination = reactive({ page: 1, page_size: 10, total_pages: 1, has_next: false, has_previous: false })
let timer

async function load() {
  loading.value = true
  error.value = ''
  try {
    const requests = [
      meta.units.length ? Promise.resolve(meta) : API.meta(),
      API.ingredients({ search: query.value, is_active: activeFilter.value, page: pagination.page, page_size: pagination.page_size }),
    ]
    if (catalogMode.value && !categories.value.length) requests.push(API.materialCategories({ page_size: 200 }))
    const [metadata, data, categoryData] = await Promise.all(requests)
    Object.assign(meta, metadata)
    ingredients.value = data.results || []
    Object.assign(pagination, data)
    if (categoryData) categories.value = categoryData.results || []
  } catch (cause) {
    error.value = costErrorMessage(cause)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  if (!catalogMode.value) return
  editing.value = null
  modalError.value = ''
  fieldErrors.value = {}
  modalOpen.value = true
}

function openEdit(item) {
  editing.value = item
  modalError.value = ''
  fieldErrors.value = {}
  modalOpen.value = true
}

async function save(payload) {
  saving.value = true
  modalError.value = ''
  fieldErrors.value = {}
  try {
    if (editing.value) await API.updateIngredient(editing.value.id, payload)
    else await API.createIngredient(payload)
    modalOpen.value = false
    await load()
  } catch (cause) {
    modalError.value = costErrorMessage(cause)
    fieldErrors.value = cause.cost?.errors || {}
  } finally {
    saving.value = false
  }
}

async function remove(item) {
  if (!catalogMode.value || !confirm(`ماده اولیه «${item.name}» حذف شود؟`)) return
  try {
    await API.deleteIngredient(item.id)
    await load()
  } catch (cause) {
    error.value = costErrorMessage(cause)
  }
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
.materials-table{overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:13px}.materials-table>header,.materials-table>article{display:grid;grid-template-columns:minmax(170px,1.4fr) minmax(130px,1fr) minmax(100px,.8fr) minmax(100px,.8fr) 180px;align-items:center;gap:12px;padding:12px 16px}.materials-table.cost-table>header,.materials-table.cost-table>article{grid-template-columns:minmax(165px,1.35fr) repeat(3,minmax(125px,1fr)) 90px 120px}.materials-table>header{background:var(--surface-subtle);color:var(--muted);font-size:.72rem}.materials-table>article{border-top:1px solid var(--border);font-size:.8rem}.materials-table footer{display:flex}.materials-table>.empty-resource{border-top:1px solid var(--border)}.material-name,.effective-cost{display:grid;gap:3px}.material-name small,.effective-cost small{color:var(--muted);font-size:.68rem}@media(max-width:900px){.materials-table>header{display:none}.materials-table>article,.materials-table.cost-table>article{grid-template-columns:repeat(2,minmax(0,1fr))}.materials-table footer{justify-self:end}}@media(max-width:480px){.materials-table>article,.materials-table.cost-table>article{grid-template-columns:1fr}.materials-table footer{justify-self:start}}
</style>
