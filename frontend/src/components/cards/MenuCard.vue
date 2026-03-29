<template>
  <div class="card menu-card">
    <div class="card-header">
      <div class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      </div>
      <div>
        <div class="card-title">QuickCafe Menu</div>
        <div class="card-subtitle">Today's selections</div>
      </div>
    </div>
    <div class="menu-items">
      <div v-for="item in menuItems" :key="item.name" class="menu-item">
        <div class="item-emoji">{{ item.emoji }}</div>
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-desc">{{ item.desc }}</span>
        </div>
        <div class="item-prices">
          <span class="price-regular">R ${{ item.priceR.toFixed(2) }}</span>
          <span class="price-large">L ${{ item.priceL.toFixed(2) }}</span>
        </div>
      </div>
    </div>
    <div class="menu-footer">
      <div class="footer-row">
        <span class="footer-label">Milk options</span>
        <span>Regular / Oat (+$0.80) / Soy (+$0.80)</span>
      </div>
      <div class="footer-row">
        <span class="footer-label">Sugar</span>
        <span>Regular / Less / None</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const menuItems = [
  { name: 'Espresso', desc: 'Bold & classic', emoji: '\u2615', priceR: 4.50, priceL: 5.80 },
  { name: 'Americano', desc: 'Smooth & balanced', emoji: '\u2615', priceR: 5.00, priceL: 6.30 },
  { name: 'Latte', desc: 'Creamy favorite', emoji: '\uD83E\uDD5B', priceR: 6.50, priceL: 7.80 },
  { name: 'Cappuccino', desc: 'Frothy & rich', emoji: '\u2615', priceR: 6.50, priceL: 7.80 },
  { name: 'Mocha', desc: 'Chocolate bliss', emoji: '\uD83C\uDF6B', priceR: 7.00, priceL: 8.30 },
];
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
  letter-spacing: -0.2px;
}

.card-subtitle {
  font-size: 11px;
  opacity: 0.8;
}

.menu-items {
  padding: 8px 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 6px;
  border-bottom: 1px solid var(--border);
}

.menu-item:last-child {
  border-bottom: none;
}

.item-emoji {
  font-size: 20px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.item-prices {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.price-regular, .price-large {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.price-regular {
  color: var(--text-secondary);
  background: var(--bg-surface);
}

.price-large {
  color: var(--accent-dark);
  background: rgba(198,124,78,0.1);
}

.menu-footer {
  padding: 10px 16px 12px;
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-row {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  gap: 8px;
}

.footer-label {
  font-weight: 600;
  color: var(--text-muted);
  min-width: 80px;
}
</style>
