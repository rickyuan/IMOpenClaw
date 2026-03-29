<template>
  <div class="card appointment-card">
    <div class="card-header success">
      <div class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <div>
        <div class="card-title">Appointment Confirmed!</div>
        <div class="card-subtitle">{{ appointment.doctor }}</div>
      </div>
    </div>
    <div class="appt-body">
      <div class="appt-grid">
        <div class="appt-item">
          <span class="appt-label">Booking Ref</span>
          <span class="appt-value">{{ appointment.confirmationNo }}</span>
        </div>
        <div class="appt-item">
          <span class="appt-label">Type</span>
          <span class="appt-value">{{ appointment.consultType }}</span>
        </div>
        <div class="appt-item">
          <span class="appt-label">Date</span>
          <span class="appt-value highlight">{{ appointment.date }}</span>
        </div>
        <div class="appt-item">
          <span class="appt-label">Time</span>
          <span class="appt-value highlight">{{ appointment.time }}</span>
        </div>
        <div class="appt-item">
          <span class="appt-label">Patient</span>
          <span class="appt-value">{{ appointment.patientName }}</span>
        </div>
        <div class="appt-item">
          <span class="appt-label">Fee</span>
          <span class="appt-value highlight">${{ Number(appointment.fee).toFixed(2) }}</span>
        </div>
      </div>
      <div class="appt-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Reminder will be sent 1 hour before</span>
      </div>
      <div class="appt-note delivery">
        <span>&#128666;</span>
        <span>Medication can be delivered within 3 hours</span>
      </div>
      <div class="calendar-actions">
        <!-- Google Calendar: auto-add if connected, or connect/manual -->
        <button v-if="calendarSynced" class="cal-btn synced" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          Added to Calendar
        </button>
        <button v-else-if="calendarAdding" class="cal-btn google" disabled>
          <span class="btn-spinner"></span>
          Adding...
        </button>
        <button v-else-if="googleConnected" class="cal-btn google" @click="autoAddToGoogle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Add to Google Calendar
        </button>
        <button v-else-if="googleConfigured" class="cal-btn google connect" @click="connectGoogle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Connect Google Calendar
        </button>
        <button v-else class="cal-btn google" @click="openGoogleCal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Google Calendar
        </button>
        <button class="cal-btn ics" @click="downloadICS">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          .ics
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { buildCalendarEvent, generateGoogleCalendarUrl, downloadICSFile } from '../../utils/calendar';
import { getGoogleCalendarStatus, getGoogleAuthUrl, addToGoogleCalendar } from '../../services/api';

const props = defineProps<{
  appointment: {
    doctor: string;
    specialty: string;
    date: string;
    time: string;
    patientName: string;
    consultType: string;
    fee: number;
    confirmationNo: string;
  };
  userId?: string;
}>();

const googleConfigured = ref(false);
const googleConnected = ref(false);
const calendarAdding = ref(false);
const calendarSynced = ref(false);

const uid = props.userId || 'demo_user_001';

onMounted(async () => {
  try {
    const status = await getGoogleCalendarStatus(uid);
    googleConfigured.value = status.configured;
    googleConnected.value = status.connected;
  } catch { /* Google Calendar not available, fall back to URL mode */ }

  window.addEventListener('message', onOAuthMessage);
});

onUnmounted(() => {
  window.removeEventListener('message', onOAuthMessage);
});

function onOAuthMessage(e: MessageEvent) {
  if (e.data?.type === 'google-calendar-connected') {
    googleConnected.value = true;
    // Auto-add after connecting
    autoAddToGoogle();
  }
}

async function connectGoogle() {
  try {
    const authUrl = await getGoogleAuthUrl(uid);
    window.open(authUrl, 'google-auth', 'width=500,height=600,popup=yes');
  } catch (err) {
    console.error('Failed to start Google auth:', err);
  }
}

async function autoAddToGoogle() {
  calendarAdding.value = true;
  try {
    await addToGoogleCalendar(uid, props.appointment);
    calendarSynced.value = true;
  } catch (err) {
    console.error('Failed to add to Google Calendar:', err);
    // Fall back to URL mode
    openGoogleCal();
  } finally {
    calendarAdding.value = false;
  }
}

function openGoogleCal() {
  const event = buildCalendarEvent(props.appointment);
  window.open(generateGoogleCalendarUrl(event), '_blank');
}

function downloadICS() {
  const event = buildCalendarEvent(props.appointment);
  downloadICSFile(event);
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

.card-header.success {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #27ae60, #1e8449);
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

.card-title { font-size: 14px; font-weight: 700; }
.card-subtitle { font-size: 11px; opacity: 0.8; }

.appt-body { padding: 16px; }

.appt-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

.appt-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.appt-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.appt-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.appt-value.highlight {
  color: #2E86DE;
  font-size: 16px;
  font-weight: 800;
}

.appt-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-surface);
  border-radius: 8px;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.appt-note.delivery {
  background: rgba(39,174,96,0.06);
  color: #1e8449;
}

.calendar-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.cal-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cal-btn.google {
  background: #E8F0FE;
  color: #1A73E8;
}

.cal-btn.google:hover {
  background: #D2E3FC;
}

.cal-btn.ics {
  background: #F0F0F0;
  color: #333;
}

.cal-btn.ics:hover {
  background: #E0E0E0;
}

.cal-btn.connect {
  background: #FFF3E0;
  color: #E65100;
}

.cal-btn.connect:hover {
  background: #FFE0B2;
}

.cal-btn.synced {
  background: #E8F5E9;
  color: #2E7D32;
  cursor: default;
}

.cal-btn:disabled {
  opacity: 0.8;
  cursor: default;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(26,115,232,0.3);
  border-top-color: #1A73E8;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
