<!-- src/components/Table.vue -->
<template>
  <div class="table-container" :class="{ 'loading': loading }">

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span>در حال بارگذاری...</span>
    </div>

    <!-- Table Header -->
    <div v-if="showHeader" class="table-header">
      <div class="header-left">
        <h3 v-if="title" class="table-title">{{ title }}</h3>
        <span v-if="showTotal && !loading" class="total-items">
          {{ totalItems }} مورد
        </span>
      </div>

      <div class="header-right">
        <!-- Search -->
        <div v-if="searchable" class="search-wrapper">
          <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجو..."
              class="search-input"
              @input="onSearch"
              :disabled="loading"
          />
          <span class="search-icon">🔍</span>
        </div>

        <!-- Refresh Button -->
        <button
            v-if="refreshable"
            @click="onRefresh"
            class="refresh-btn"
            :disabled="loading"
            title="بروزرسانی"
        >
          ↻
        </button>

        <!-- Items Per Page -->
        <div v-if="pagination && pageSizeOptions?.length" class="page-size-wrapper">
          <label for="page-size">ردیف در صفحه:</label>
          <select
              id="page-size"
              v-model="localPageSize"
              @change="onPageSizeChange"
              class="page-size-select"
              :disabled="loading"
          >
            <option v-for="option in pageSizeOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="table-responsive" v-if="!isMobile">
      <table class="table">
        <thead>
        <tr>
          <!-- Row Number Column -->
          <th v-if="showRowNumber" class="row-number-col" width="50">
            #
          </th>

          <!-- Data Columns -->
          <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width, textAlign: column.align || 'right' }"
              :class="{ 'sortable': column.sortable }"
          >
            <div class="th-content">
              <span>{{ column.title }}</span>
              <button
                  v-if="column.sortable"
                  @click="sortBy(column.key)"
                  class="sort-btn"
                  :class="{
                    'active': sortColumn === column.key,
                    'asc': sortColumn === column.key && sortOrder === 'asc',
                    'desc': sortColumn === column.key && sortOrder === 'desc'
                  }"
                  :disabled="loading"
              >
                ↕️
              </button>
            </div>
          </th>

          <!-- Actions Column -->
          <th v-if="actions.length" class="actions-col" width="120">
            عملیات
          </th>
        </tr>
        </thead>

        <tbody>
        <tr
            v-for="(row, index) in paginatedData"
            :key="getRowId(row, index)"
            :class="{ 'even': index % 2 === 0, 'odd': index % 2 !== 0, 'clickable': selectable }"
            @click="onRowClick(row)"
        >
          <!-- Row Number -->
          <td v-if="showRowNumber" class="row-number">
            {{ getRowNumber(index) }}
          </td>

          <!-- Data Cells -->
          <td
              v-for="column in columns"
              :key="column.key"
              :style="{ textAlign: column.align || 'right' }"
          >
            <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getValue(row, column.key)"
                :index="index"
            >
              {{ formatValue(getValue(row, column.key), column) }}
            </slot>
          </td>

          <!-- Action Buttons -->
          <td v-if="actions.length" class="actions-cell">
            <div class="actions-wrapper">
              <button
                  v-for="action in actions"
                  :key="action.name"
                  @click.stop="handleAction(action, row)"
                  class="action-btn"
                  :class="action.class"
                  :disabled="isActionDisabled(action, row)"
                  :title="action.title"
              >
                <span v-if="action.icon" class="action-icon">{{ action.icon }}</span>
                <span v-if="!isMobile && action.label" class="action-label">{{ action.label }}</span>
              </button>
            </div>
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-if="!loading && filteredData.length === 0">
          <td :colspan="totalColumns" class="empty-cell">
            <div class="empty-state">
              <span class="empty-icon">📄</span>
              <p>داده‌ای برای نمایش وجود ندارد</p>
              <button
                  v-if="searchQuery"
                  @click="clearSearch"
                  class="clear-search-btn"
              >
                پاک کردن جستجو
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div v-else class="mobile-cards">
      <div
          v-for="(row, index) in paginatedData"
          :key="getRowId(row, index)"
          class="mobile-card"
          :class="{ 'clickable': selectable }"
          @click="onRowClick(row)"
      >
        <div class="card-header">
          <span v-if="showRowNumber" class="card-number">
            {{ getRowNumber(index) }}
          </span>
          <h4 class="card-title">
            {{ getCardTitle(row) }}
          </h4>
        </div>

        <div class="card-content">
          <div
              v-for="column in mobileColumns"
              :key="column.key"
              class="card-row"
          >
            <span class="card-label">{{ column.title }}:</span>
            <span class="card-value">
              <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :value="getValue(row, column.key)"
                  :index="index"
              >
                {{ formatValue(getValue(row, column.key), column) }}
              </slot>
            </span>
          </div>
        </div>

        <!-- Mobile Actions -->
        <div v-if="mobileActions.length" class="card-actions">
          <button
              v-for="action in mobileActions"
              :key="action.name"
              @click.stop="handleAction(action, row)"
              class="mobile-action-btn"
              :class="action.class"
              :disabled="isActionDisabled(action, row)"
              :title="action.title"
          >
            <span v-if="action.icon" class="action-icon">{{ action.icon }}</span>
            <span v-if="action.label" class="action-label">{{ action.label }}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Empty State -->
      <div v-if="!loading && filteredData.length === 0" class="mobile-empty">
        <div class="empty-state">
          <span class="empty-icon">📄</span>
          <p>داده‌ای برای نمایش وجود ندارد</p>
          <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-search-btn"
          >
            پاک کردن جستجو
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && totalPages > 1" class="pagination">
      <div class="pagination-info">
        نمایش
        <strong>{{ startItem }}</strong>
        تا
        <strong>{{ endItem }}</strong>
        از
        <strong>{{ totalItems }}</strong>
        مورد
      </div>

      <div class="pagination-controls">
        <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1 || loading"
            class="pagination-btn prev-btn"
        >
          قبلی
        </button>

        <div class="page-numbers">
          <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="['page-btn', { 'active': page === currentPage }]"
              :disabled="loading"
          >
            {{ page }}
          </button>
        </div>

        <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages || loading"
            class="pagination-btn next-btn"
        >
          بعدی
        </button>
      </div>

      <!-- Go to Page -->
      <div v-if="showGoToPage" class="go-to-page">
        <label>برو به:</label>
        <input
            type="number"
            v-model.number="goToPageInput"
            @keyup.enter="goToPageHandler"
            :min="1"
            :max="totalPages"
            class="goto-input"
            :disabled="loading"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// Props
const props = defineProps({
  // داده‌ها
  data: {
    type: Array,
    required: true,
    default: () => []
  },

  // ستون‌ها
  columns: {
    type: Array,
    required: true,
    default: () => []
  },

  // عنوان جدول
  title: {
    type: String,
    default: ''
  },

  // نمایش هدر
  showHeader: {
    type: Boolean,
    default: true
  },

  // نمایش شماره ردیف
  showRowNumber: {
    type: Boolean,
    default: true
  },

  // نمایش تعداد کل
  showTotal: {
    type: Boolean,
    default: true
  },

  // قابلیت کلیک روی ردیف
  selectable: {
    type: Boolean,
    default: false
  },

  // صفحه‌بندی
  pagination: {
    type: Boolean,
    default: true
  },

  // صفحه‌بندی سمت سرور
  serverPagination: {
    type: Boolean,
    default: false
  },

  // تعداد کل آیتم‌ها (برای صفحه‌بندی سمت سرور)
  totalItems: {
    type: Number,
    default: undefined
  },

  // صفحه جاری (برای صفحه‌بندی سمت سرور)
  currentPage: {
    type: Number,
    default: 1
  },

  // تعداد در هر صفحه
  pageSize: {
    type: Number,
    default: 10
  },

  // گزینه‌های تعداد در هر صفحه
  pageSizeOptions: {
    type: Array,
    default: () => [5, 10, 20, 50]
  },

  // نمایش برو به صفحه
  showGoToPage: {
    type: Boolean,
    default: false
  },

  // جستجو
  searchable: {
    type: Boolean,
    default: false
  },

  // فیلدهای قابل جستجو
  searchFields: {
    type: Array,
    default: () => []
  },

  // قابلیت بروزرسانی
  refreshable: {
    type: Boolean,
    default: false
  },

  // وضعیت بارگیری
  loading: {
    type: Boolean,
    default: false
  },

  // عملیات
  actions: {
    type: Array,
    default: () => []
  },

  // عملیات در موبایل
  mobileActions: {
    type: Array,
    default: null
  },

  // ستون‌های نمایش در موبایل
  mobileColumns: {
    type: Array,
    default: null
  },

  // فیلد عنوان در موبایل
  mobileTitleField: {
    type: String,
    default: ''
  },

  // کلید اصلی هر ردیف
  rowKey: {
    type: [String, Function],
    default: 'id'
  },

  // مرتب‌سازی پیش‌فرض
  defaultSort: {
    type: Object,
    default: () => ({ column: '', order: 'asc' })
  }
});

// Emits
const emit = defineEmits([
  'row-click',
  'action',
  'search',
  'sort',
  'page-change',
  'refresh',
  'update:pageSize'
]);

// Reactive State
const currentPage = ref(props.currentPage);
const localPageSize = ref(props.pageSize);
const searchQuery = ref('');
const sortColumn = ref(props.defaultSort.column);
const sortOrder = ref(props.defaultSort.order);
const isMobile = ref(false);
const goToPageInput = ref(props.currentPage);

// Computed Properties
const filteredData = computed(() => {
  if (!searchQuery.value || !props.searchable) {
    return props.data;
  }

  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return props.data;

  return props.data.filter(row => {
    // اگر فیلدهای جستجو مشخص شده باشند
    if (props.searchFields.length > 0) {
      return props.searchFields.some(field => {
        const value = getValue(row, field);
        return String(value).toLowerCase().includes(query);
      });
    }

    // در غیر این صورت در همه فیلدها جستجو کن
    return Object.values(row).some(value =>
        String(value).toLowerCase().includes(query)
    );
  });
});

const sortedData = computed(() => {
  if (!sortColumn.value) return filteredData.value;

  return [...filteredData.value].sort((a, b) => {
    const aVal = getValue(a, sortColumn.value);
    const bVal = getValue(b, sortColumn.value);

    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortOrder.value === 'asc' ? -1 : 1;
    if (bVal == null) return sortOrder.value === 'asc' ? 1 : -1;

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (aStr < bStr) return sortOrder.value === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const totalItems = computed(() => {
  // اگر serverPagination فعال باشد و totalItems از props آمده باشد
  if (props.serverPagination && props.totalItems !== undefined) {
    return props.totalItems;
  }
  // در غیر این صورت از داده‌های محلی استفاده کنید
  return sortedData.value.length;
});

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / localPageSize.value);
});

const startItem = computed(() => {
  return ((currentPage.value - 1) * localPageSize.value) + 1;
});

const endItem = computed(() => {
  return Math.min(currentPage.value * localPageSize.value, totalItems.value);
});

const paginatedData = computed(() => {
  // اگر serverPagination فعال باشد، همه داده‌ها را برگردان
  if (props.serverPagination) {
    return sortedData.value;
  }

  // در غیر این صورت صفحه‌بندی سمت کلاینت انجام دهید
  if (!props.pagination || totalPages.value <= 1) {
    return sortedData.value;
  }

  const start = (currentPage.value - 1) * localPageSize.value;
  const end = start + localPageSize.value;
  return sortedData.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;

  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
    return pages;
  }

  let start = Math.max(1, currentPage.value - 2);
  let end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const totalColumns = computed(() => {
  let count = props.columns.length;
  if (props.showRowNumber) count++;
  if (props.actions.length) count++;
  return count;
});

const mobileColumns = computed(() => {
  if (props.mobileColumns && props.mobileColumns.length > 0) {
    return props.columns.filter(col =>
        props.mobileColumns.includes(col.key)
    );
  }
  return props.columns.slice(0, 3);
});

const mobileActions = computed(() => {
  return props.mobileActions || props.actions;
});

// Methods
const getValue = (row, key) => {
  if (!key) return null;

  // Handle nested properties (e.g., 'user.name')
  if (key.includes('.')) {
    return key.split('.').reduce((obj, prop) => obj?.[prop], row);
  }

  return row[key];
};

const formatValue = (value, column) => {
  if (value == null || value === '') return '-';

  // Custom formatter
  if (column.format && typeof column.format === 'function') {
    return column.format(value);
  }

  // Date formatting
  if (value instanceof Date || (typeof value === 'string' && Date.parse(value))) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('fa-IR');
    }
  }

  // Number formatting
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fa-IR').format(value);
  }

  return value;
};

const getRowId = (row, index) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row);
  }

  const key = props.rowKey;
  if (key && row[key] != null) {
    return row[key];
  }

  // Fallback to index
  return `row-${index}`;
};

const getRowNumber = (index) => {
  return startItem.value + index;
};

const getCardTitle = (row) => {
  if (props.mobileTitleField) {
    return getValue(row, props.mobileTitleField);
  }

  // Use first column as title
  if (props.columns.length > 0) {
    return getValue(row, props.columns[0].key);
  }

  return '';
};

const sortBy = (column) => {
  if (sortColumn.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortOrder.value = 'asc';
  }

  currentPage.value = 1;
  emit('sort', { column: sortColumn.value, order: sortOrder.value });
};

const onSearch = () => {
  currentPage.value = 1;
  emit('search', searchQuery.value);
};

const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  emit('search', '');
};

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;

  currentPage.value = page;
  goToPageInput.value = page;
  emitPageChange();
};

const goToPageHandler = () => {
  const page = parseInt(goToPageInput.value);
  if (page >= 1 && page <= totalPages.value) {
    goToPage(page);
  } else {
    goToPageInput.value = currentPage.value;
  }
};

const onPageSizeChange = () => {
  currentPage.value = 1;
  emit('update:pageSize', localPageSize.value);
  emitPageChange();
};

const emitPageChange = () => {
  emit('page-change', {
    page: currentPage.value,
    pageSize: localPageSize.value,
    total: totalItems.value,
    start: startItem.value,
    end: endItem.value
  });
};

const onRefresh = () => {
  emit('refresh');
};

const onRowClick = (row) => {
  if (props.selectable) {
    emit('row-click', row);
  }
};

const handleAction = (action, row) => {
  emit('action', { action: action.name, row });
};

const isActionDisabled = (action, row) => {
  if (typeof action.disabled === 'function') {
    return action.disabled(row);
  }
  return action.disabled || false;
};

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// Lifecycle Hooks
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);

  // Initialize
  localPageSize.value = props.pageSize;
  currentPage.value = props.currentPage;
  goToPageInput.value = props.currentPage;
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// Watchers
watch(() => props.currentPage, (newPage) => {
  if (props.serverPagination) {
    currentPage.value = newPage;
    goToPageInput.value = newPage;
  }
});

watch(() => props.pageSize, (newSize) => {
  localPageSize.value = newSize;
  if (!props.serverPagination) {
    currentPage.value = 1;
  }
});

watch(() => props.data, () => {
  if (!props.serverPagination) {
    currentPage.value = 1;
  }
});

watch(currentPage, (newPage) => {
  goToPageInput.value = newPage;
});
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.table-container.loading {
  min-height: 200px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Header */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-title {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
  font-weight: 600;
}

.total-items {
  background: #e7f5ff;
  color: #1971c2;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  width: 250px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}

.search-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
}

.refresh-btn {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6c757d;
  font-size: 1rem;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
  color: #495057;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-size-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #495057;
}

.page-size-select {
  padding: 6px 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #495057;
  font-size: 0.875rem;
  cursor: pointer;
}

.page-size-select:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

/* Table */
.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.table th {
  background: #f1f3f5;
  color: #495057;
  font-weight: 600;
  text-align: right;
  padding: 12px 16px;
  border-bottom: 2px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 5;
}

.table th.sortable {
  cursor: pointer;
}

.table th.sortable:hover {
  background: #e9ecef;
}

.th-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.sort-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #adb5bd;
  font-size: 0.75rem;
  transition: color 0.2s;
}

.sort-btn:hover:not(.active) {
  color: #6c757d;
}

.sort-btn.active {
  color: #4dabf7;
}

.sort-btn.asc {
  transform: rotate(180deg);
}

.sort-btn.desc {
  transform: rotate(0deg);
}

.row-number-col {
  text-align: center;
}

.actions-col {
  text-align: center;
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  text-align: right;
}

.table tbody tr {
  transition: background-color 0.2s;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

.table tbody tr.clickable {
  cursor: pointer;
}

.table tbody tr.clickable:hover {
  background: #e7f5ff;
}

.table tbody tr.even {
  background: #fcfcfc;
}

.table tbody tr.odd {
  background: white;
}

.row-number {
  text-align: center;
  color: #6c757d;
  font-weight: 500;
}

.actions-cell {
  white-space: nowrap;
}

.actions-wrapper {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 32px;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 0.9rem;
}

.action-label {
  font-weight: 500;
}

/* Empty State */
.empty-cell {
  padding: 60px 20px !important;
}

.mobile-empty {
  padding: 40px 20px;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 1rem;
}

.clear-search-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: #e9ecef;
}

/* Mobile Cards */
.mobile-cards {
  padding: 16px;
}

.mobile-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.mobile-card.clickable {
  cursor: pointer;
}

.mobile-card.clickable:hover {
  border-color: #4dabf7;
  box-shadow: 0 4px 8px rgba(77, 171, 247, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-number {
  background: #4dabf7;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
  padding: 16px;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f8f9fa;
}

.card-row:last-child {
  border-bottom: none;
}

.card-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
  min-width: 100px;
  flex-shrink: 0;
}

.card-value {
  color: #6c757d;
  font-size: 0.875rem;
  text-align: left;
  flex: 1;
  word-break: break-word;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  flex-wrap: wrap;
}

.mobile-action-btn {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 100px;
  justify-content: center;
}

.mobile-action-btn:hover:not(:disabled) {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.mobile-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-info {
  color: #6c757d;
  font-size: 0.875rem;
}

.pagination-info strong {
  color: #495057;
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: white;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dee2e6;
  background: white;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.page-btn.active {
  background: #4dabf7;
  color: white;
  border-color: #4dabf7;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.go-to-page {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #495057;
}

.goto-input {
  width: 60px;
  padding: 6px 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  text-align: center;
  font-size: 0.875rem;
}

.goto-input:focus {
  outline: none;
  border-color: #4dabf7;
}

.goto-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-left, .header-right {
    width: 100%;
  }

  .header-right {
    justify-content: space-between;
  }

  .search-wrapper {
    flex: 1;
    max-width: none;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .pagination-controls {
    order: 1;
    justify-content: center;
  }

  .pagination-info {
    order: 2;
    text-align: center;
  }

  .go-to-page {
    order: 3;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .table-header {
    padding: 12px;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }

  .mobile-card {
    margin-bottom: 12px;
  }

  .card-header {
    padding: 12px;
  }

  .card-content {
    padding: 12px;
  }

  .card-actions {
    padding: 12px;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-numbers {
    order: 1;
    width: 100%;
    justify-content: center;
    margin: 8px 0;
  }

  .pagination-btn {
    order: 2;
  }
}
</style>