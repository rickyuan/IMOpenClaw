<template>
  <div class="card service-menu-card">
    <div class="card-header medical">
      <div class="card-icon">&#9764;</div>
      <div>
        <div class="card-title">Our Services</div>
        <div class="card-subtitle">Doctor Anywhere</div>
      </div>
    </div>
    <div class="service-list">
      <div v-for="svc in services" :key="svc.name" class="service-item">
        <div class="svc-icon-wrap">
          <span v-if="svc.icon === 'video'">&#128249;</span>
          <span v-else-if="svc.icon === 'specialist'">&#129658;</span>
          <span v-else-if="svc.icon === 'screening'">&#128202;</span>
          <span v-else-if="svc.icon === 'wellness'">&#128156;</span>
          <span v-else>&#127968;</span>
        </div>
        <div class="svc-info">
          <div class="svc-name-row">
            <span class="svc-name">{{ svc.name }}</span>
            <span v-if="svc.tag" class="svc-tag">{{ svc.tag }}</span>
          </div>
          <span class="svc-desc">{{ svc.desc }}</span>
        </div>
        <span class="svc-price">{{ svc.price }}</span>
      </div>
    </div>
    <div class="service-footer">&#128666; Medication delivered within 3 hours</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  services: Array<{
    name: string;
    desc: string;
    price: string;
    icon: string;
    tag: string;
  }>;
}>();
</script>

<style scoped>
.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(46,134,222,0.08);
  animation: cardSlideIn 0.4s ease-out;
}

@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header.medical {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #2E86DE, #1B5E9E);
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
  font-size: 16px;
  flex-shrink: 0;
}

.card-title { font-size: 14px; font-weight: 700; }
.card-subtitle { font-size: 11px; opacity: 0.8; }

.service-list {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-surface);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.svc-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(46,134,222,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.svc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.svc-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.svc-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }

.svc-tag {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 3px;
  background: #27ae60;
  color: #fff;
}

.svc-desc { font-size: 10px; color: var(--text-muted); }

.svc-price {
  font-size: 11px;
  font-weight: 700;
  color: #2E86DE;
  white-space: nowrap;
  flex-shrink: 0;
}

.service-footer {
  padding: 8px 16px 10px;
  background: rgba(46,134,222,0.04);
  font-size: 10px;
  color: var(--text-muted);
}
</style>
