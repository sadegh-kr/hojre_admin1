<!-- ItemCalculator.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-quantity', 'remove-item', 'clear-invoice', 'submit-order'])

// ========== تبدیل قیمت به عدد ==========
const toNumber = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // حذف کاما و کاراکترهای غیرعددی
    const cleaned = value.replace(/[^\d]/g, '')
    return parseInt(cleaned, 10) || 0
  }
  return 0
}

const invoiceItems = computed(() => {
  return props.items.map((item, index) => {
    // تبدیل قیمت به عدد
    const price = toNumber(item.price)
    const quantity = item.quantity || 1

    return {
      ...item,
      price, // قیمت به صورت عدد
      quantity,
      rowTotal: price * quantity,
      index: index + 1
    }
  })
})

const subtotal = computed(() => {
  return invoiceItems.value.reduce((sum, item) => sum + item.rowTotal, 0)
})

// ========== فرمت عدد فارسی ==========
const formattedPrice = (price) => {
  const num = toNumber(price)
  try {
    return new Intl.NumberFormat('fa-IR').format(num)
  } catch (e) {
    return num?.toString() || '۰'
  }
}

const increaseQuantity = (item) => {
  emit('update-quantity', item.id, (item.quantity || 1) + 1)
}

const decreaseQuantity = (item) => {
  const newQty = (item.quantity || 1) - 1
  if (newQty >= 1) {
    emit('update-quantity', item.id, newQty)
  }
}
</script>

<template>
  <div class="calculator">
    <!-- هدر فاکتور - ثابت در بالا -->
    <div class="invoice-header">
      <div class="header-right">
        <span class="invoice-icon">🧾</span>
        <h3>فاکتور فروش</h3>
      </div>
      <button @click="$emit('clear-invoice')" class="clear-all-btn" v-if="items.length">
        حذف همه
      </button>
    </div>

    <!-- لیست آیتم‌ها با اسکرول اختصاصی -->
    <div class="invoice-items-container">
      <div v-if="items.length === 0" class="empty-invoice">
        <span class="empty-icon">📋</span>
        <p>فاکتور خالی است</p>
        <small>محصولات را از سمت راست انتخاب کنید</small>
      </div>

      <div v-else class="invoice-items">
        <div v-for="item in invoiceItems" :key="item.id" class="invoice-row">
          <div class="item-info">
            <span class="item-index">{{ item.index }}</span>
            <span class="item-name" :title="item.name">{{ item.name }}</span>
          </div>

          <div class="item-details">
            <span class="item-price">{{ formattedPrice(item.price) }} تومان</span>

            <div class="quantity-control">
              <button @click="decreaseQuantity(item)" class="qty-btn">−</button>
              <span class="quantity">{{ item.quantity || 1 }}</span>
              <button @click="increaseQuantity(item)" class="qty-btn">+</button>
            </div>

            <span class="row-total">{{ formattedPrice(item.rowTotal) }} تومان</span>

            <button @click="$emit('remove-item', item.id)" class="remove-btn" title="حذف">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- خلاصه فاکتور - ثابت در پایین -->
    <div class="invoice-summary">
      <div class="summary-row">
        <span>جمع کل:</span>
        <span>{{ formattedPrice(subtotal) }} تومان</span>
      </div>

      <div class="summary-row total">
        <span>مبلغ سفارش:</span>
        <span class="total-amount">{{ formattedPrice(subtotal) }} تومان</span>
      </div>
    </div>

    <!-- دکمه ثبت - ثابت در پایین -->
    <div class="invoice-actions">
      <button
          class="btn-register"
          @click="$emit('submit-order')"
          :disabled="submitting || items.length === 0"
      >
        <span v-if="submitting" class="spinner"></span>
        <span v-else>✓</span>
        {{ submitting ? 'در حال ثبت…' : 'ثبت سفارش' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.calculator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface);
  min-width: 380px;
  max-width: 380px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  border: 1px solid var(--border);
}

/* ===== هدر فاکتور ===== */
.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--surface);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.invoice-icon {
  font-size: 22px;
  color: var(--color-success);
}

.invoice-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text);
  font-weight: 700;
}

.clear-all-btn {
  font-size: 12px;
  color: var(--color-danger);
  background: none;
  border: 1px solid var(--color-danger-subtle);
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  font-weight: 500;
}

.clear-all-btn:hover {
  background: var(--color-danger-subtle);
  border-color: var(--color-danger);
}

/* ===== کانتینر آیتم‌ها با اسکرول ===== */
.invoice-items-container {
  flex: 1;
  min-height: 0;
  background: var(--surface-subtle);
  overflow-y: auto;
}

.invoice-items {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ===== حالت خالی ===== */
.empty-invoice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--muted);
  text-align: center;
  padding: 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-invoice p {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text);
}

.empty-invoice small {
  font-size: 12px;
  color: var(--muted);
}

/* ===== ردیف آیتم ===== */
.invoice-row {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.invoice-row:hover {
  border-color: var(--border-strong);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.item-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-subtle);
  color: var(--text);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.item-price {
  font-size: 12px;
  color: var(--muted);
  min-width: 70px;
  font-weight: 500;
}

/* ===== کنترل تعداد ===== */
.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-subtle);
  padding: 2px;
  border-radius: 8px;
  flex-shrink: 0;
}

.qty-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--surface-elevated);
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: var(--text);
  transition: all 0.2s;
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.qty-btn:hover {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--on-success);
}

.qty-btn:active {
  transform: scale(0.95);
}

.quantity {
  min-width: 30px;
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--text);
}

/* ===== قیمت‌ها ===== */
.row-total {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  min-width: 90px;
  text-align: left;
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  opacity: 0.4;
  transition: all 0.2s;
  flex-shrink: 0;
  border-radius: 6px;
}

.remove-btn:hover {
  opacity: 1;
  background: var(--color-danger-subtle);
}

/* ===== خلاصه فاکتور ===== */
.invoice-summary {
  padding: 20px 24px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 15px;
  color: var(--muted);
}

.summary-row.tax {
  border-bottom: 1px dashed var(--border);
  padding-bottom: 14px;
}

.summary-row.total {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
  padding-top: 14px;
}

.total-amount {
  color: var(--color-success);
  font-size: 22px;
}

/* ===== دکمه ثبت ===== */
.invoice-actions {
  padding: 20px 24px;
  flex-shrink: 0;
  background: var(--surface);
}

.btn-register {
  width: 100%;
  padding: 16px;
  background: var(--color-success);
  color: var(--on-success);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.btn-register:hover {
  background: var(--color-success-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
}

.btn-register:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 20px;
  font-weight: 600;
}

/* ===== اسکرول بار اختصاصی ===== */
.invoice-items-container::-webkit-scrollbar {
  width: 4px;
}

.invoice-items-container::-webkit-scrollbar-track {
  background: var(--surface-subtle);
}

.invoice-items-container::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 4px;
}

.invoice-items-container::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

/* ===== حالت موبایل ===== */
@media (max-width: 768px) {
  .calculator {
    min-width: 100%;
    max-width: 100%;
    border-radius: 20px 20px 0 0;
  }

  .item-details {
    flex-wrap: wrap;
    gap: 12px;
  }

  .item-price {
    min-width: 60px;
  }

  .row-total {
    min-width: 70px;
  }

  .quantity-control {
    margin: 0 auto;
  }

  .invoice-header {
    padding: 16px 20px;
  }

  .invoice-summary,
  .invoice-actions {
    padding: 16px 20px;
  }

  .summary-row.total {
    font-size: 18px;
  }

  .total-amount {
    font-size: 20px;
  }
}

/* ===== حالت صفحه‌های خیلی کوچک ===== */
@media (max-width: 480px) {
  .item-details {
    flex-direction: column;
    align-items: stretch;
  }

  .item-price {
    text-align: center;
    min-width: auto;
  }

  .quantity-control {
    justify-content: center;
  }

  .row-total {
    text-align: center;
  }

  .remove-btn {
    position: absolute;
    top: 8px;
    left: 8px;
  }

  .invoice-row {
    position: relative;
    padding-top: 20px;
  }
}
</style>
