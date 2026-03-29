<template>
  <div class="card confirm-card">
    <div class="card-header success">
      <div class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <div>
        <div class="card-title">Order Confirmed!</div>
        <div class="card-subtitle">{{ confirmation.drink }}</div>
      </div>
    </div>
    <div class="confirm-body">
      <div class="confirm-grid">
        <div class="confirm-item">
          <span class="confirm-label">Order #</span>
          <span class="confirm-value">{{ confirmation.orderNo }}</span>
        </div>
        <div class="confirm-item">
          <span class="confirm-label">Status</span>
          <span class="confirm-value status-badge">
            <span class="status-dot" />
            Preparing
          </span>
        </div>
        <div class="confirm-item">
          <span class="confirm-label">Ready in</span>
          <span class="confirm-value highlight">~{{ confirmation.eta }} min</span>
        </div>
        <div class="confirm-item">
          <span class="confirm-label">Total Paid</span>
          <span class="confirm-value highlight">${{ confirmation.total.toFixed(2) }}</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" />
      </div>
      <div class="progress-steps">
        <span class="step active">Ordered</span>
        <span class="step active">Preparing</span>
        <span class="step">Ready</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  confirmation: {
    orderNo: string;
    drink: string;
    eta: number;
    total: number;
  };
}>();
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

.card-header.success {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #2da44e, #1a7f37);
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

.confirm-body {
  padding: 16px;
}

.confirm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

.confirm-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.confirm-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.confirm-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.confirm-value.highlight {
  color: var(--accent-dark);
  font-size: 16px;
  font-weight: 800;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2da44e;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.progress-bar {
  height: 4px;
  background: var(--bg-surface);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, #2da44e, #3fb950);
  border-radius: 2px;
  animation: progressGrow 1s ease-out;
}

@keyframes progressGrow {
  from { width: 0%; }
  to { width: 40%; }
}

.progress-steps {
  display: flex;
  justify-content: space-between;
}

.step {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
}

.step.active {
  color: #2da44e;
  font-weight: 600;
}
</style>
