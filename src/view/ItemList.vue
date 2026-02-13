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
const itemData = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('')

// ========== صفحه‌بندی ==========
const currentPage = ref(1)
const pageSize = ref(50) // پیش فرض ۵۰ تا در هر صفحه

// ========== آیتم‌های انتخاب شده برای فاکتور ==========
const invoiceItems = ref([])

// ========== دریافت محصولات با پارامترها ==========
const fetchItems = async () => {
  try {
    loading.value = true
    error.value = null

    // ساخت پارامترها برای ارسال به بک‌اند
    const params = {
      page: currentPage.value,
      page_size: pageSize.value
    }

    // اضافه کردن سرچ به پارامترها اگه وجود داشت
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    // اضافه کردن دسته‌بندی به پارامترها اگه وجود داشت
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }

    const response = await itemApi.getItemList(params)
    items.value = response.data.results || []
    itemData.value = response

    // اگه صفحه فعلی از کل صفحات بیشتر شد، به صفحه آخر برو
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

// ========== واتچ برای سرچ و دسته‌بندی ==========
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1
  fetchItems()
})

// ========== دسته‌بندی‌ها ==========
const categories = computed(() => {
  const cats = new Set()
  items.value.forEach(item => {
    if (item.subcategory_name) cats.add(item.subcategory_name)
  })
  return Array.from(cats)
})

// ========== مدیریت فاکتور ==========
const addToInvoice = (item) => {
  // تبدیل قیمت به عدد
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
  if (item) {
    item.quantity = quantity
  }
}

const removeFromInvoice = (itemId) => {
  invoiceItems.value = invoiceItems.value.filter(i => i.id !== itemId)
}

const clearInvoice = () => {
  if (confirm('آیا از حذف همه آیتم‌های فاکتور اطمینان دارید؟')) {
    invoiceItems.value = []
  }
}

// ========== توابع صفحه‌بندی ==========
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

// ========== اجرای اولیه ==========
onMounted(async () => {
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
      <!-- هدر -->
      <div class="products-header">
        <div class="header-top">
          <h2>📦 محصولات</h2>
          <div class="header-actions">
            <span class="invoice-badge">
              {{ invoiceItems.length }} آیتم در فاکتور
            </span>
            <button @click="clearInvoice" class="clear-btn" v-if="invoiceItems.length">
              🗑️ پاک کردن فاکتور
            </button>
          </div>
        </div>

        <!-- نوار جستجو و فیلتر -->
        <div class="search-filter">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
                type="text"
                v-model="searchQuery"
                placeholder="جستجوی نام محصول..."
                class="search-input"
            />
          </div>

          <select v-model="selectedCategory" class="category-select">
            <option value="">همه دسته‌ها</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>
      </div>

      <!-- وضعیت بارگذاری -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>در حال بارگذاری محصولات...</p>
      </div>

      <!-- خطا -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="fetchItems" class="retry-btn">
          تلاش مجدد
        </button>
      </div>

      <!-- گرید محصولات -->
      <div v-else-if="items.length > 0" class="products-grid">
        <ItemCard
            v-for="item in items"
            :key="item.id"
            :item="item"
            @add="addToInvoice"
        />
      </div>

      <!-- حالت خالی -->
      <div v-else class="empty-state">
        <span class="empty-icon">📦</span>
        <p v-if="searchQuery">محصولی با این مشخصات یافت نشد</p>
        <p v-else>هیچ محصولی ثبت نشده است</p>
      </div>

      <!-- صفحه‌بندی -->
      <div class="pagination-wrapper" v-if="itemData && itemData.total_pages > 1">
        <div class="pagination">
          <button
              @click="prevPage"
              :disabled="!itemData?.has_previous"
              class="page-btn prev"
          >
            ›
          </button>

          <div class="page-numbers">
            <span class="current-page">{{ itemData?.page || 1 }}</span>
            <span class="total-pages">از {{ itemData?.total_pages || 1 }}</span>
          </div>

          <button
              @click="nextPage"
              :disabled="!itemData?.has_next"
              class="page-btn next"
          >
            ‹
          </button>
        </div>

        <div class="items-count">
          نمایش {{ items.length }} از {{ itemData?.count || 0 }} محصول
        </div>
      </div>

      <!-- آمار محصولات (وقتی فقط یک صفحه است) -->
      <div v-else-if="items.length > 0" class="simple-footer">
        <span>نمایش {{ items.length }} از {{ itemData?.count || items.length }} محصول</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-list-page {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: #f8fafc;
  direction: rtl;
  font-family: Vazir, IRANSans, Tahoma, sans-serif;
}

/* ===== بخش فاکتور (راست) ===== */
.invoice-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #edf2f7;
}

/* ===== بخش محصولات (چپ) ===== */
.products-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  border: 1px solid #edf2f7;
}

.products-header {
  padding: 20px 24px;
  border-bottom: 1px solid #edf2f7;
  background: white;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-top h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.invoice-badge {
  font-size: 12px;
  color: #0b6e4f;
  background: #e3f2ed;
  padding: 6px 14px;
  border-radius: 30px;
  font-weight: 600;
}

.clear-btn {
  font-size: 12px;
  color: #b91c1c;
  background: #fee9e7;
  border: none;
  padding: 6px 14px;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.clear-btn:hover {
  background: #fecaca;
}

.search-filter {
  display: flex;
  gap: 12px;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 15px;
}

.search-input {
  width: 100%;
  padding: 12px 45px 12px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  font-size: 13px;
  transition: all 0.2s;
  background: #f8fafc;
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
  background: white;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.08);
}

.category-select {
  padding: 12px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  font-size: 13px;
  color: #0f172a;
  background: #f8fafc;
  cursor: pointer;
  min-width: 160px;
  transition: all 0.2s;
}

.category-select:focus {
  outline: none;
  border-color: #4CAF50;
  background: white;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.08);
}

/* ===== گرید محصولات ===== */
.products-grid {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
  padding: 60px 20px;
  background: white;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 32px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.retry-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(76, 175, 80, 0.25);
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
  gap: 20px;
}

.page-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #e2e8f0;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  color: #475569;
  transition: all 0.2s;
  font-weight: 500;
}

.page-btn:hover:not(:disabled) {
  background: #4CAF50;
  border-color: #4CAF50;
  color: white;
  transform: scale(0.95);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f1f5f9;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 6px 16px;
  border-radius: 30px;
}

.current-page {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  background: white;
  padding: 4px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.total-pages {
  font-size: 13px;
  color: #64748b;
}

.items-count {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  background: #f8fafc;
  padding: 8px 16px;
  border-radius: 30px;
}

.simple-footer {
  padding: 16px 24px;
  border-top: 1px solid #edf2f7;
  font-size: 13px;
  color: #64748b;
  text-align: left;
  background: white;
}

/* ===== اسکرول بار ===== */
.products-grid::-webkit-scrollbar {
  width: 6px;
}

.products-grid::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.products-grid::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.products-grid::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ===== رسپانسیو ===== */
@media (max-width: 1024px) {
  .item-list-page {
    grid-template-columns: 340px 1fr;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .item-list-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    height: auto;
    padding: 16px;
  }

  .invoice-section {
    order: 2;
    height: 500px;
  }

  .products-section {
    order: 1;
    height: 600px;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    padding: 16px;
  }

  .search-filter {
    flex-direction: column;
  }

  .category-select {
    width: 100%;
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    text-align: center;
  }

  .pagination {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }

  .header-top {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .page-numbers {
    padding: 4px 12px;
  }
}
</style>