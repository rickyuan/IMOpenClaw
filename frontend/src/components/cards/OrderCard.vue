<template>
  <div class="card order-card">
    <div class="card-header">
      <div class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <path d="M9 12h6"/><path d="M9 16h6"/>
        </svg>
      </div>
      <div>
        <div class="card-title">Order Summary</div>
        <div class="card-subtitle">Review your order</div>
      </div>
    </div>
    <div class="order-body">
      <div class="order-item-main">
        <span class="order-drink">{{ order.drink }}</span>
        <span class="order-price">${{ order.price.toFixed(2) }}</span>
      </div>
      <div class="order-details">
        <div v-for="detail in orderDetails" :key="detail.label" class="detail-row">
          <span class="detail-label">{{ detail.label }}</span>
          <span class="detail-value">{{ detail.value }}</span>
        </div>
      </div>
      <div v-if="order.promo" class="promo-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <span>{{ order.promo }}</span>
      </div>
      <div class="order-total">
        <span>Total</span>
        <span class="total-amount">${{ order.total.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  order: {
    drink: string;
    size: string;
    temp: string;
    milk: string;
    sugar: string;
    price: number;
    total: number;
    promo?: string;
  };
}>();

const orderDetails = computed(() => [
  { label: 'Size', value: props.order.size },
  { label: 'Temp', value: props.order.temp },
  { label: 'Milk', value: props.order.milk },
  { label: 'Sugar', value: props.order.sugar },
]);
</script>

<style scoped>
.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(139,90,43,0.08);
  animation: cardSlideIn 0.4s ease-out;
}

@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #C67C4E, #A0522D);
  color: #fff;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
}

.card-subtitle {
  font-size: 11px;
  opacity: 0.8;
}

.order-body {
  padding: 16px;
}

.order-item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.order-drink {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.order-price {
  font-size: 15px;
  font-weight: 600;
  color: var(--accent);
}

.order-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.promo-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(63,185,80,0.1);
  border: 1px solid rgba(63,185,80,0.2);
  border-radius: 8px;
  color: #2da44e;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 2px solid var(--border);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.total-amount {
  font-size: 20px;
  font-weight: 800;
  color: var(--accent-dark);
}
</style>
