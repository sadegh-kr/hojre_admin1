<!-- ItemList.vue -->
<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import itemApi from "@/api/item.api.js";
import orderApi from '@/api/order.api.js'
import ItemCalculator from "@/components/item/ItemCalculator.vue";
import ItemCard from "@/components/item/ItemCard.vue";
import ProductCreateModal from '@/components/modals/ProductCreateModal.vue'
import ProductCategoryManager from '@/components/modals/ProductCategoryManager.vue'
import { useCostToast } from '@/composables/useCostToast'
import { getApiErrorMessage } from '@/api/error'
import productCostApi from '@/api/product-cost.api'
import restaurantApi from '@/api/restaurant.api'
import loyaltyApi from '@/api/loyalty.api'
import CustomerQuickSearch from '@/components/loyalty/CustomerQuickSearch.vue'
import { useRestaurantStore } from '@/store/restaurant'
import { resolveHojrehRestaurant, resolveTaleghaniPosBranch } from '@/utils/posBranchContext'

// ========== حالت‌ها ==========
const loading = ref(true)
const error = ref(null)
const items = ref([])
const categories = ref([])
const itemData = ref(null)
const categoryData = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedCategoryType = ref('category')
const selectedCategoryLabel = ref('')
const categorySearchQuery = ref('')
const showCategoryFilter = ref(false)
const categoryError = ref('')
const submittingOrder = ref(false)
const toast = useCostToast()
const showCreateProduct = ref(false)
const creatingProduct = ref(false)
const createProductError = ref('')
const createProductFieldErrors = ref({})
const productCategories = ref([])
const productMenus = ref([])
const managedCategories = ref([])
const showCategoryManager = ref(false)
const loadingCategoryManager = ref(false)
const savingCategory = ref(false)
const categoryManagerError = ref('')
const categoryManagerFieldErrors = ref({})
const route = useRoute()
const router = useRouter()
const restaurantContext = useRestaurantStore()
const orderType = computed(() => route.meta.orderType === 'phone' ? 'phone' : 'in_store')
const selectedCustomer = ref(null)
const selectedCustomerDetails = ref(null)
const customerDetailsLoading = ref(false)
const customerDetailsError = ref('')
const activeOrderBranchId = ref('')
const posContextLoading = ref(true)
const posContextError = ref('')
const posReady = computed(() => Boolean(activeOrderBranchId.value) && !posContextLoading.value && !posContextError.value)
const selectedAddress = ref('')
const selectedDelivery = ref('takeoutN')

let customerDetailsRequestId = 0
async function loadSelectedCustomerDetails({ resetAddress = true } = {}) {
  const customer = selectedCustomer.value
  const requestId = ++customerDetailsRequestId
  selectedCustomerDetails.value = null
  customerDetailsError.value = ''
  if (resetAddress) selectedAddress.value = ''
  if (!customer) {
    customerDetailsLoading.value = false
    return
  }
  customerDetailsLoading.value = true
  try {
    const details = await loyaltyApi.customer(customer.customer_id)
    if (requestId === customerDetailsRequestId) selectedCustomerDetails.value = details
  } catch (cause) {
    if (requestId === customerDetailsRequestId) {
      customerDetailsError.value = getApiErrorMessage(cause)
      toast.error(customerDetailsError.value)
    }
  } finally {
    if (requestId === customerDetailsRequestId) customerDetailsLoading.value = false
  }
}
watch(selectedCustomer, () => loadSelectedCustomerDetails())
const walletBalance = computed(() => selectedCustomerDetails.value?.wallet_balance ?? null)
function handleWalletSelection(selected) {
  if (selected && selectedCustomer.value) loadSelectedCustomerDetails({ resetAddress: false })
}

async function initializePosBranch() {
  activeOrderBranchId.value = ''
  posContextLoading.value = true
  posContextError.value = ''
  try {
    await restaurantContext.initialize()
    if (restaurantContext.error) throw new Error(restaurantContext.error)

    const restaurant = resolveHojrehRestaurant(restaurantContext.restaurants)
    restaurantContext.setActiveRestaurant(restaurant.id)

    const response = await restaurantApi.listBranch()
    const payload = response.data?.data || response.data
    const { branch } = resolveTaleghaniPosBranch(restaurantContext.restaurants, payload?.results || payload || [])
    activeOrderBranchId.value = branch.id
    await Promise.all([fetchCategories(), fetchItems()])
  } catch (cause) {
    activeOrderBranchId.value = ''
    items.value = []
    categories.value = []
    itemData.value = null
    categoryData.value = null
    posContextError.value = cause?.message || getApiErrorMessage(cause)
    toast.error(posContextError.value)
  } finally {
    posContextLoading.value = false
    if (!activeOrderBranchId.value) loading.value = false
  }
}

function reorderPrevious(order) {
  let unavailable = 0
  for (const line of order.items || []) {
    const product = items.value.find(item => String(item.id) === String(line.item_id))
    if (!product || product.is_active === false) { unavailable += 1; continue }
    if (line.item_option_id) {
      const option = product.options?.find(item => String(item.id) === String(line.item_option_id))
      if (!option) { unavailable += 1; continue }
      const invoiceId = `option-${option.id}`
      const existing = invoiceItems.value.find(item => item.id === invoiceId)
      if (existing) existing.quantity += line.quantity
      else invoiceItems.value.push({ ...product, id: invoiceId, name: `${product.name} - ${option.name}`, price: Number(option.price), quantity: line.quantity, _item_option_id: option.id })
    } else {
      const existing = invoiceItems.value.find(item => String(item.id) === String(product.id))
      if (existing) existing.quantity += line.quantity
      else invoiceItems.value.push({ ...product, price: Number(product.price), quantity: line.quantity })
    }
  }
  if (unavailable) toast.error(`${unavailable.toLocaleString('fa-IR')} قلم حذف‌شده یا خارج از فهرست جاری بود و اضافه نشد.`)
  else toast.success('اقلام موجود با قیمت‌های جاری به فاکتور اضافه شدند.')
}

// ========== صفحه‌بندی ==========
const currentPage = ref(1)
const pageSize = ref(50)
const categoryPage = ref(1)
const categoryPageSize = ref(20)
let itemSearchTimer
let categorySearchTimer
let itemRequestId = 0
let categoryRequestId = 0

// ========== آیتم‌های فاکتور ==========
const invoiceItems = ref([])
const createIdempotencyKey = () => globalThis.crypto?.randomUUID?.()
    || `admin-order-${Date.now()}-${Math.random().toString(16).slice(2)}`
const checkoutIdempotencyKey = ref(createIdempotencyKey())

// ========== دریافت دسته‌بندی‌ها ==========
const fetchCategories = async () => {
  const requestId = ++categoryRequestId
  categoryError.value = ''
  if (!activeOrderBranchId.value) {
    categories.value = []
    categoryData.value = null
    return
  }
  try {
    const params = {
      page: categoryPage.value,
      page_size: categoryPageSize.value,
      branch_id: activeOrderBranchId.value,
    }

    if (categorySearchQuery.value) {
      params.search = categorySearchQuery.value
    }

    const data = await itemApi.getItemCategory(params)
    if (requestId !== categoryRequestId) return
    categoryData.value = data
    categories.value = data.results || []
  } catch (err) {
    if (requestId === categoryRequestId) categoryError.value = getApiErrorMessage(err)
  }
}

// ========== واتچ برای جستجوی دسته‌بندی ==========
watch(categorySearchQuery, () => {
  clearTimeout(categorySearchTimer)
  categoryPage.value = 1
  categorySearchTimer = setTimeout(fetchCategories, 300)
})

// ========== دریافت محصولات ==========
const fetchItems = async () => {
  const requestId = ++itemRequestId
  if (!activeOrderBranchId.value) {
    items.value = []
    itemData.value = null
    loading.value = false
    return
  }
  try {
    loading.value = true
    error.value = null

    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      branch_id: activeOrderBranchId.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (selectedCategory.value) {
      params[selectedCategoryType.value === 'subcategory' ? 'subcategory_id' : 'category'] = selectedCategory.value
    }

    const data = await itemApi.getItemList(params)
    if (requestId !== itemRequestId) return
    items.value = data.results || []
    itemData.value = data

    if (currentPage.value > data.total_pages) {
      currentPage.value = data.total_pages || 1
    }
  } catch (err) {
    if (requestId === itemRequestId) error.value = getApiErrorMessage(err)
  } finally {
    if (requestId === itemRequestId) loading.value = false
  }
}

// ========== واتچ برای سرچ محصول و دسته‌بندی ==========
watch(searchQuery, () => {
  clearTimeout(itemSearchTimer)
  currentPage.value = 1
  itemSearchTimer = setTimeout(fetchItems, 350)
})

// ========== مدیریت فاکتور ==========
const addToInvoice = (item) => {
  const price = typeof item.price === 'string'
      ? parseInt(item.price.replace(/[^\d]/g, ''), 10)
      : item.price

  const itemWithNumberPrice = {
    ...item,
    price: price || 0
  }

  const existing = invoiceItems.value.find(i => i.id === item.id)

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1
  } else {
    invoiceItems.value.push({
      ...itemWithNumberPrice,
      quantity: 1
    })
  }
}

const updateQuantity = (itemId, quantity) => {
  const item = invoiceItems.value.find(i => i.id === itemId)
  if (item) item.quantity = quantity
}

const removeFromInvoice = (itemId) => {
  invoiceItems.value = invoiceItems.value.filter(i => i.id !== itemId)
}

const clearInvoice = () => {
  if (confirm('آیا از حذف همه آیتم‌های فاکتور اطمینان دارید؟')) {
    invoiceItems.value = []
  }
}

// ========== ثبت سفارش از صفحه اقلام ==========
const submitOrder = async checkout => {
  if (!invoiceItems.value.length || submittingOrder.value) return
  if (!posReady.value) {
    toast.error(posContextError.value || 'شعبهٔ طالقانی هنوز برای ثبت سفارش آماده نیست.')
    return
  }
  submittingOrder.value = true
  try {
    const response = await orderApi.createOrderInStore({
      items: invoiceItems.value.map(item => item._item_option_id ? { item_option_id: item._item_option_id, quantity: item.quantity } : { item_id: item.id, quantity: item.quantity }),
      branch_id: activeOrderBranchId.value,
      customer_id: selectedCustomer.value?.customer_id || null,
      address_id: selectedAddress.value || null,
      order_type: orderType.value,
      delivery: orderType.value === 'phone' ? selectedDelivery.value : 'dine-in',
      expected_total: checkout.expected_total,
      payments: checkout.payments,
      idempotency_key: checkoutIdempotencyKey.value
    })
    if (!response.data?.success) {
      const requestError = new Error(response.data?.error || response.data?.message || 'سفارش ثبت نشد.')
      requestError.order = response.data
      throw requestError
    }
    const createdOrder = response.data.data
    invoiceItems.value = []
    selectedCustomer.value = null
    checkoutIdempotencyKey.value = createIdempotencyKey()
    toast.success('سفارش با موفقیت ثبت شد.')
    await router.push({ path: '/dashboard/orders' })
  } catch (cause) {
    const authoritativeTotal = cause.response?.data?.authoritative_total
    if (authoritativeTotal !== undefined) {
      toast.error(`قیمت فاکتور تغییر کرده است. مبلغ فعلی سرور ${Number(authoritativeTotal).toLocaleString('fa-IR')} تومان است؛ اقلام را بازبینی کنید.`)
    } else {
      toast.error(getApiErrorMessage(cause))
    }
  } finally {
    submittingOrder.value = false
  }
}

// ========== انتخاب دسته‌بندی ==========
const selectCategory = (categoryId = '', type = 'category', label = '') => {
  selectedCategory.value = categoryId ? String(categoryId) : ''
  selectedCategoryType.value = type
  selectedCategoryLabel.value = label
  currentPage.value = 1
  showCategoryFilter.value = false
  fetchItems()
}
const clearAllFilters = () => {
  clearTimeout(itemSearchTimer)
  searchQuery.value = ''
  selectCategory()
}

const openCreateProduct = async () => {
  createProductError.value = ''
  createProductFieldErrors.value = {}
  showCreateProduct.value = true
  if (productCategories.value.length) return
  try {
    const meta = await productCostApi.meta()
    productCategories.value = meta.categories || []
    productMenus.value = meta.menus || []
  } catch (cause) {
    createProductError.value = getApiErrorMessage(cause)
  }
}

const loadCategoryManager = async () => {
  loadingCategoryManager.value = true
  categoryManagerError.value = ''
  try {
    const [allCategories, meta] = await Promise.all([itemApi.getAllCategories(), productCostApi.meta()])
    managedCategories.value = allCategories
    productCategories.value = meta.categories || []
    productMenus.value = meta.menus || []
  } catch (cause) {
    categoryManagerError.value = getApiErrorMessage(cause)
  } finally {
    loadingCategoryManager.value = false
  }
}

const openCategoryManager = () => {
  categoryManagerFieldErrors.value = {}
  showCategoryManager.value = true
  loadCategoryManager()
}

const saveCategory = async ({ id, data }) => {
  savingCategory.value = true
  categoryManagerError.value = ''
  categoryManagerFieldErrors.value = {}
  try {
    const response = id ? await itemApi.updateCategory(id, data) : await itemApi.createCategory(data)
    toast.success(response.message || (id ? 'دسته‌بندی ویرایش شد.' : 'دسته‌بندی ایجاد شد.'))
    await Promise.all([loadCategoryManager(), fetchCategories()])
  } catch (cause) {
    categoryManagerError.value = getApiErrorMessage(cause)
    const payload = cause.response?.data || {}
    categoryManagerFieldErrors.value = payload.errors || (payload.message ? {} : payload)
    toast.error(categoryManagerError.value)
  } finally {
    savingCategory.value = false
  }
}

const deleteCategory = async category => {
  if (!confirm(`دسته‌بندی «${category.name}» حذف شود؟`)) return
  savingCategory.value = true
  categoryManagerError.value = ''
  try {
    const response = await itemApi.deleteCategory(category.id)
    toast.success(response.message || 'دسته‌بندی حذف شد.')
    if (selectedCategoryType.value === 'category' && selectedCategory.value === String(category.id)) selectCategory()
    await Promise.all([loadCategoryManager(), fetchCategories()])
  } catch (cause) {
    categoryManagerError.value = getApiErrorMessage(cause)
    toast.error(categoryManagerError.value)
  } finally {
    savingCategory.value = false
  }
}

const createProduct = async ({ data, image }) => {
  if (creatingProduct.value) return
  creatingProduct.value = true
  createProductError.value = ''
  createProductFieldErrors.value = {}
  try {
    await productCostApi.createProduct(data, image)
    showCreateProduct.value = false
    clearTimeout(itemSearchTimer)
    searchQuery.value = ''
    selectedCategory.value = ''
    selectedCategoryType.value = 'category'
    selectedCategoryLabel.value = ''
    currentPage.value = 1
    await fetchItems()
  } catch (cause) {
    createProductError.value = getApiErrorMessage(cause)
    createProductFieldErrors.value = cause.cost?.errors || cause.response?.data?.errors || {}
  } finally {
    creatingProduct.value = false
  }
}

// ========== توابع صفحه‌بندی محصولات ==========
const nextPage = () => {
  if (itemData.value?.has_next) {
    currentPage.value++
    fetchItems()
  }
}

const prevPage = () => {
  if (itemData.value?.has_previous) {
    currentPage.value--
    fetchItems()
  }
}

// ========== توابع صفحه‌بندی دسته‌بندی‌ها ==========
const nextCategoryPage = () => {
  if (categoryData.value?.has_next) {
    categoryPage.value++
    fetchCategories()
  }
}

const prevCategoryPage = () => {
  if (categoryData.value?.has_previous) {
    categoryPage.value--
    fetchCategories()
  }
}

// ========== اجرای اولیه ==========
onMounted(async () => {
  await initializePosBranch()
})
onBeforeUnmount(() => {
  clearTimeout(itemSearchTimer)
  clearTimeout(categorySearchTimer)
})
</script>

<template>
  <div class="item-list-page">
    <!-- سمت راست: لیست محصولات -->
    <div class="products-section">
      <div class="products-header">
        <div class="header-main">
          <div class="header-title">
            <h1>
              <span class="title-icon">📋</span>
              <span class="title-text">محصولات</span>
            </h1>
            <span class="title-badge">{{ itemData?.count || 0 }} آیتم</span>
          </div>

          <div class="header-actions">
            <button type="button" class="create-product-btn" @click="openCreateProduct">
              <span aria-hidden="true">＋</span> محصول جدید
            </button>
            <button type="button" class="manage-category-btn" @click="openCategoryManager">دسته‌بندی‌ها</button>
            <div
                v-if="selectedCategory"
                class="active-category-chip"
                @click="selectCategory()"
            >
              <span class="chip-icon">🗂️</span>
              <span class="chip-text">{{ selectedCategoryLabel }}</span>
              <span class="chip-remove">✕</span>
            </div>

            <button
                class="filter-toggle-btn"
                :class="{ 'active': showCategoryFilter }"
                @click="showCategoryFilter = !showCategoryFilter"
                title="فیلتر دسته‌بندی"
            >
              <span class="filter-icon">🏷️</span>
            </button>

            <span class="invoice-badge" v-if="invoiceItems.length">
              {{ invoiceItems.length }} در فاکتور
            </span>
          </div>
        </div>

        <div class="product-search">
          <div class="search-container">
            <span class="search-icon">🔍</span>
            <input
                type="text"
                v-model="searchQuery"
                placeholder="جستجوی محصول..."
                class="search-input"
                autofocus
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div v-if="showCategoryFilter" class="category-filter-backdrop" @click="showCategoryFilter=false"></div>
      <div v-if="showCategoryFilter" class="category-filter-panel">
        <div class="filter-header">
          <span class="filter-header-title">فیلتر براساس دسته‌بندی</span>
          <button class="filter-close-btn" @click="showCategoryFilter = false">
            ✕
          </button>
        </div>

        <div class="filter-search">
          <span class="filter-search-icon">🔍</span>
          <input
              type="text"
              v-model="categorySearchQuery"
              placeholder="جستجوی دسته‌بندی..."
              class="filter-search-input"
          />
        </div>

        <div class="filter-list">
          <div
              class="filter-item"
              :class="{ 'active': !selectedCategory }"
              @click="selectCategory()"
          >
            <span class="filter-item-icon">📋</span>
            <span class="filter-item-name">همه محصولات</span>
          </div>

          <div
              v-for="category in categories"
              :key="category.id"
              class="filter-item"
              :class="{ 'active': selectedCategoryType === 'category' && selectedCategory === String(category.id) }"
              @click="selectCategory(category.id, 'category', category.name)"
          >
            <span class="filter-item-icon">{{ category.icon || '📁' }}</span>
            <span class="filter-item-name">{{ category.name }}</span>
          </div>

          <template v-for="category in categories" :key="'sub-'+category.id">
            <div
                v-for="sub in category.subs"
                :key="sub.id"
                class="filter-item sub-item"
                :class="{ 'active': selectedCategoryType === 'subcategory' && selectedCategory === String(sub.id) }"
                @click="selectCategory(sub.id, 'subcategory', sub.name)"
            >
              <span class="filter-item-icon sub-icon">↳</span>
              <span class="filter-item-name">{{ sub.name }}</span>
            </div>
          </template>
        </div>

        <div v-if="categoryError" class="category-error" role="alert">
          <span>{{ categoryError }}</span>
          <button type="button" @click="fetchCategories">تلاش مجدد</button>
        </div>

        <div v-if="categoryData && categoryData.total_pages > 1" class="filter-pagination">
          <button
              @click="prevCategoryPage"
              :disabled="!categoryData?.has_previous"
              class="filter-page-btn"
          >
            ←
          </button>
          <span class="filter-page-info">
            {{ categoryData?.page }} / {{ categoryData?.total_pages }}
          </span>
          <button
              @click="nextCategoryPage"
              :disabled="!categoryData?.has_next"
              class="filter-page-btn"
          >
            →
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <p>در حال بارگذاری محصولات...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="fetchItems" class="retry-btn">
          تلاش مجدد
        </button>
      </div>

      <div v-else-if="items.length > 0" class="products-grid">
        <ItemCard
            v-for="item in items"
            :key="item.id"
            :item="item"
            @add="addToInvoice"
        />
      </div>

      <div v-else class="empty-state">
        <div class="empty-illustration">
          <span class="empty-icon">🍽️</span>
        </div>
        <p v-if="searchQuery">محصولی با نام "{{ searchQuery }}" یافت نشد</p>
        <p v-else-if="selectedCategory">در این دسته‌بندی محصولی وجود ندارد</p>
        <p v-else>هیچ محصولی یافت نشد</p>
        <button v-if="selectedCategory || searchQuery" @click="clearAllFilters" class="empty-btn">
          نمایش همه محصولات
        </button>
      </div>

      <div class="pagination-wrapper" v-if="itemData && itemData.total_pages > 1">
        <div class="pagination">
          <button
              @click="prevPage"
              :disabled="!itemData?.has_previous"
              class="page-btn"
          >
            ←
          </button>

          <span class="page-info">
            صفحه {{ itemData?.page }} از {{ itemData?.total_pages }}
          </span>

          <button
              @click="nextPage"
              :disabled="!itemData?.has_next"
              class="page-btn"
          >
            →
          </button>
        </div>

        <span class="items-count">
          {{ items.length }} از {{ itemData?.count }} محصول
        </span>
      </div>

      <div v-else-if="items.length > 0" class="simple-footer">
        <span>{{ items.length }} محصول</span>
        <span v-if="selectedCategory" class="footer-category">
          • {{ selectedCategoryLabel }}
        </span>
      </div>
    </div>

    <!-- سمت چپ: فاکتور -->
    <div class="invoice-section">
      <div class="pos-customer-panel">
        <CustomerQuickSearch v-model="selectedCustomer" :registration-source="orderType" />
        <p v-if="posContextLoading" class="pos-context-state">در حال آماده‌سازی شعبهٔ طالقانی…</p>
        <p v-else-if="posContextError" class="pos-context-state pos-context-state--error" role="alert">{{ posContextError }}</p>
        <label v-if="orderType === 'phone' && selectedCustomerDetails?.addresses?.length" class="pos-field">آدرس تحویل
          <select v-model="selectedAddress">
            <option value="">بدون آدرس / دریافت حضوری</option>
            <option v-for="address in selectedCustomerDetails.addresses" :key="address.id" :value="address.id">{{ address.name }} — {{ address.detail }}</option>
          </select>
        </label>
        <label v-if="orderType === 'phone'" class="pos-field">روش تحویل
          <select v-model="selectedDelivery"><option value="takeoutN">ارسال/بیرون‌بر، پرداخت‌نشده</option><option value="dine-in">صرف در محل</option></select>
        </label>
        <p v-if="orderType === 'phone' && selectedCustomerDetails" class="previous-orders">{{ selectedCustomerDetails.orders?.length || 0 }} سفارش قبلی؛ قیمت و موجودی سفارش جدید از فهرست جاری محاسبه می‌شود.</p>
        <div v-if="orderType === 'phone' && selectedCustomerDetails?.orders?.length" class="previous-order-list">
          <button v-for="order in selectedCustomerDetails.orders.slice(0,5)" :key="order.id" type="button" class="admin-button admin-button--secondary admin-button--sm" @click="reorderPrevious(order)">تکرار سفارش {{ order.order_number }}</button>
        </div>
      </div>
      <ItemCalculator
          :items="invoiceItems"
          :submitting="submittingOrder"
          :checkout-disabled="!posReady"
          :customer="selectedCustomer"
          :wallet-balance="walletBalance"
          :wallet-loading="customerDetailsLoading"
          :wallet-error="customerDetailsError"
          @update-quantity="updateQuantity"
          @remove-item="removeFromInvoice"
          @clear-invoice="clearInvoice"
          @submit-order="submitOrder"
          @wallet-selection-change="handleWalletSelection"
      />
    </div>
    <ProductCreateModal
        v-model="showCreateProduct"
        :categories="productCategories"
        :loading="creatingProduct"
        :server-error="createProductError"
        :field-errors="createProductFieldErrors"
        @submit="createProduct"
    />
    <ProductCategoryManager
        v-model="showCategoryManager"
        :categories="managedCategories"
        :menus="productMenus"
        :loading="loadingCategoryManager"
        :saving="savingCategory"
        :error="categoryManagerError"
        :errors="categoryManagerFieldErrors"
        @save="saveCategory"
        @delete="deleteCategory"
    />
  </div>
</template>

<style scoped>
.item-list-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  gap: 20px;
  height: 100vh;
  background: var(--app-bg);
  color: var(--text);
  direction: rtl;
  padding: 20px;
  box-sizing: border-box;
}

/* ===== بخش محصولات ===== */
.products-section {
  background: var(--surface);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  min-width: 0;
  border: 1px solid var(--border);
}

/* ===== بخش فاکتور ===== */
.invoice-section {
  background: var(--surface);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
}
.pos-customer-panel{position:relative;z-index:5;flex:0 0 auto;min-width:0;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--surface-subtle)}
.pos-field{display:grid;gap:5px;color:var(--muted);font-size:12px;margin-top:8px}
.pos-field select{width:100%;min-width:0}
.pos-context-state{margin:8px 0 0;color:var(--muted);font-size:12px}.pos-context-state--error{color:var(--color-danger)}
.previous-orders{margin:8px 0 0;color:var(--muted);font-size:12px}
.previous-order-list{display:flex;gap:6px;max-width:100%;overflow:auto;padding-top:8px}

/* ===== هدر محصولات ===== */
.products-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.create-product-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 13px;
  border: 0;
  border-radius: 10px;
  background: var(--primary);
  color: var(--on-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.create-product-btn:hover { background: var(--primary-hover); }

.manage-category-btn {
  padding: 8px 11px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.manage-category-btn:hover { border-color: var(--primary); color: var(--primary); }

.title-icon {
  font-size: 22px;
}

.title-text {
  font-weight: 600;
}

.title-badge {
  font-size: 12px;
  color: var(--muted);
  background: var(--surface-subtle);
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-category-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--surface-subtle);
  border-radius: 30px;
  font-size: 12px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border);
}

.active-category-chip:hover {
  background: var(--color-danger-subtle);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.chip-icon {
  font-size: 12px;
}

.chip-text {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-remove {
  font-size: 12px;
  opacity: 0.6;
}

.filter-toggle-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
  flex-shrink: 0;
}

.filter-toggle-btn:hover {
  background: var(--surface-subtle);
  border-color: var(--border-strong);
  color: var(--text);
}

.filter-toggle-btn.active {
  background: var(--surface-subtle);
  border-color: var(--primary);
  color: var(--primary);
}

.invoice-badge {
  font-size: 12px;
  color: var(--color-success);
  background: var(--color-success-subtle);
  padding: 6px 14px;
  border-radius: 30px;
  font-weight: 500;
  white-space: nowrap;
}

.product-search {
  width: 100%;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.2s;
}

.search-container:focus-within {
  background: var(--surface);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--focus);
}

.search-icon {
  position: absolute;
  right: 14px;
  color: var(--muted);
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 45px 12px 45px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  background: transparent;
  color: var(--text);
}

.search-input:focus {
  outline: none;
}

.search-clear {
  position: absolute;
  left: 12px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 14px;
  padding: 4px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  background: var(--surface-hover);
  color: var(--text);
}

/* ===== پنل فیلتر دسته‌بندی ===== */
.category-filter-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
}

.category-filter-panel {
  position: absolute;
  top: 180px;
  right: 20px;
  width: 280px;
  background: var(--surface-elevated);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border);
  z-index: 100;
  padding: 16px;
  animation: slideIn 0.2s ease;
}

.category-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  padding: 9px 10px;
  border-radius: 8px;
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  font-size: 11px;
}

.category-error button {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-header-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.filter-close-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-close-btn:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.filter-search {
  position: relative;
  margin-bottom: 16px;
}

.filter-search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 13px;
}

.filter-search-input {
  width: 100%;
  padding: 10px 35px 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 12px;
  background: var(--surface-subtle);
}

.filter-search-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--surface);
}

.filter-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.filter-item:hover {
  background: var(--surface-hover);
}

.filter-item.active {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.filter-item-icon {
  width: 20px;
  text-align: center;
  font-size: 14px;
}

.filter-item-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-item {
  padding-right: 36px;
}

.sub-icon {
  color: var(--muted);
  font-size: 12px;
}

.filter-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.filter-page-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  cursor: pointer;
  font-size: 14px;
}

.filter-page-btn:hover:not(:disabled) {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}

.filter-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.filter-page-info {
  font-size: 12px;
  color: var(--muted);
}

/* ===== گرید محصولات ===== */
.products-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  align-content: start;
  min-height: 0;
}

/* ===== حالت‌های مختلف ===== */
.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--surface);
  min-height: 0;
}

.spinner-ring {
  display: inline-block;
  position: relative;
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

.spinner-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 38px;
  height: 38px;
  margin: 5px;
  border: 3px solid var(--primary);
  border-radius: 50%;
  animation: spinner-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: var(--primary) transparent transparent transparent;
}

.spinner-ring div:nth-child(1) { animation-delay: -0.45s; }
.spinner-ring div:nth-child(2) { animation-delay: -0.3s; }
.spinner-ring div:nth-child(3) { animation-delay: -0.15s; }

@keyframes spinner-ring {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  color: var(--muted);
  margin-bottom: 16px;
}

.retry-btn,
.empty-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover,
.empty-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

/* ===== صفحه‌بندی ===== */
.pagination-wrapper {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  color: var(--text);
  transition: all 0.2s;
  flex-shrink: 0;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.items-count {
  font-size: 12px;
  color: var(--muted);
}

.simple-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.footer-category {
  color: var(--primary);
}

/* ===== اسکرول بار ===== */
.products-grid::-webkit-scrollbar,
.filter-list::-webkit-scrollbar {
  width: 4px;
}

.products-grid::-webkit-scrollbar-track,
.filter-list::-webkit-scrollbar-track {
  background: var(--surface-subtle);
}

.products-grid::-webkit-scrollbar-thumb,
.filter-list::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 4px;
}

/* ===== رسپانسیو ===== */
@media (max-width: 1024px) {
  .item-list-page {
    grid-template-columns: minmax(0, 1fr) minmax(300px, 340px);
  }
}

@media (max-width: 768px) {
  .item-list-page {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
    height: auto;
    min-height: 100vh;
  }

  .category-filter-panel {
    position: fixed;
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    max-height: min(78vh, 620px);
    overflow-y: auto;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    border-radius: 20px 20px 0 0;
    animation: slideUp 0.3s ease;
  }

  .category-filter-backdrop {
    background: rgba(15, 23, 42, 0.38);
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .header-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    padding: 12px;
  }

  .invoice-section {
    height: min(760px, calc(100vh - 24px));
    min-height: 560px;
    min-width: 0;
  }
}
</style>
