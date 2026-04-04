<template>
  <div class="jewel-card">
    <div class="jewel-header">
      <div class="jewel-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div>
        <div class="jewel-title">Jewel Changi</div>
        <div class="jewel-sub">{{ data.location }}</div>
      </div>
    </div>

    <div class="highlights-list">
      <div v-for="item in data.highlights" :key="item.name" class="highlight-item">
        <div :class="['highlight-icon', item.icon]">
          <!-- Rain Vortex -->
          <svg v-if="item.icon === 'vortex'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M22 12h-6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/>
          </svg>
          <!-- Park -->
          <svg v-else-if="item.icon === 'park'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <!-- Dining -->
          <svg v-else-if="item.icon === 'dining'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
          <!-- Shopping -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div class="highlight-info">
          <div class="highlight-name">{{ item.name }}</div>
          <div class="highlight-desc">{{ item.desc }}</div>
        </div>
        <span class="highlight-tag">{{ item.tag }}</span>
      </div>
    </div>

    <div class="jewel-footer">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      {{ data.hours }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    highlights: Array<{
      name: string;
      desc: string;
      icon: string;
      tag: string;
    }>;
    location: string;
    hours: string;
  };
}>();
</script>

<style scoped>
.jewel-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(107,33,168,0.12);
  box-shadow: 0 2px 12px rgba(107,33,168,0.08);
  animation: cardIn 0.35s ease-out;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.jewel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #4C1D95, #7C3AED, #0EA5E9);
}
.jewel-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.jewel-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}
.jewel-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.75);
  margin-top: 2px;
}

.highlights-list {
  padding: 8px 0;
}
.highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(107,33,168,0.07);
}
.highlight-item:last-child { border-bottom: none; }

.highlight-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.highlight-icon.vortex   { background: #E8F5FF; color: #0369A1; }
.highlight-icon.park     { background: #ECFDF5; color: #065F46; }
.highlight-icon.dining   { background: #FFF7ED; color: #C2410C; }
.highlight-icon.shopping { background: #F3E8FF; color: #7C3AED; }

.highlight-info { flex: 1; min-width: 0; }
.highlight-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}
.highlight-desc {
  font-size: 11px;
  color: #777;
  margin-top: 2px;
  line-height: 1.4;
}

.highlight-tag {
  font-size: 10px;
  font-weight: 500;
  color: #7C3AED;
  background: #F3E8FF;
  border: 1px solid rgba(124,58,237,0.15);
  padding: 3px 7px;
  border-radius: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

.jewel-footer {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: #F5F3FF;
  font-size: 10px;
  color: #6B21A8;
  border-top: 1px solid rgba(107,33,168,0.08);
}
</style>
