<!-- ItemCalculator.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update-quantity', 'remove-item', 'clear-invoice'])

const taxRate = 9
const discount = 0

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

const taxAmount = computed(() => {
  return (subtotal.value * taxRate) / 100
})

const total = computed(() => {
  return subtotal.value + taxAmount
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

// برای دیباگ - ببینیم آیتم‌ها چجوری میان
console.log('Items in calculator:', props.items)
</script>

<template>
  <div class="calculator">
    <!-- هدر فاکتور -->
    <div class="invoice-header">
      <div class="header-right">
        <span class="invoice-icon">🧾</span>
        <h3>فاکتور فروش</h3>
      </div>
      <button @click="$emit('clear-invoice')" class="clear-all-btn" v-if="items.length">
        حذف همه
      </button>
    </div>

    <!-- لیست آیتم‌ها -->
    <div class="invoice-items">
      <div v-if="items.length === 0" class="empty-invoice">
        <span class="empty-icon">📋</span>
        <p>فاکتور خالی است</p>
        <small>محصولات را از سمت چپ انتخاب کنید</small>
      </div>

      <div v-else class="items-container">
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

    <!-- خلاصه فاکتور -->
    <div class="invoice-summary">
      <div class="summary-row">
        <span>جمع کل:</span>
        <span>{{ formattedPrice(subtotal) }} تومان</span>
      </div>

      <div class="summary-row tax">
        <span>مالیات (۹%):</span>
        <span>{{ formattedPrice(taxAmount) }} تومان</span>
      </div>

      <div class="summary-row total">
        <span>قابل پرداخت:</span>
        <span class="total-amount">{{ formattedPrice(total) }} تومان</span>
      </div>
    </div>

    <!-- دکمه ثبت -->
    <div class="invoice-actions">
      <button class="btn-register">
        ✅ ثبت و پرداخت
      </button>
    </div>
  </div>
</template>

<style scoped>
.calculator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eef2f6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invoice-icon {
  font-size: 20px;
}

.invoice-header h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
  font-weight: 700;
}

.clear-all-btn {
  font-size: 12px;
  color: #ef4444;
  background: none;
  border: 1px solid #fee2e2;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: #fee2e2;
}

.invoice-items {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8fafc;
}

.empty-invoice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #94a3b8;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-invoice p {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #475569;
}

.empty-invoice small {
  font-size: 11px;
}

.items-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invoice-row {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-index {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-price {
  font-size: 12px;
  color: #64748b;
  min-width: 80px;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  padding: 2px;
  border-radius: 6px;
}

.qty-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  color: #475569;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.qty-btn:hover {
  background: #4CAF50;
  border-color: #4CAF50;
  color: white;
}

.quantity {
  min-width: 24px;
  text-align: center;
  font-weight: 700;
  font-size: 13px;
  color: #0f172a;
}

.row-total {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  min-width: 90px;
  text-align: left;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 1;
}

.invoice-summary {
  padding: 20px;
  background: #f8fafc;
  border-top: 1px solid #eef2f6;
  border-bottom: 1px solid #eef2f6;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #475569;
}

.summary-row.tax {
  border-bottom: 1px dashed #e2e8f0;
  padding-bottom: 12px;
}

.summary-row.total {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  padding-top: 12px;
}

.total-amount {
  color: #4CAF50;
  font-size: 20px;
}

.invoice-actions {
  padding: 20px;
}

.btn-register {
  width: 100%;
  padding: 14px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-register:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

@media (max-width: 768px) {
  .item-details {
    flex-wrap: wrap;
  }

  .item-price {
    min-width: 70px;
  }

  .row-total {
    min-width: 80px;
  }
}
</style>