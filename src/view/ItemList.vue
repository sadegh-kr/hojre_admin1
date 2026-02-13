<!-- ItemList.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import itemApi from "@/api/item.api.js";
import ItemCalculator from "@/components/item/ItemCalculator.vue";
import ItemCard from "@/components/item/ItemCard.vue";

// ========== حالت‌ها ==========
const loading = ref(true)
const error = ref(null)
const items = ref([])
const categories = ref([])
const itemData = ref(null)
const categoryData = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('')
const categorySearchQuery = ref('')
const showCategoryFilter = ref(false) // برای نمایش/مخفی کردن فیلتر دسته‌بندی

// ========== صفحه‌بندی ==========
const currentPage = ref(1)
const pageSize = ref(50)
const categoryPage = ref(1)
const categoryPageSize = ref(20)

// ========== آیتم‌های فاکتور ==========
const invoiceItems = ref([])

// ========== دریافت دسته‌بندی‌ها ==========
const fetchCategories = async () => {
  try {
    const params = {
      page: categoryPage.value,
      page_size: categoryPageSize.value
    }

    if (categorySearchQuery.value) {
      params.search = categorySearchQuery.value
    }

    const response = await itemApi.getItemCategory(params)
    categoryData.value = response
    categories.value = response.data?.results || response.results || response || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

// ========== واتچ برای جستجوی دسته‌بندی ==========
watch(categorySearchQuery, () => {
  categoryPage.value = 1
  fetchCategories()
})

// ========== دریافت محصولات با ارسال آیدی دسته‌بندی ==========
const fetchItems = async () => {
  try {
    loading.value = true
    error.value = null

    const params = {
      page: currentPage.value,
      page_size: pageSize.value
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    // ارسال آیدی دسته‌بندی به API
    if (selectedCategory.value) {
      params.category_id = selectedCategory.value // تغییر از category به category_id
      console.log('Sending category_id:', selectedCategory.value) // برای دیباگ
    }

    const response = await itemApi.getItemList(params)
    items.value = response.data?.results || response.results || []
    itemData.value = response

    if (currentPage.value > response.total_pages) {
      currentPage.value = response.total_pages || 1
    }
  } catch (err) {
    error.value = 'خطا در دریافت اطلاعات'
    console.error('Error fetching items:', err)
  } finally {
    loading.value = false
  }
}

// ========== واتچ برای سرچ محصول و دسته‌بندی ==========
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1
  fetchItems()
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

// ========== انتخاب دسته‌بندی ==========
const selectCategory = (categoryId) => {
  if (selectedCategory.value === categoryId) {
    selectedCategory.value = '' // پاک کردن فیلتر
  } else {
    selectedCategory.value = categoryId
  }
  // بستن منوی دسته‌بندی بعد از انتخاب
  showCategoryFilter.value = false
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

// ========== نام دسته‌بندی انتخاب شده ==========
const selectedCategoryName = computed(() => {
  if (!selectedCategory.value) return 'همه محصولات'

  // جستجو در دسته‌بندی‌های اصلی
  const mainCat = categories.value.find(c => c.id === selectedCategory.value)
  if (mainCat) return mainCat.name

  // جستجو در زیرمجموعه‌ها
  for (const cat of categories.value) {
    const sub = cat.subs?.find(s => s.id === selectedCategory.value)
    if (sub) return sub.name
  }

  return 'دسته‌بندی'
})

// ========== اجرای اولیه ==========
onMounted(async () => {
  await fetchCategories()
  await fetchItems()
})
</script>

<template>
  <div class="item-list-page">
    <!-- سمت راست: فاکتور -->
    <div class="invoice-section">
      <ItemCalculator
          :items="invoiceItems"
          @update-quantity="updateQuantity"
          @remove-item="removeFromInvoice"
          @clear-invoice="clearInvoice"
      />
    </div>

    <!-- سمت چپ: لیست محصولات -->
    <div class="products-section">
      <!-- ===== هدر ساده با تاکید روی محصولات ===== -->
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
            <!-- نشانگر دسته‌بندی فعال - خیلی ساده و بی‌ادعا -->
            <div
                v-if="selectedCategory"
                class="active-category-chip"
                @click="selectCategory('')"
            >
              <span class="chip-icon">🗂️</span>
              <span class="chip-text">{{ selectedCategoryName }}</span>
              <span class="chip-remove">✕</span>
            </div>

            <!-- دکمه فیلتر دسته‌بندی - یک آیکون ساده -->
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

        <!-- جستجوی محصولات - اولویت اول -->
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

      <!-- ===== پنل فیلتر دسته‌بندی - مخفی و مینیمال ===== -->
      <div v-if="showCategoryFilter" class="category-filter-panel">
        <div class="filter-header">
          <span class="filter-header-title">فیلتر براساس دسته‌بندی</span>
          <button class="filter-close-btn" @click="showCategoryFilter = false">
            ✕
          </button>
        </div>

        <!-- جستجوی دسته‌بندی داخل پنل -->
        <div class="filter-search">
          <span class="filter-search-icon">🔍</span>
          <input
              type="text"
              v-model="categorySearchQuery"
              placeholder="جستجوی دسته‌بندی..."
              class="filter-search-input"
          />
        </div>

        <!-- لیست دسته‌بندی‌ها -->
        <div class="filter-list">
          <!-- گزینه همه محصولات -->
          <div
              class="filter-item"
              :class="{ 'active': !selectedCategory }"
              @click="selectCategory('')"
          >
            <span class="filter-item-icon">📋</span>
            <span class="filter-item-name">همه محصولات</span>
            <span class="filter-item-count">{{ itemData?.count || 0 }}</span>
          </div>

          <!-- دسته‌بندی‌های اصلی -->
          <div
              v-for="category in categories"
              :key="category.id"
              class="filter-item"
              :class="{ 'active': selectedCategory === category.id }"
              @click="selectCategory(category.id)"
          >
            <span class="filter-item-icon">{{ category.icon || '📁' }}</span>
            <span class="filter-item-name">{{ category.name }}</span>
            <span class="filter-item-count">{{ category.items_count || 0 }}</span>
          </div>

          <!-- زیرمجموعه‌ها -->
          <template v-for="category in categories" :key="'sub-'+category.id">
            <div
                v-for="sub in category.subs"
                :key="sub.id"
                class="filter-item sub-item"
                :class="{ 'active': selectedCategory === sub.id }"
                @click="selectCategory(sub.id)"
            >
              <span class="filter-item-icon sub-icon">↳</span>
              <span class="filter-item-name">{{ sub.name }}</span>
              <span class="filter-item-count">0</span>
            </div>
          </template>
        </div>

        <!-- صفحه‌بندی دسته‌بندی -->
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

      <!-- ===== وضعیت بارگذاری ===== -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <p>در حال بارگذاری محصولات...</p>
      </div>

      <!-- ===== خطا ===== -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="fetchItems" class="retry-btn">
          تلاش مجدد
        </button>
      </div>

      <!-- ===== گرید محصولات - اولویت اول ===== -->
      <div v-else-if="items.length > 0" class="products-grid">
        <ItemCard
            v-for="item in items"
            :key="item.id"
            :item="item"
            @add="addToInvoice"
        />
      </div>

      <!-- ===== حالت خالی ===== -->
      <div v-else class="empty-state">
        <div class="empty-illustration">
          <span class="empty-icon">🍽️</span>
        </div>
        <p v-if="searchQuery">محصولی با نام "{{ searchQuery }}" یافت نشد</p>
        <p v-else-if="selectedCategory">در این دسته‌بندی محصولی وجود ندارد</p>
        <p v-else>هیچ محصولی یافت نشد</p>
        <button v-if="selectedCategory || searchQuery" @click="searchQuery = ''; selectCategory('')" class="empty-btn">
          نمایش همه محصولات
        </button>
      </div>

      <!-- ===== صفحه‌بندی محصولات ===== -->
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

      <!-- ===== آمار محصولات ===== -->
      <div v-else-if="items.length > 0" class="simple-footer">
        <span>{{ items.length }} محصول</span>
        <span v-if="selectedCategory" class="footer-category">
          • {{ selectedCategoryName }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-list-page {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  height: 100%;
  background: #f5f7fb;
  direction: rtl;
}

/* ===== بخش فاکتور ===== */
.invoice-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* ===== بخش محصولات ===== */
.products-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* ===== هدر ساده و مینیمال ===== */
.products-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: white;
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
  color: #1e293b;
}

.title-icon {
  font-size: 22px;
}

.title-text {
  font-weight: 600;
}

.title-badge {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ===== چیپ دسته‌بندی فعال - خیلی ساده ===== */
.active-category-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 30px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.active-category-chip:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #b91c1c;
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

.active-category-chip:hover .chip-remove {
  opacity: 1;
}

/* ===== دکمه فیلتر - یک آیکون ساده ===== */
.filter-toggle-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
}

.filter-toggle-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.filter-toggle-btn.active {
  background: #f1f5f9;
  border-color: #a17c5a;
  color: #a17c5a;
}

.invoice-badge {
  font-size: 12px;
  color: #0b6e4f;
  background: #e3f2ed;
  padding: 6px 14px;
  border-radius: 30px;
  font-weight: 500;
}

/* ===== جستجوی محصول - اولویت اول ===== */
.product-search {
  width: 100%;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
}

.search-container:focus-within {
  background: white;
  border-color: #a17c5a;
  box-shadow: 0 0 0 3px rgba(161, 124, 90, 0.08);
}

.search-icon {
  position: absolute;
  right: 14px;
  color: #94a3b8;
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 45px 12px 45px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  background: transparent;
  color: #1e293b;
}

.search-input:focus {
  outline: none;
}

.search-clear {
  position: absolute;
  left: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  padding: 4px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  background: #e2e8f0;
  color: #475569;
}

/* ===== پنل فیلتر دسته‌بندی - مخفی و مینیمال ===== */
.category-filter-panel {
  position: absolute;
  top: 180px;
  right: 20px;
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 100;
  padding: 16px;
  animation: slideIn 0.2s ease;
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
  color: #0f172a;
}

.filter-close-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
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
  color: #94a3b8;
  font-size: 13px;
}

.filter-search-input {
  width: 100%;
  padding: 10px 35px 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 12px;
  background: #f8fafc;
}

.filter-search-input:focus {
  outline: none;
  border-color: #a17c5a;
  background: white;
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
  background: #f8fafc;
}

.filter-item.active {
  background: #f0fdf4;
  color: #4CAF50;
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

.filter-item-count {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 12px;
}

.filter-item.active .filter-item-count {
  background: #e8f5e9;
  color: #4CAF50;
}

.sub-item {
  padding-right: 36px;
}

.sub-icon {
  color: #94a3b8;
  font-size: 12px;
}

.filter-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #edf2f7;
}

.filter-page-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  font-size: 14px;
}

.filter-page-btn:hover:not(:disabled) {
  background: #a17c5a;
  border-color: #a17c5a;
  color: white;
}

.filter-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.filter-page-info {
  font-size: 12px;
  color: #64748b;
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
  background: #ffffff;
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
  background: white;
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
  border: 3px solid #a17c5a;
  border-radius: 50%;
  animation: spinner-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #a17c5a transparent transparent transparent;
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
  color: #cbd5e1;
  margin-bottom: 16px;
}

.retry-btn,
.empty-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background: #a17c5a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover,
.empty-btn:hover {
  background: #8b6b4f;
  transform: translateY(-1px);
}

/* ===== صفحه‌بندی ===== */
.pagination-wrapper {
  padding: 16px 24px;
  border-top: 1px solid #edf2f7;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  color: #475569;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #a17c5a;
  border-color: #a17c5a;
  color: white;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #0f172a;
  font-weight: 500;
}

.items-count {
  font-size: 12px;
  color: #64748b;
}

.simple-footer {
  padding: 16px 24px;
  border-top: 1px solid #edf2f7;
  font-size: 12px;
  color: #64748b;
  display: flex;
  gap: 8px;
}

.footer-category {
  color: #a17c5a;
}

/* ===== اسکرول بار ===== */
.products-grid::-webkit-scrollbar,
.filter-list::-webkit-scrollbar {
  width: 4px;
}

.products-grid::-webkit-scrollbar-track,
.filter-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.products-grid::-webkit-scrollbar-thumb,
.filter-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* ===== رسپانسیو ===== */
@media (max-width: 1024px) {
  .item-list-page {
    grid-template-columns: 340px 1fr;
  }
}

@media (max-width: 768px) {
  .item-list-page {
    grid-template-columns: 1fr;
  }

  .category-filter-panel {
    position: fixed;
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    border-radius: 20px 20px 0 0;
    animation: slideUp 0.3s ease;
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
}
</style>