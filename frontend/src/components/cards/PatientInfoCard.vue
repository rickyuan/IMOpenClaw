<template>
  <div class="card patient-card">
    <div class="card-header medical-info">
      <div class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          <path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/>
        </svg>
      </div>
      <div>
        <div class="card-title">Patient Profile Saved</div>
        <div class="card-subtitle">{{ info.name }}</div>
      </div>
    </div>
    <div class="patient-body">
      <div class="info-section">
        <div class="section-title">Personal Information</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Full Name</span>
            <span class="info-value">{{ info.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date of Birth</span>
            <span class="info-value">{{ info.dob }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Gender</span>
            <span class="info-value">{{ info.gender }}</span>
          </div>
        </div>
      </div>
      <div class="info-section">
        <div class="section-title">Medical History</div>
        <div class="info-grid">
          <div class="info-item full-width">
            <span class="info-label">Allergies</span>
            <span class="info-value" :class="{ 'none': isNone(info.allergies) }">{{ info.allergies }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">Current Medications</span>
            <span class="info-value" :class="{ 'none': isNone(info.medications) }">{{ info.medications }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">Conditions / History</span>
            <span class="info-value" :class="{ 'none': isNone(info.conditions) }">{{ info.conditions }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  info: {
    name: string;
    dob: string;
    gender: string;
    allergies: string;
    medications: string;
    conditions: string;
  };
}>();

function isNone(val: string): boolean {
  return /^(none|n\/a|none reported)$/i.test(val.trim());
}
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

.card-header.medical-info {
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

.patient-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #2E86DE;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.info-value.none {
  color: var(--text-muted);
  font-weight: 400;
  font-style: italic;
}
</style>
