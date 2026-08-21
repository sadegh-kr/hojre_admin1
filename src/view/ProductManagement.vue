<template>
  <section class="product-page" dir="rtl">
    <header class="page-heading"><div><p class="eyebrow">مدیریت منو و مالی</p><h1>محصولات و کنترل بهای تمام‌شده</h1><p>قیمت فروش، مواد اولیه، دستور تولید و سهم سربار هر محصول</p></div></header>
    <nav class="tabs"><button :class="{active:tab==='dashboard'}" @click="tab='dashboard';loadDashboard()">داشبورد</button><button :class="{active:tab==='products'}" @click="tab='products'">محصولات</button><button :class="{active:tab==='ingredients'}" @click="tab='ingredients'">مواد اولیه</button><button :class="{active:tab==='overheads'}" @click="tab='overheads'">هزینه‌های سربار</button></nav>
    <div v-if="productError" class="notice" role="alert">{{productError}} <button type="button" @click="retryCurrentView">تلاش مجدد</button></div>

    <template v-if="tab==='dashboard'"><form class="filter-panel dashboard-filter" @submit.prevent="loadDashboard"><JalaliDatePicker v-model="dashboardFilters.start_date" placeholder="از تاریخ"/><JalaliDatePicker v-model="dashboardFilters.end_date" placeholder="تا تاریخ"/><button class="primary">به‌روزرسانی گزارش</button></form><div v-if="dashboardLoading" class="dashboard-loading">در حال دریافت گزارش…</div><template v-else><div class="cost-grid dashboard-cards"><article><span>کل هزینه‌های دوره</span><strong>{{money(dashboard.total_expenses)}}</strong></article><article><span>بهای سفارش‌های تکمیل‌شده</span><strong>{{money(dashboard.completed_order_cost)}}</strong></article><article><span>سود سفارش‌های تکمیل‌شده</span><strong>{{money(dashboard.completed_order_profit)}}</strong></article><article><span>تعداد آیتم‌های تکمیل‌شده</span><strong>{{number(dashboard.completed_item_count)}}</strong></article></div><div class="dashboard-grid"><section><h2>هزینه‌ها بر اساس دسته</h2><div v-for="row in dashboard.expense_by_category" :key="row.kind" class="dashboard-row"><span>{{kindLabel(row.kind)}}</span><strong>{{money(row.total)}}</strong><small>{{number(row.count)}} مورد</small></div><p v-if="!dashboard.expense_by_category?.length">هزینه‌ای در این بازه ثبت نشده است.</p></section><section><h2>محصولات با بیشترین بهای تمام‌شده</h2><div v-for="product in dashboard.highest_cost_products" :key="product.id" class="dashboard-row"><span>{{product.name}}</span><strong>{{money(product.final_production_cost)}}</strong><small>{{number(product.profit_margin)}}٪ حاشیه سود</small></div></section><section class="wide-section"><h2>سودآوری محصولات</h2><div v-for="product in dashboard.product_profitability" :key="product.id" class="profitability"><span>{{product.name}}</span><span>مواد {{money(product.material_cost)}} · بسته‌بندی {{money(product.packaging_cost)}} · ضایعات {{money(product.waste_cost)}} · سربار {{money(product.labor_overhead_cost)}}</span><strong :class="Number(product.profit_amount)<0?'loss':'profit'">{{money(product.profit_amount)}} ({{number(product.profit_margin)}}٪)</strong></div></section></div></template></template>
    <template v-else-if="tab==='products'">
      <form class="filter-panel" @submit.prevent="applyFilters"><input v-model.trim="draft.search" placeholder="جستجوی نام محصول" @input="debouncedProducts"/><select v-model="draft.category" @change="applyFilters"><option value="">همه دسته‌ها</option><option v-for="category in meta.categories" :key="category.id" :value="category.id">{{category.name}}</option></select><select v-model="draft.is_active" @change="applyFilters"><option value="">همه وضعیت‌ها</option><option value="true">فعال</option><option value="false">غیرفعال</option></select><button class="primary">اعمال فیلتر</button><button type="button" class="text" @click="clearFilters">پاک کردن</button><button type="button" class="primary add" @click="newProduct">+ محصول جدید</button></form>
      <form v-if="productFormOpen" class="editor" @submit.prevent="saveProduct"><h2>{{editingProduct?'ویرایش محصول':'ثبت محصول جدید'}}</h2><label>نام<input v-model.trim="productForm.name" required maxlength="64"/></label><label>دسته‌بندی<select v-model="productForm.category" required><option disabled value="">انتخاب دسته</option><option v-for="category in meta.categories" :key="category.id" :value="category.id">{{category.name}}</option></select></label><label>قیمت فروش (تومان)<input v-model.number="productForm.price" type="number" min="1" required/></label><label class="switch">فعال <input v-model="productForm.is_active" type="checkbox"/></label><label class="wide">توضیحات<textarea v-model.trim="productForm.description" rows="2"/></label><p v-if="formError" class="form-error">{{formError}}</p><div class="form-actions"><button class="primary" :disabled="saving">ذخیره</button><button type="button" class="secondary" @click="productFormOpen=false">انصراف</button></div></form>
      <AdminDataTable title="فهرست محصولات" :rows="products" :columns="productColumns" :total="pagination.count" :page="pagination.page" :page-size="pagination.page_size" :sort="filters.ordering" :loading="loadingProducts" :initial-loading="initialLoading" :error="''" :has-filters="hasFilters" empty-title="محصولی پیدا نشد" @sort="sortProducts" @page="goPage" @page-size="setPageSize" @clear="clearFilters">
        <template #cell-name="{row}"><div class="product-name"><img v-if="row.image_url" :src="row.image_url" alt=""/><strong>{{row.name}}</strong><small>{{row.category_name}}</small></div></template><template #cell-price="{row}">{{money(row.price)}}</template><template #cell-is_active="{row}"><button :class="['status',row.is_active?'on':'off']" @click="toggleProduct(row)">{{row.is_active?'فعال':'غیرفعال'}}</button></template><template #cell-final_production_cost="{row}">{{money(row.final_production_cost)}}</template><template #cell-profit_amount="{row}"><strong :class="Number(row.profit_amount)<0?'loss':'profit'">{{money(row.profit_amount)}}</strong><small>{{number(row.profit_margin)}}٪ حاشیه سود</small></template><template #mobile-title="{row}">{{row.name}}</template><template #actions="{row}"><button class="row-action" @click="editProduct(row)">ویرایش</button><button class="row-action" @click="openRecipe(row)">دستور تولید</button><button class="danger-action" @click="deleteProduct(row)">حذف</button></template>
      </AdminDataTable>
      <section v-if="selectedProduct" class="recipe-panel"><header><div><h2>دستور تولید: {{selectedProduct.name}}</h2><p>هزینه‌ها با تغییر قیمت خرید، مقدار مصرف و سربار خودکار محاسبه می‌شوند.</p></div><button type="button" class="secondary" @click="closeRecipe">بستن</button></header><div class="cost-grid"><article><span>مواد اولیه</span><strong>{{money(selectedProduct.material_cost)}}</strong></article><article><span>بسته‌بندی</span><strong>{{money(selectedProduct.packaging_cost)}}</strong></article><article><span>ضایعات</span><strong>{{money(selectedProduct.waste_cost)}}</strong></article><article><span>کار و سربار</span><strong>{{money(selectedProduct.labor_overhead_cost)}}</strong></article><article><span>بهای تمام‌شده</span><strong>{{money(selectedProduct.final_production_cost)}}</strong></article><article><span>سود</span><strong :class="Number(selectedProduct.profit_amount)<0?'loss':'profit'">{{money(selectedProduct.profit_amount)}}</strong></article></div><form class="recipe-form" @submit.prevent="saveRecipe"><select v-model="recipeForm.ingredient" required><option disabled value="">ماده اولیه</option><option v-for="ingredient in recipeIngredients" :key="ingredient.id" :value="ingredient.id">{{ingredient.name}} ({{ingredient.unit_display}})</option></select><select v-model="recipeForm.cost_kind" required><option value="material">مواد اولیه</option><option value="packaging">بسته‌بندی</option><option value="waste">ضایعات</option></select><input v-model.number="recipeForm.quantity" type="number" min="0.001" step="0.001" placeholder="مقدار مصرف" required/><button class="primary" :disabled="savingRecipe">{{savingRecipe?'در حال ذخیره…':'افزودن / به‌روزرسانی'}}</button></form><div class="recipe-list"><div v-for="line in recipes" :key="line.id"><span>{{line.ingredient_name}}</span><span>{{line.cost_kind_display}} · {{number(line.quantity)}} {{line.unit_display}}</span><strong>{{money(line.line_cost)}}</strong><button type="button" class="danger-action" :disabled="savingRecipe" @click="removeRecipe(line)">حذف</button></div><p v-if="!recipes.length">هنوز ماده اولیه‌ای ثبت نشده است.</p></div><label class="image-upload">افزودن تصویر محصول<input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadImage"/></label></section>
    </template>

    <template v-else-if="tab==='ingredients'"><form class="filter-panel" @submit.prevent="filterIngredients"><input v-model.trim="ingredientSearch" placeholder="جستجوی ماده اولیه" @input="debouncedIngredients"/><button class="primary">جستجو</button></form><form class="editor compact" @submit.prevent="saveIngredient"><h2>{{editingIngredient?'ویرایش ماده اولیه':'ماده اولیه جدید'}}</h2><label>نام<input v-model.trim="ingredientForm.name" required/></label><label>واحد<select v-model="ingredientForm.unit" required><option v-for="unit in meta.units" :key="unit[0]" :value="unit[0]">{{unit[1]}}</option></select></label><label>قیمت خرید هر واحد<input v-model.number="ingredientForm.purchase_price" type="number" min="1" required/></label><label class="switch">فعال <input v-model="ingredientForm.is_active" type="checkbox"/></label><div class="form-actions"><button class="primary">ذخیره</button><button type="button" class="secondary" @click="resetIngredient">انصراف</button></div></form><div class="resource-list"><article v-for="ingredient in ingredients" :key="ingredient.id"><strong>{{ingredient.name}}</strong><span>{{money(ingredient.unit_cost)}} / {{ingredient.unit_display}}</span><span :class="['status',ingredient.is_active?'on':'off']">{{ingredient.is_active?'فعال':'غیرفعال'}}</span><button class="row-action" @click="editIngredient(ingredient)">ویرایش</button><button class="danger-action" @click="deleteIngredient(ingredient)">حذف</button></article></div><div class="resource-pagination" v-if="ingredientPagination.total_pages>1"><button class="secondary" :disabled="!ingredientPagination.has_previous" @click="goIngredientPage(ingredientPagination.page-1)">قبلی</button><span>صفحه {{number(ingredientPagination.page)}} از {{number(ingredientPagination.total_pages)}}</span><button class="secondary" :disabled="!ingredientPagination.has_next" @click="goIngredientPage(ingredientPagination.page+1)">بعدی</button></div></template>

    <template v-else><form class="editor compact" @submit.prevent="saveOverhead"><h2>{{editingOverhead?'ویرایش سربار':'هزینه سربار جدید'}}</h2><label>عنوان<input v-model.trim="overheadForm.title" required/></label><label>نوع<select v-model="overheadForm.kind" required><option v-for="item in meta.overhead_kinds" :key="item[0]" :value="item[0]">{{item[1]}}</option></select></label><label>مبلغ<input v-model.number="overheadForm.amount" type="number" min="1" required/></label><label>تاریخ هزینه<JalaliDatePicker v-model="overheadForm.expense_date" :clearable="false"/></label><label>روش تخصیص<select v-model="overheadForm.allocation_method"><option v-for="item in meta.allocation_methods" :key="item[0]" :value="item[0]">{{item[1]}}</option></select></label><label class="switch">فعال <input v-model="overheadForm.is_active" type="checkbox"/></label><label class="wide">توضیحات<textarea v-model.trim="overheadForm.description" rows="2"/></label><div class="form-actions"><button class="primary">ذخیره</button><button type="button" class="secondary" @click="resetOverhead">انصراف</button></div></form><div class="resource-list"><article v-for="overhead in overheads" :key="overhead.id"><strong>{{overhead.title}} <small>{{overhead.kind_display}}</small></strong><span>{{money(overhead.amount)}} — {{overhead.allocation_method_display}}</span><span :class="['status',overhead.is_active?'on':'off']">{{overhead.is_active?'فعال':'غیرفعال'}}</span><button class="row-action" @click="editOverhead(overhead)">ویرایش</button><button class="danger-action" @click="deleteOverhead(overhead)">حذف</button></article><p v-if="!overheads.length" class="empty-resource">هزینه سرباری ثبت نشده است.</p></div><div class="resource-pagination" v-if="overheadPagination.total_pages>1"><button class="secondary" :disabled="!overheadPagination.has_previous" @click="goOverheadPage(overheadPagination.page-1)">قبلی</button><span>صفحه {{number(overheadPagination.page)}} از {{number(overheadPagination.total_pages)}}</span><button class="secondary" :disabled="!overheadPagination.has_next" @click="goOverheadPage(overheadPagination.page+1)">بعدی</button></div></template>
    <CostToastHost/>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import CostToastHost from '@/components/cost/CostToastHost.vue'
import API from '@/api/product-cost.api.js'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'
const tab = ref('dashboard')
const products = ref([])
const ingredients = ref([])
const recipeIngredients = ref([])
const overheads = ref([])
const recipes = ref([])
const selectedProduct = ref(null)
const loadingProducts = ref(false)
const initialLoading = ref(true)
const productError = ref('')
const formError = ref('')
const saving = ref(false)
const savingRecipe = ref(false)
const productFormOpen = ref(false)
const editingProduct = ref(null)
const editingIngredient = ref(null)
const editingOverhead = ref(null)
const dashboardLoading = ref(false)

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())
const meta = reactive({ categories: [], units: [], overhead_kinds: [], allocation_methods: [] })
const pagination = reactive({ count: 0, page: 1, page_size: 10 })
const ingredientPagination = reactive({ count: 0, page: 1, page_size: 10, total_pages: 1, has_next: false, has_previous: false })
const overheadPagination = reactive({ count: 0, page: 1, page_size: 10, total_pages: 1, has_next: false, has_previous: false })
const filters = reactive({ search: '', category: '', is_active: '', ordering: '-created' })
const draft = reactive({ ...filters })
const productForm = reactive({ name: '', category: '', price: '', description: '', is_active: true })
const ingredientForm = reactive({ name: '', unit: 'g', purchase_price: '', is_active: true })
const overheadForm = reactive({ title: '', kind: 'fixed', amount: '', allocation_method: 'monthly', expense_date: today, description: '', is_active: true })
const recipeForm = reactive({ ingredient: '', quantity: '', cost_kind: 'material' })
const dashboardFilters = reactive({ start_date: '', end_date: '' })
const dashboard = reactive({ total_expenses: 0, completed_order_cost: 0, completed_order_profit: 0, completed_item_count: 0, expense_by_category: [], highest_cost_products: [], product_profitability: [] })
const ingredientSearch = ref('')
const productColumns = [{ key: 'name', label: 'محصول', sortable: true }, { key: 'price', label: 'قیمت فروش', sortable: true }, { key: 'is_active', label: 'وضعیت', sortable: true }, { key: 'final_production_cost', label: 'بهای تمام‌شده' }, { key: 'profit_amount', label: 'سود' }]
let productSearchTimer
let ingredientSearchTimer

const hasFilters = computed(() => Boolean(filters.search || filters.category || filters.is_active))
const number = value => Number(value || 0).toLocaleString('fa-IR', { maximumFractionDigits: 3 })
const money = value => `${number(value)} تومان`
const errorText = error => error.cost?.message || error.message || 'ارتباط با سرور برقرار نشد.'
const productParams = () => Object.fromEntries(Object.entries({ ...filters, page: pagination.page, page_size: pagination.page_size }).filter(([, value]) => value !== ''))
function retryCurrentView() {
  productError.value = ''
  if (tab.value === 'dashboard') loadDashboard()
  else if (tab.value === 'products') loadProducts()
  else loadResources()
}

async function loadProducts() {
  loadingProducts.value = true
  productError.value = ''
  try {
    const data = await API.products(productParams())
    products.value = data.results || []
    Object.assign(pagination, data)
  } catch (error) {
    productError.value = errorText(error)
  } finally {
    loadingProducts.value = false
    initialLoading.value = false
  }
}

async function loadResources() {
  productError.value = ''
  try {
    const [metaData, ingredientData, overheadData, activeIngredientData] = await Promise.all([
      API.meta(),
      API.ingredients({ search: ingredientSearch.value, page: ingredientPagination.page, page_size: ingredientPagination.page_size }),
      API.overheads({ page: overheadPagination.page, page_size: overheadPagination.page_size }),
      API.activeIngredients(),
    ])
    Object.assign(meta, metaData)
    ingredients.value = ingredientData.results || []
    recipeIngredients.value = activeIngredientData
    overheads.value = overheadData.results || []
    Object.assign(ingredientPagination, ingredientData)
    Object.assign(overheadPagination, overheadData)
  } catch (error) {
    productError.value = errorText(error)
  }
}

async function loadDashboard() {
  dashboardLoading.value = true
  productError.value = ''
  try {
    Object.assign(dashboard, await API.dashboard({ ...dashboardFilters }))
  } catch (error) {
    productError.value = errorText(error)
  } finally {
    dashboardLoading.value = false
  }
}

async function refreshCostViews({ resources = false } = {}) {
  const requests = [loadProducts(), loadDashboard()]
  if (resources) requests.push(loadResources())
  await Promise.all(requests)
}

function applyFilters() { Object.assign(filters, draft); pagination.page = 1; loadProducts() }
function debouncedProducts() { clearTimeout(productSearchTimer); productSearchTimer = setTimeout(applyFilters, 400) }
function clearFilters() { Object.assign(filters, { search: '', category: '', is_active: '', ordering: '-created' }); Object.assign(draft, filters); pagination.page = 1; loadProducts() }
function sortProducts(value) { filters.ordering = value; pagination.page = 1; loadProducts() }
function goPage(value) { pagination.page = value; loadProducts() }
function setPageSize(value) { pagination.page_size = value; pagination.page = 1; loadProducts() }
function resetProduct() { Object.assign(productForm, { name: '', category: '', price: '', description: '', is_active: true }); editingProduct.value = null; formError.value = '' }
function newProduct() { resetProduct(); productFormOpen.value = true }
function editProduct(row) { editingProduct.value = row; Object.assign(productForm, { name: row.name, category: row.category, price: row.price, description: row.description || '', is_active: row.is_active }); productFormOpen.value = true }

async function saveProduct() {
  saving.value = true
  formError.value = ''
  try {
    if (editingProduct.value) await API.updateProduct(editingProduct.value.id, { ...productForm })
    else await API.createProduct({ ...productForm })
    productFormOpen.value = false
    await refreshCostViews()
  } catch (error) { formError.value = errorText(error) }
  finally { saving.value = false }
}

async function toggleProduct(row) { try { await API.updateProduct(row.id, { is_active: !row.is_active }); await refreshCostViews() } catch (error) { productError.value = errorText(error) } }
async function deleteProduct(row) { if (!confirm(`محصول «${row.name}» حذف شود؟`)) return; try { await API.deleteProduct(row.id); closeRecipe(); await refreshCostViews() } catch (error) { productError.value = errorText(error) } }
function closeRecipe() { selectedProduct.value = null; recipes.value = []; Object.assign(recipeForm, { ingredient: '', quantity: '', cost_kind: 'material' }) }

async function openRecipe(row, resetForm = true) {
  try {
    const [product, recipeLines] = await Promise.all([API.product(row.id), API.recipes(row.id)])
    selectedProduct.value = product
    recipes.value = recipeLines
    if (resetForm) Object.assign(recipeForm, { ingredient: '', quantity: '', cost_kind: 'material' })
  } catch (error) { productError.value = errorText(error) }
}

async function saveRecipe() {
  if (!selectedProduct.value || savingRecipe.value) return
  savingRecipe.value = true
  try {
    await API.saveRecipe(selectedProduct.value.id, { ...recipeForm })
    await Promise.all([openRecipe(selectedProduct.value), refreshCostViews()])
  } catch (error) { productError.value = errorText(error) }
  finally { savingRecipe.value = false }
}

async function removeRecipe(line) {
  if (!selectedProduct.value || savingRecipe.value) return
  savingRecipe.value = true
  try {
    await API.removeRecipe(selectedProduct.value.id, line.id)
    await Promise.all([openRecipe(selectedProduct.value), refreshCostViews()])
  } catch (error) { productError.value = errorText(error) }
  finally { savingRecipe.value = false }
}

async function uploadImage(event) {
  const file = event.target.files?.[0]
  if (!file || !selectedProduct.value) return
  try { await API.uploadImage(selectedProduct.value.id, file); await Promise.all([openRecipe(selectedProduct.value, false), loadProducts()]) }
  catch (error) { productError.value = errorText(error) }
  finally { event.target.value = '' }
}

function resetIngredient() { editingIngredient.value = null; Object.assign(ingredientForm, { name: '', unit: 'g', purchase_price: '', is_active: true }) }
function editIngredient(item) { editingIngredient.value = item; Object.assign(ingredientForm, { name: item.name, unit: item.unit, purchase_price: item.purchase_price, is_active: item.is_active }) }
async function saveIngredient() { try { if (editingIngredient.value) await API.updateIngredient(editingIngredient.value.id, { ...ingredientForm }); else await API.createIngredient({ ...ingredientForm }); resetIngredient(); await refreshCostViews({ resources: true }); if (selectedProduct.value) await openRecipe(selectedProduct.value, false) } catch (error) { productError.value = errorText(error) } }
async function deleteIngredient(item) { if (!confirm(`ماده اولیه «${item.name}» حذف شود؟`)) return; try { await API.deleteIngredient(item.id); await refreshCostViews({ resources: true }) } catch (error) { productError.value = errorText(error) } }
function filterIngredients() { ingredientPagination.page = 1; loadResources() }
function debouncedIngredients() { clearTimeout(ingredientSearchTimer); ingredientSearchTimer = setTimeout(filterIngredients, 400) }
function goIngredientPage(page) { ingredientPagination.page = page; loadResources() }

function resetOverhead() { editingOverhead.value = null; Object.assign(overheadForm, { title: '', kind: 'fixed', amount: '', allocation_method: 'monthly', expense_date: today, description: '', is_active: true }) }
function editOverhead(item) { editingOverhead.value = item; Object.assign(overheadForm, { title: item.title, kind: item.kind, amount: item.amount, allocation_method: item.allocation_method, expense_date: item.expense_date, description: item.description || '', is_active: item.is_active }) }
async function saveOverhead() { try { if (editingOverhead.value) await API.updateOverhead(editingOverhead.value.id, { ...overheadForm }); else await API.createOverhead({ ...overheadForm }); resetOverhead(); await refreshCostViews({ resources: true }) } catch (error) { productError.value = errorText(error) } }
async function deleteOverhead(item) { if (!confirm(`هزینه «${item.title}» حذف شود؟`)) return; try { await API.deleteOverhead(item.id); await refreshCostViews({ resources: true }) } catch (error) { productError.value = errorText(error) } }
function goOverheadPage(page) { overheadPagination.page = page; loadResources() }
const kindLabel = value => ({ fixed: 'ثابت', variable: 'متغیر', salary: 'حقوق و دستمزد', utility: 'آب، برق و گاز', maintenance: 'تعمیر و نگهداری', transport: 'حمل‌ونقل', other: 'سایر' })[value] || value

onMounted(() => Promise.all([loadResources(), loadProducts(), loadDashboard()]))
onBeforeUnmount(() => { clearTimeout(productSearchTimer); clearTimeout(ingredientSearchTimer) })
</script>

<style scoped>
.product-page{display:grid;gap:1rem}.page-heading h1{margin:.2rem 0;color:var(--text);font-size:1.5rem}.page-heading p{margin:0;color:var(--muted)}.eyebrow{font-size:.8rem!important;color:var(--primary)!important;font-weight:700}.tabs{display:flex;gap:.5rem;border-bottom:1px solid var(--border);overflow:auto}.tabs button{border:0;border-bottom:3px solid transparent;background:transparent;color:var(--muted);padding:.7rem 1rem;font:inherit;white-space:nowrap}.tabs button.active{border-color:var(--primary);color:var(--primary);font-weight:700}.filter-panel,.editor{display:flex;align-items:end;gap:.7rem;flex-wrap:wrap;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow)}.filter-panel input,.filter-panel select{flex:1 1 160px}.filter-panel .add{margin-right:auto}.primary,.secondary,.text,.row-action,.danger-action,.status{border-radius:8px;padding:.55rem .8rem;font:inherit;cursor:pointer}.primary{border:1px solid var(--primary);background:var(--primary);color:#fff}.secondary{border:1px solid var(--border-strong);background:var(--surface-subtle);color:var(--text)}.text{border:0;background:transparent;color:var(--primary)}.row-action{border:1px solid var(--primary);background:transparent;color:var(--primary);margin-left:.35rem}.danger-action{border:0;background:transparent;color:var(--danger);margin-left:.25rem}.editor h2{width:100%;font-size:1rem;margin:0;color:var(--text)}.editor label{display:grid;gap:.35rem;min-width:160px;flex:1;color:var(--muted);font-size:.8rem}.editor label.wide{flex-basis:100%}.editor .switch{display:flex;align-items:center;gap:.5rem}.editor .switch input{width:auto}.form-actions{display:flex;gap:.5rem}.form-error,.notice{width:100%;color:var(--danger);font-size:.85rem}.product-name{display:grid;grid-template-columns:38px 1fr;column-gap:.5rem;align-items:center}.product-name img{width:38px;height:38px;object-fit:cover;border-radius:8px;grid-row:span 2}.product-name small,.profit+small{color:var(--muted);font-size:.76rem}.status{padding:.25rem .55rem;font-size:.75rem}.status.on{color:#15803d;background:#dcfce7;border:0}.status.off{color:#b91c1c;background:#fee2e2;border:0}.profit{color:#15803d}.loss{color:var(--danger)}.recipe-panel{display:grid;gap:1rem;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:14px}.recipe-panel header{display:flex;justify-content:space-between;gap:1rem}.recipe-panel h2,.dashboard-grid h2{font-size:1.05rem;margin:0;color:var(--text)}.recipe-panel p{margin:.35rem 0 0;color:var(--muted);font-size:.84rem}.cost-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.7rem}.cost-grid article{display:grid;gap:.4rem;padding:.75rem;background:var(--surface-subtle);border-radius:10px}.cost-grid span{color:var(--muted);font-size:.78rem}.cost-grid strong{color:var(--text)}.dashboard-loading{padding:3rem;text-align:center;color:var(--muted)}.dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.dashboard-grid section{padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:14px}.dashboard-grid .wide-section{grid-column:1/-1}.dashboard-row,.profitability{display:grid;grid-template-columns:1fr auto;gap:.3rem;padding:.75rem 0;border-bottom:1px solid var(--border);font-size:.86rem}.dashboard-row small{color:var(--muted);grid-column:1/-1}.profitability span:nth-child(2){color:var(--muted);font-size:.78rem}.profitability strong{grid-column:2;grid-row:1}.recipe-form{display:flex;gap:.6rem;flex-wrap:wrap}.recipe-form select,.recipe-form input{flex:1;min-width:150px}.recipe-list{display:grid}.recipe-list>div,.resource-list article{display:flex;align-items:center;gap:.75rem;padding:.75rem;border-bottom:1px solid var(--border);flex-wrap:wrap}.recipe-list>div strong{margin-right:auto}.image-upload{display:inline-flex;align-items:center;gap:.5rem;color:var(--primary);font-size:.85rem;cursor:pointer}.image-upload input{max-width:220px}.resource-list{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:0 1rem}.resource-list article strong{min-width:170px;color:var(--text)}.resource-list article span:nth-child(2){flex:1;color:var(--muted)}.resource-pagination{display:flex;justify-content:center;align-items:center;gap:.75rem;color:var(--muted);font-size:.85rem}input,select,textarea{width:100%;min-height:40px;padding:.55rem .65rem;border:1px solid var(--border-strong);border-radius:8px;background:var(--input);color:var(--text);font:inherit}@media(max-width:720px){.filter-panel,.editor{display:grid;grid-template-columns:1fr}.filter-panel .add{margin-right:0}.cost-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-grid{grid-template-columns:1fr}.dashboard-grid .wide-section{grid-column:auto}.recipe-panel header{flex-direction:column}.recipe-list>div,.resource-list article{align-items:flex-start;flex-direction:column;gap:.4rem}.recipe-list>div strong{margin-right:0}.row-action,.danger-action{margin-right:0}.image-upload{flex-wrap:wrap}}
</style>
