<template>
  <div class="flight-card">
    <div class="flight-header">
      <div class="flight-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
        {{ flight.flightNo }}
      </div>
      <span :class="['status-badge', statusClass]">{{ flight.status }}</span>
    </div>

    <div class="airline-row">
      <span class="airline-name">{{ flight.airline }}</span>
    </div>

    <div class="route-row">
      <div class="route-point">
        <span class="route-code">{{ originCode }}</span>
        <span class="route-city">{{ originCity }}</span>
      </div>
      <div class="route-line">
        <div class="route-dashes"></div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="route-plane">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
        <div class="route-dashes"></div>
      </div>
      <div class="route-point">
        <span class="route-code">{{ destCode }}</span>
        <span class="route-city">{{ destCity }}</span>
      </div>
    </div>

    <div class="time-row">
      <div class="time-block">
        <span class="time-label">Departure</span>
        <span :class="['time-value', flight.status === 'Delayed' && 'delayed']">{{ displayDeparture }}</span>
        <span v-if="flight.status === 'Delayed' && flight.delayMinutes" class="delay-badge">+{{ flight.delayMinutes }}m</span>
      </div>
      <div class="time-block">
        <span class="time-label">Arrival</span>
        <span class="time-value">{{ flight.arrival }}</span>
      </div>
    </div>

    <div class="info-row">
      <div class="info-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>
        </svg>
        {{ flight.terminal }}
      </div>
      <div class="info-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
        </svg>
        Gate {{ flight.gate }}
      </div>
      <div class="info-chip checkin">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Check-in closes {{ flight.checkInCloses }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  flight: {
    flightNo: string;
    airline: string;
    airlineCode: string;
    origin: string;
    destination: string;
    terminal: string;
    gate: string;
    status: string;
    departure: string;
    arrival: string;
    checkInCloses: string;
    delayMinutes?: number;
  };
}>();

const statusClass = computed(() => {
  const s = props.flight.status.toLowerCase();
  if (s === 'on time') return 'ontime';
  if (s === 'boarding') return 'boarding';
  if (s === 'delayed') return 'delayed';
  if (s === 'departed') return 'departed';
  return 'ontime';
});

function parseParens(str: string): [string, string] {
  const m = str.match(/\((\w+)\)/);
  const code = m ? m[1] : str.substring(0, 3).toUpperCase();
  const city = str.replace(/\s*\(\w+\)/, '').trim();
  return [code, city];
}

const [originCode, originCity] = parseParens(props.flight.origin);
const [destCode, destCity] = parseParens(props.flight.destination);

const displayDeparture = computed(() => {
  if (props.flight.status === 'Delayed' && props.flight.delayMinutes) {
    const [h, m] = props.flight.departure.split(':').map(Number);
    const total = h * 60 + m + props.flight.delayMinutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  return props.flight.departure;
});
</script>

<style scoped>
.flight-card {
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

.flight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  background: linear-gradient(135deg, #6B21A8, #7C3AED);
}

.flight-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 10px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.status-badge.ontime  { background: rgba(255,255,255,0.25); color: #fff; }
.status-badge.boarding { background: #FFF3CD; color: #856404; }
.status-badge.delayed  { background: #F8D7DA; color: #721C24; }
.status-badge.departed { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); }

.airline-row {
  padding: 8px 14px 4px;
  background: linear-gradient(135deg, #6B21A8, #7C3AED);
}
.airline-name {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  font-weight: 500;
}

.route-row {
  display: flex;
  align-items: center;
  padding: 14px 14px 10px;
  gap: 8px;
}
.route-point {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.route-code {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.5px;
}
.route-city {
  font-size: 10px;
  color: #888;
  white-space: nowrap;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.route-line {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9B59B6;
}
.route-dashes {
  flex: 1;
  height: 1px;
  background: repeating-linear-gradient(90deg, #9B59B6 0, #9B59B6 4px, transparent 4px, transparent 8px);
}
.route-plane {
  flex-shrink: 0;
  color: #7C3AED;
}

.time-row {
  display: flex;
  padding: 0 14px 12px;
  gap: 16px;
  border-bottom: 1px solid rgba(107,33,168,0.08);
}
.time-block {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.time-label {
  font-size: 11px;
  color: #999;
}
.time-value {
  font-size: 15px;
  font-weight: 700;
  color: #2d2d2d;
}
.time-value.delayed {
  text-decoration: line-through;
  color: #aaa;
  font-size: 12px;
}
.delay-badge {
  font-size: 13px;
  font-weight: 700;
  color: #DC3545;
  margin-left: 2px;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 14px 12px;
}
.info-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #555;
  background: #F3F0FF;
  border: 1px solid rgba(107,33,168,0.12);
  padding: 4px 8px;
  border-radius: 6px;
}
.info-chip.checkin {
  background: #FFF3E0;
  border-color: rgba(255,152,0,0.2);
  color: #E65100;
}
</style>
