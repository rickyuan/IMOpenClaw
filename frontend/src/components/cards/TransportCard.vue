<template>
  <div class="transport-card">
    <div class="card-header">
      <div class="header-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
      <div>
        <div class="header-title">Transport Options</div>
        <div class="header-sub">To {{ data.destination }}</div>
      </div>
    </div>

    <div class="options-list">
      <div v-for="opt in data.options" :key="opt.mode" class="transport-option">
        <div :class="['option-icon', opt.icon]">
          <!-- MRT icon -->
          <svg v-if="opt.icon === 'mrt'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.51 0 5.96.46 6.67 1H5.33C6.04 4.46 8.49 4 12 4zm5.5 13h-11C5.67 17 5 16.33 5 15.5V13h14v2.5c0 .83-.67 1.5-1.5 1.5zM5 11V8h14v3H5zm2.5 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm9 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
          </svg>
          <!-- Train/Express icon -->
          <svg v-else-if="opt.icon === 'train'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.51 0 5.96.46 6.67 1H5.33C6.04 4.46 8.49 4 12 4zm5.5 13h-11C5.67 17 5 16.33 5 15.5V7h14v8.5c0 .83-.67 1.5-1.5 1.5z"/>
          </svg>
          <!-- Bus icon -->
          <svg v-else-if="opt.icon === 'bus'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
          <!-- Taxi/Grab icon -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        <div class="option-info">
          <div class="option-label">{{ opt.label }}</div>
          <div class="option-detail">{{ opt.detail }}</div>
          <div v-if="opt.tip" class="option-tip">{{ opt.tip }}</div>
        </div>
        <div class="option-meta">
          <div class="option-duration">{{ opt.duration }}</div>
          <div class="option-price">{{ opt.price }}</div>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      MRT station at T2/T3 · EZ-Link or contactless payment accepted
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    destination: string;
    options: Array<{
      mode: string;
      icon: string;
      label: string;
      detail: string;
      duration: string;
      price: string;
      tip?: string;
    }>;
  };
}>();
</script>

<style scoped>
.transport-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(14,165,233,0.15);
  box-shadow: 0 2px 12px rgba(14,165,233,0.08);
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
  background: linear-gradient(135deg, #0369A1, #0EA5E9);
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

.options-list {
  padding: 8px 0;
}
.transport-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(14,165,233,0.07);
}
.transport-option:last-child { border-bottom: none; }

.option-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.option-icon.mrt   { background: #E8F5FF; color: #0369A1; }
.option-icon.train { background: #F3E8FF; color: #7C3AED; }
.option-icon.bus   { background: #ECFDF5; color: #065F46; }
.option-icon.taxi  { background: #FFFBEB; color: #D97706; }

.option-info { flex: 1; min-width: 0; }
.option-label {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}
.option-detail {
  font-size: 11px;
  color: #777;
  margin-top: 1px;
}
.option-tip {
  font-size: 10px;
  color: #0369A1;
  margin-top: 3px;
  background: #E8F5FF;
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
}

.option-meta {
  text-align: right;
  flex-shrink: 0;
}
.option-duration {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
.option-price {
  font-size: 11px;
  color: #555;
  margin-top: 2px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: #F0F9FF;
  font-size: 10px;
  color: #0369A1;
  border-top: 1px solid rgba(14,165,233,0.1);
}
</style>
