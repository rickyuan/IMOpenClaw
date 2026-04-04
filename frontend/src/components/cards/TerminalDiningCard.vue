<template>
  <div class="dining-card">
    <div class="card-header">
      <div class="header-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      </div>
      <div>
        <div class="header-title">Dining Near You</div>
        <div class="header-sub">{{ data.terminal }} · Top picks</div>
      </div>
    </div>

    <div class="restaurants-list">
      <div v-for="r in data.restaurants" :key="r.name" class="restaurant-item">
        <div class="rest-avatar">{{ r.name.charAt(0) }}</div>
        <div class="rest-info">
          <div class="rest-name">{{ r.name }}</div>
          <div class="rest-cuisine">{{ r.cuisine }}</div>
          <div class="rest-location">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{ r.location }}
          </div>
        </div>
        <div class="rest-meta">
          <div class="rest-hours">{{ r.hours }}</div>
          <div class="rest-price">{{ r.priceRange }}</div>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Ask ARIA for directions to any restaurant
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    terminal: string;
    restaurants: Array<{
      name: string;
      cuisine: string;
      location: string;
      hours: string;
      priceRange: string;
    }>;
  };
}>();
</script>

<style scoped>
.dining-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(194,65,12,0.12);
  box-shadow: 0 2px 12px rgba(194,65,12,0.07);
  animation: cardIn 0.35s ease-out;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #9A3412, #EA580C);
}
.header-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.header-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
.header-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.75);
  margin-top: 1px;
}

.restaurants-list { padding: 4px 0; }

.restaurant-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(194,65,12,0.07);
}
.restaurant-item:last-child { border-bottom: none; }

.rest-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #FFF7ED, #FFEDD5);
  border: 1px solid rgba(194,65,12,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #EA580C;
  flex-shrink: 0;
}

.rest-info { flex: 1; min-width: 0; }
.rest-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}
.rest-cuisine {
  font-size: 11px;
  color: #888;
  margin-top: 1px;
}
.rest-location {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: #EA580C;
  margin-top: 3px;
}

.rest-meta {
  text-align: right;
  flex-shrink: 0;
}
.rest-hours {
  font-size: 10px;
  color: #666;
}
.rest-price {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  margin-top: 2px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: #FFF7ED;
  font-size: 10px;
  color: #9A3412;
  border-top: 1px solid rgba(194,65,12,0.1);
}
</style>
