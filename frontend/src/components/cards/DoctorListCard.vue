<template>
  <div class="card doctor-list-card">
    <div class="card-header medical">
      <div class="card-icon">&#129458;</div>
      <div>
        <div class="card-title">Available Doctors</div>
        <div class="card-subtitle">Teleconsult</div>
      </div>
    </div>
    <div class="doctor-list">
      <div v-for="(doc, i) in doctors" :key="i" class="doctor-item">
        <div class="doctor-avatar">{{ doc.avatar }}</div>
        <div class="doctor-info">
          <span class="doctor-name">{{ doc.name }}</span>
          <span class="doctor-specialty">{{ doc.specialty }}</span>
          <span class="doctor-hours">{{ doc.available }}</span>
        </div>
        <span class="doctor-fee">${{ Number(doc.fee).toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  doctors: Array<{
    name: string;
    specialty: string;
    available: string;
    fee: number;
    avatar: string;
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

.doctor-list {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.doctor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-surface);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.doctor-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2E86DE, #1B5E9E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.doctor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.doctor-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.doctor-specialty { font-size: 11px; font-weight: 500; color: #2E86DE; }
.doctor-hours { font-size: 10px; color: var(--text-muted); }

.doctor-fee {
  font-size: 12px;
  font-weight: 700;
  color: #2E86DE;
  flex-shrink: 0;
}
</style>
