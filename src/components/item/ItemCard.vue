<!-- ItemCard.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const defaultImage = 'https://via.placeholder.com/50x50?text=No+Image'

const mainImage = computed(() => {
  return props.item.images?.length > 0
      ? props.item.images[0].thumbnail || props.item.images[0].image
      : defaultImage
})

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('fa-IR').format(props.item.price)
})

defineEmits(['add'])
</script>

<template>
  <div class="item-card" @click="$emit('add', item)">
    <div class="item-image">
      <img :src="mainImage" :alt="item.name" loading="lazy">
    </div>
    <div class="item-info">
      <div class="item-name">{{ item.name }}</div>
      <div class="item-price">{{ formattedPrice }} تومان</div>
      <div class="item-availability">{{ item.availability_message || 'موجودی قابل محاسبه نیست' }}</div>
    </div>
    <div class="add-overlay">
      <span class="add-icon">+</span>
    </div>
  </div>
</template>

<style scoped>
.item-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-height: 72px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.item-card:hover {
  border-color: var(--color-success);
  background: var(--color-success-subtle);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.12);
}

.item-image {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  background: var(--surface-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-price {
  font-size: 11px;
  color: var(--color-success);
  font-weight: 700;
}

.item-availability {
  margin-top: 2px;
  color: var(--muted);
  font-size: 9px;
  line-height: 1.2;
}

.add-overlay {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-success);
  color: var(--on-success);
  border-radius: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.item-card:hover .add-overlay {
  opacity: 1;
}

.add-icon {
  font-size: 18px;
  font-weight: 600;
}
</style>
