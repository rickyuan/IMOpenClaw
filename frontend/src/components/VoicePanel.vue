<template>
  <div class="voice-panel">
    <!-- Status ring -->
    <div class="status-section">
      <div :class="['ring-wrap', aiState, agentId]">
        <div class="ring ring-3" />
        <div class="ring ring-2" />
        <div class="ring ring-1" />
        <div class="orb">
          <svg v-if="!isActive" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          </svg>
          <svg v-else-if="aiState === 'thinking'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <svg v-else-if="aiState === 'speaking'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          </svg>
        </div>
      </div>
      <div class="status-label">{{ statusLabel }}</div>
    </div>

    <!-- Conversation (messages + inline cards) -->
    <div class="conversation-section">
      <div class="conversation-header">
        <span class="conversation-title">Conversation</span>
        <span v-if="entries.length > 0" class="conversation-count">{{ messageCount }} messages</span>
      </div>
      <div class="conversation-body" ref="conversationArea">
        <div v-if="entries.length === 0" class="conversation-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
            <template v-if="agentId === 'medical'">
              <rect x="14" y="8" width="4" height="16" rx="1" transform="translate(0,-4)"/>
              <rect x="8" y="10" width="16" height="4" rx="1" transform="translate(-4,0)"/>
            </template>
            <template v-else>
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            </template>
          </svg>
          <span>{{ agentId === 'medical' ? 'Start a voice chat to book a consultation with Ava' : 'Start a voice chat to order coffee with Bella' }}</span>
        </div>
        <template v-for="(entry, i) in entries" :key="i">
          <!-- Text message -->
          <div v-if="entry.type === 'message'" :class="['message', entry.role, entry.active && 'streaming']">
            <div class="message-avatar">{{ entry.role === 'user' ? 'U' : botInitial }}</div>
            <div class="message-bubble">{{ entry.text }}</div>
          </div>
          <!-- Barista cards -->
          <div v-else-if="entry.type === 'menu_card'" class="card-entry">
            <MenuCard />
          </div>
          <div v-else-if="entry.type === 'order_card'" class="card-entry">
            <OrderCard :order="orderData" />
          </div>
          <div v-else-if="entry.type === 'confirmation_card'" class="card-entry">
            <ConfirmationCard :confirmation="confirmationData" />
          </div>
          <!-- Medical cards -->
          <div v-else-if="entry.type === 'service_menu_card'" class="card-entry">
            <ServiceMenuCard :services="serviceMenuData.services" />
          </div>
          <div v-else-if="entry.type === 'doctor_list_card'" class="card-entry">
            <DoctorListCard :doctors="doctorListData.doctors" />
          </div>
          <div v-else-if="entry.type === 'appointment_card'" class="card-entry">
            <AppointmentCard :appointment="appointmentData" />
          </div>
        </template>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <div v-if="errorMsg" class="error-banner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ errorMsg }}
      </div>
      <button v-if="!isActive" @click="start" :disabled="isLoading" class="btn-start">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        {{ isLoading ? 'Connecting...' : startButtonLabel }}
      </button>
      <button v-else @click="stop" class="btn-stop">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
        End Conversation
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { startVoiceMode, stopVoiceMode } from '../services/trtc';
import { fetchAgents } from '../services/api';
import MenuCard from './cards/MenuCard.vue';
import OrderCard from './cards/OrderCard.vue';
import ConfirmationCard from './cards/ConfirmationCard.vue';
import ServiceMenuCard from './cards/ServiceMenuCard.vue';
import DoctorListCard from './cards/DoctorListCard.vue';
import AppointmentCard from './cards/AppointmentCard.vue';

type Entry =
  | { type: 'message'; text: string; role: string; active: boolean }
  | { type: 'menu_card' }
  | { type: 'order_card' }
  | { type: 'confirmation_card' }
  | { type: 'service_menu_card' }
  | { type: 'doctor_list_card' }
  | { type: 'appointment_card' };

const props = defineProps<{ userId: string }>();

const isActive = ref(false);
const isLoading = ref(false);
const aiState = ref('idle');
const errorMsg = ref('');
const entries = ref<Entry[]>([]);
const conversationArea = ref<HTMLElement | null>(null);
const agentId = ref<'barista' | 'medical'>('barista');

// Track which cards have been shown
const shownCards = reactive({ menu: false, order: false, confirmation: false, serviceMenu: false, doctorList: false, appointment: false });

const conversationText = ref<string[]>([]);

const messageCount = computed(() => entries.value.filter(e => e.type === 'message').length);

const botInitial = computed(() => agentId.value === 'medical' ? 'A' : 'B');

const startButtonLabel = computed(() =>
  agentId.value === 'medical' ? 'Start Voice Consultation' : 'Start Voice Order'
);

const statusLabel = computed(() => {
  if (!isActive.value) return agentId.value === 'medical' ? 'Ready to consult' : 'Ready to order';
  const botName = agentId.value === 'medical' ? 'Ava' : 'Bella';
  const labels: Record<string, string> = {
    idle: 'Connected',
    listening: 'Listening...',
    thinking: `${botName} is thinking...`,
    speaking: `${botName} is speaking...`,
    interrupted: 'Interrupted',
  };
  return labels[aiState.value] || 'Connected';
});

// ─── Barista data ───
const orderData = reactive({
  drink: 'Iced Latte', size: 'Large', temp: 'Iced', milk: 'Oat milk',
  sugar: 'Less sugar', price: 7.80, total: 7.80, promo: 'DEVDAY Promo — Free upsize!',
});
const confirmationData = reactive({ orderNo: '', drink: 'Large Iced Latte', eta: 10, total: 7.80 });

// ─── Medical data ───
const serviceMenuData = reactive({
  services: [
    { name: 'GP Teleconsult', desc: 'Video call with a GP', price: '$27.25', icon: 'video', tag: '24/7' },
    { name: 'Specialist', desc: 'Cardiology, Dermatology & more', price: 'From $76.30', icon: 'specialist', tag: '' },
    { name: 'Health Screening', desc: 'Comprehensive health packages', price: 'From $86', icon: 'screening', tag: '' },
    { name: 'Mental Wellness', desc: '60-min therapy session', price: '$119.90', icon: 'wellness', tag: '' },
    { name: 'Doctor House Call', desc: 'Doctor visits your home', price: 'From $220', icon: 'house', tag: '' },
  ],
});
const doctorListData = reactive({
  doctors: [
    { name: 'Dr. Sarah Chen', specialty: 'General Practice', available: '24/7', fee: 27.25, avatar: 'SC' },
    { name: 'Dr. James Liu', specialty: 'Cardiology', available: 'Tue/Thu, 10am-4pm', fee: 76.30, avatar: 'JL' },
    { name: 'Dr. Emily Wang', specialty: 'Dermatology', available: 'Mon-Fri, 9am-1pm', fee: 76.30, avatar: 'EW' },
    { name: 'Dr. Michael Zhang', specialty: 'Orthopaedics', available: 'Wed/Fri, 2pm-6pm', fee: 76.30, avatar: 'MZ' },
    { name: 'Dr. Lisa Park', specialty: 'Paediatrics', available: 'Mon-Fri, 9am-5pm', fee: 76.30, avatar: 'LP' },
    { name: 'Dr. Rachel Tan', specialty: 'O&G', available: 'Mon/Wed/Fri, 10am-3pm', fee: 76.30, avatar: 'RT' },
  ],
});
const appointmentData = reactive({
  doctor: 'Dr. Sarah Chen', specialty: 'General Practice', date: 'TBD', time: 'TBD',
  patientName: 'Patient', consultType: 'Video Teleconsult', fee: 27.25,
  confirmationNo: 'DA-000000',
});

function generateOrderNo(): string {
  return 'QC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
function generateBookingRef(): string {
  return 'DA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── Card detection (barista) ───
function detectBaristaCard(text: string): 'menu' | 'order' | 'confirmation' | null {
  const lower = text.toLowerCase();
  if (!shownCards.menu && lower.includes('menu') && (lower.includes('sent') || lower.includes('chat') || lower.includes('check'))) return 'menu';
  if (!shownCards.order && (lower.includes('total') || lower.includes('applied')) && (lower.includes('$') || lower.includes('promo') || lower.includes('sent'))) return 'order';
  if (!shownCards.confirmation && (lower.includes('all set') || lower.includes('confirmed') || lower.includes('will be ready'))) return 'confirmation';
  return null;
}

// ─── Card detection (medical) ───
function detectMedicalCard(text: string): 'service_menu' | 'doctor_list' | 'appointment' | null {
  const lower = text.toLowerCase();
  if (!shownCards.appointment && (lower.includes('appointment is confirmed') || lower.includes('booking is confirmed') || lower.includes('you\'re all set') || lower.includes('see you on'))) return 'appointment';
  if (!shownCards.doctorList && (lower.includes('available doctors') || lower.includes('here are our') || lower.includes('recommend dr.') || lower.includes('i\'d recommend dr.'))) return 'doctor_list';
  if (!shownCards.serviceMenu && (lower.includes('how can i help') || lower.includes('what do you need') || lower.includes('what would you like'))) return 'service_menu';
  return null;
}

function extractBaristaOrder(allText: string) {
  const lower = allText.toLowerCase();
  const drinks = ['espresso', 'americano', 'latte', 'cappuccino', 'mocha'];
  for (const d of drinks) { if (lower.includes(d)) orderData.drink = d.charAt(0).toUpperCase() + d.slice(1); }
  if (lower.includes('large')) orderData.size = 'Large'; else if (lower.includes('regular')) orderData.size = 'Regular';
  if (lower.includes('iced') || lower.includes('ice')) orderData.temp = 'Iced'; else if (lower.includes('hot')) orderData.temp = 'Hot';
  if (lower.includes('oat')) orderData.milk = 'Oat milk'; else if (lower.includes('soy')) orderData.milk = 'Soy milk'; else orderData.milk = 'Regular milk';
  if (lower.includes('no sugar')) orderData.sugar = 'No sugar'; else if (lower.includes('less sugar')) orderData.sugar = 'Less sugar';
  const priceMatch = allText.match(/\$(\d+\.?\d*)/);
  if (priceMatch) { orderData.price = parseFloat(priceMatch[1]); orderData.total = orderData.price; }
  confirmationData.drink = `${orderData.size} ${orderData.temp} ${orderData.drink}`;
  confirmationData.total = orderData.total;
}

function extractMedicalAppt(allText: string) {
  const lower = allText.toLowerCase();
  const doctors = doctorListData.doctors;
  for (const doc of doctors) {
    if (lower.includes(doc.name.toLowerCase())) {
      appointmentData.doctor = doc.name;
      appointmentData.specialty = doc.specialty;
      appointmentData.fee = doc.fee;
      break;
    }
  }
  const timeMatch = allText.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (timeMatch) appointmentData.time = timeMatch[1];
  const datePatterns = [/(?:monday|tuesday|wednesday|thursday|friday)/i, /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i, /tomorrow/i];
  for (const pat of datePatterns) { const m = lower.match(pat); if (m) { appointmentData.date = m[0].charAt(0).toUpperCase() + m[0].slice(1); break; } }
  const nameMatch = lower.match(/(?:my name is|i'm|i am)\s+([a-z]+ ?[a-z]*)/i);
  if (nameMatch) appointmentData.patientName = nameMatch[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function scrollToBottom() {
  nextTick(() => {
    if (conversationArea.value) conversationArea.value.scrollTop = conversationArea.value.scrollHeight;
  });
}

function onSubtitle(e: Event) {
  const { text, role, end } = (e as CustomEvent).detail;

  const lastEntry = entries.value[entries.value.length - 1];
  if (lastEntry && lastEntry.type === 'message' && lastEntry.active && lastEntry.role === role) {
    lastEntry.text = text;
    lastEntry.active = !end;
  } else {
    if (entries.value.length > 80) entries.value.shift();
    entries.value.push({ type: 'message', text, role, active: !end });
  }

  if (end) {
    conversationText.value.push(`${role}: ${text}`);
    if (role === 'assistant') {
      const allText = conversationText.value.join('\n');

      if (agentId.value === 'medical') {
        extractMedicalAppt(allText);
        const cardType = detectMedicalCard(text);
        if (cardType === 'service_menu') { shownCards.serviceMenu = true; entries.value.push({ type: 'service_menu_card' }); }
        else if (cardType === 'doctor_list') { shownCards.doctorList = true; entries.value.push({ type: 'doctor_list_card' }); }
        else if (cardType === 'appointment') { shownCards.appointment = true; appointmentData.confirmationNo = generateBookingRef(); entries.value.push({ type: 'appointment_card' }); }
      } else {
        extractBaristaOrder(allText);
        const cardType = detectBaristaCard(text);
        if (cardType === 'menu') { shownCards.menu = true; entries.value.push({ type: 'menu_card' }); }
        else if (cardType === 'order') { shownCards.order = true; confirmationData.orderNo = generateOrderNo(); entries.value.push({ type: 'order_card' }); }
        else if (cardType === 'confirmation') { shownCards.confirmation = true; if (!confirmationData.orderNo) confirmationData.orderNo = generateOrderNo(); entries.value.push({ type: 'confirmation_card' }); }
      }
    }
  }
  scrollToBottom();
}

function onState(e: Event) {
  aiState.value = (e as CustomEvent).detail.state;
}

async function loadAgent() {
  try {
    const result = await fetchAgents(props.userId);
    agentId.value = result.activeAgent as 'barista' | 'medical';
  } catch (e) {
    console.error('Failed to load agent:', e);
  }
}

onMounted(() => {
  window.addEventListener('voice-subtitle', onSubtitle);
  window.addEventListener('voice-state', onState);
  window.addEventListener('agent-changed', ((e: CustomEvent) => { agentId.value = e.detail as 'barista' | 'medical'; }) as EventListener);
  loadAgent();
});

onUnmounted(() => {
  window.removeEventListener('voice-subtitle', onSubtitle);
  window.removeEventListener('voice-state', onState);
  if (isActive.value) stopVoiceMode();
});

const welcomeMessages: Record<string, { text: string; card: string }> = {
  barista: {
    text: "Hey! Welcome to QuickCafe! I'm Bella, your AI barista. I've sent our menu to your chat \u2014 what catches your eye?",
    card: 'menu_card',
  },
  medical: {
    text: "Hi! Welcome to Doctor Anywhere. I'm Ava, your healthcare assistant. How can I help you today?",
    card: 'service_menu_card',
  },
};

async function start() {
  errorMsg.value = '';
  isLoading.value = true;
  entries.value = [];
  Object.keys(shownCards).forEach(k => (shownCards as any)[k] = false);
  conversationText.value = [];
  try {
    const roomId = `voice_${props.userId}_${Date.now()}`;
    const result = await startVoiceMode(roomId, props.userId);
    // Backend returns agent context
    if (result.agentId) agentId.value = result.agentId;
    isActive.value = true;
    aiState.value = 'idle';

    const welcome = welcomeMessages[agentId.value];
    setTimeout(() => {
      if (!entries.value.some(e => e.type === 'message' && e.role === 'assistant')) {
        entries.value.push({ type: 'message', text: welcome.text, role: 'assistant', active: false });
      }
      const cardKey = agentId.value === 'medical' ? 'serviceMenu' : 'menu';
      if (!(shownCards as any)[cardKey]) {
        (shownCards as any)[cardKey] = true;
        entries.value.push({ type: welcome.card } as Entry);
        scrollToBottom();
      }
    }, 2000);
  } catch (e: any) {
    errorMsg.value = e.message || 'Failed to start voice chat';
  } finally {
    isLoading.value = false;
  }
}

async function stop() {
  await stopVoiceMode();
  isActive.value = false;
  aiState.value = 'idle';
}
</script>

<style scoped>
.voice-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 24px 20px;
  gap: 20px;
  overflow: hidden;
  background: var(--bg-base);
}

/* Status ring */
.status-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.ring-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--accent);
  opacity: 0;
  transition: opacity 0.3s;
}
.ring-1 { width: 100px; height: 100px; }
.ring-2 { width: 80px;  height: 80px; }
.ring-3 { width: 62px;  height: 62px; }

/* Medical agent uses blue rings */
.ring-wrap.medical .ring {
  border-color: #2E86DE;
}

.ring-wrap.listening .ring,
.ring-wrap.speaking .ring {
  opacity: 0.15;
  animation: ripple 2s ease-out infinite;
}
.ring-wrap.listening .ring-2,
.ring-wrap.speaking .ring-2 { animation-delay: 0.4s; }
.ring-wrap.listening .ring-3,
.ring-wrap.speaking .ring-3 { animation-delay: 0.8s; }

@keyframes ripple {
  0%   { transform: scale(0.85); opacity: 0.2; }
  50%  { opacity: 0.12; }
  100% { transform: scale(1.05); opacity: 0; }
}

.orb {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.3s;
  position: relative;
  z-index: 1;
}

.ring-wrap.listening .orb {
  background: rgba(198,124,78,0.1);
  border-color: var(--accent);
  color: var(--accent);
  box-shadow: 0 0 24px var(--accent-glow);
}
.ring-wrap.medical.listening .orb {
  background: rgba(46,134,222,0.1);
  border-color: #2E86DE;
  color: #2E86DE;
  box-shadow: 0 0 24px rgba(46,134,222,0.25);
}
.ring-wrap.thinking .orb {
  background: rgba(210,153,34,0.1);
  border-color: var(--warning);
  color: var(--warning);
  box-shadow: 0 0 24px rgba(210,153,34,0.2);
  animation: pulse-think 1s ease-in-out infinite;
}
.ring-wrap.speaking .orb {
  background: rgba(63,185,80,0.1);
  border-color: var(--success);
  color: var(--success);
  box-shadow: 0 0 24px rgba(63,185,80,0.2);
}

@keyframes pulse-think {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.status-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.3px;
  height: 18px;
}

/* Conversation */
.conversation-section {
  flex: 1;
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 0;
}

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.conversation-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.conversation-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: 2px 8px;
  border-radius: 10px;
}

.conversation-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.conversation-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 13px;
}

/* Messages */
.message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.message.user .message-avatar {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  border-color: transparent;
  color: #fff;
}

.message.assistant .message-avatar {
  background: linear-gradient(135deg, #8B5A2B, #6B4226);
  border-color: transparent;
  color: #fff;
}

.message-bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.message.user .message-bubble {
  background: rgba(198,124,78,0.1);
  border-color: rgba(198,124,78,0.2);
  border-radius: 12px 2px 12px 12px;
}

.message.assistant .message-bubble {
  border-radius: 2px 12px 12px 12px;
}

.message.streaming .message-bubble::after {
  content: '\25CB';
  display: inline-block;
  animation: blink 0.8s step-end infinite;
  color: var(--accent);
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Card entries */
.card-entry {
  max-width: 340px;
  margin: 4px 0 4px 34px;
}

/* Controls */
.controls-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--error);
  background: rgba(248,81,73,0.08);
  border: 1px solid rgba(248,81,73,0.2);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
}

.btn-start, .btn-stop {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.2px;
}

.btn-start {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 4px 20px var(--accent-glow);
}

.btn-start:hover:not(:disabled) {
  background: var(--accent-dark);
  transform: translateY(-1px);
  box-shadow: 0 6px 24px var(--accent-glow);
}

.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-stop {
  background: rgba(248,81,73,0.1);
  color: var(--error);
  border: 1px solid rgba(248,81,73,0.3);
}

.btn-stop:hover {
  background: rgba(248,81,73,0.15);
  border-color: var(--error);
}
</style>
