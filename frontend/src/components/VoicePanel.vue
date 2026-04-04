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
            <template v-else-if="agentId === 'airport'">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </template>
            <template v-else>
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            </template>
          </svg>
          <span>{{
            agentId === 'medical' ? 'Start a voice chat to book a consultation with Ava' :
            agentId === 'airport' ? 'Chat with ARIA — ask about flights, transport, Jewel & more' :
            'Start a voice chat to order coffee with Bella'
          }}</span>
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
          <!-- Airport cards -->
          <div v-else-if="entry.type === 'flight_status_card'" class="card-entry">
            <FlightStatusCard :flight="flightData" />
          </div>
          <div v-else-if="entry.type === 'transport_card'" class="card-entry">
            <TransportCard :data="transportData" />
          </div>
          <div v-else-if="entry.type === 'jewel_card'" class="card-entry">
            <JewelCard :data="jewelData" />
          </div>
          <div v-else-if="entry.type === 'dining_card'" class="card-entry">
            <TerminalDiningCard :data="diningData" />
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
import FlightStatusCard from './cards/FlightStatusCard.vue';
import TransportCard from './cards/TransportCard.vue';
import JewelCard from './cards/JewelCard.vue';
import TerminalDiningCard from './cards/TerminalDiningCard.vue';

type Entry =
  | { type: 'message'; text: string; role: string; active: boolean }
  | { type: 'menu_card' }
  | { type: 'order_card' }
  | { type: 'confirmation_card' }
  | { type: 'service_menu_card' }
  | { type: 'doctor_list_card' }
  | { type: 'appointment_card' }
  | { type: 'flight_status_card' }
  | { type: 'transport_card' }
  | { type: 'jewel_card' }
  | { type: 'dining_card' };

const props = defineProps<{ userId: string }>();

const isActive = ref(false);
const isLoading = ref(false);
const aiState = ref('idle');
const errorMsg = ref('');
const entries = ref<Entry[]>([]);
const conversationArea = ref<HTMLElement | null>(null);
const agentId = ref<'barista' | 'medical' | 'airport'>('barista');

// Track which cards have been shown
const shownCards = reactive({
  menu: false, order: false, confirmation: false,
  serviceMenu: false, doctorList: false, appointment: false,
  flight: false, transport: false, jewel: false, dining: false,
});

const conversationText = ref<string[]>([]);

const messageCount = computed(() => entries.value.filter(e => e.type === 'message').length);

const botInitial = computed(() => {
  if (agentId.value === 'medical') return 'A';
  if (agentId.value === 'airport') return '✈';
  return 'B';
});

const startButtonLabel = computed(() => {
  if (agentId.value === 'medical') return 'Start Voice Consultation';
  if (agentId.value === 'airport') return 'Chat with ARIA';
  return 'Start Voice Order';
});

const statusLabel = computed(() => {
  if (!isActive.value) {
    if (agentId.value === 'medical') return 'Ready to consult';
    if (agentId.value === 'airport') return 'ARIA ready to assist';
    return 'Ready to order';
  }
  const botName = agentId.value === 'medical' ? 'Ava' : agentId.value === 'airport' ? 'ARIA' : 'Bella';
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

// ─── Airport (ARIA) data ───
const DEMO_FLIGHTS = [
  { flightNo: 'SQ 321', airline: 'Singapore Airlines', airlineCode: 'SQ', origin: 'Singapore (SIN)', destination: 'London (LHR)', terminal: 'T3', gate: 'C23', status: 'On Time', departure: '14:30', arrival: '21:25+1', checkInCloses: '12:30' },
  { flightNo: 'CX 759', airline: 'Cathay Pacific', airlineCode: 'CX', origin: 'Singapore (SIN)', destination: 'Hong Kong (HKG)', terminal: 'T4', gate: 'A12', status: 'Boarding', departure: '13:45', arrival: '17:40', checkInCloses: '12:45' },
  { flightNo: 'TR 608', airline: 'Scoot', airlineCode: 'TR', origin: 'Singapore (SIN)', destination: 'Bangkok (BKK)', terminal: 'T2', gate: 'D15', status: 'Delayed', departure: '16:20', arrival: '17:50', checkInCloses: '14:20', delayMinutes: 45 },
  { flightNo: 'QR 647', airline: 'Qatar Airways', airlineCode: 'QR', origin: 'Singapore (SIN)', destination: 'Doha (DOH)', terminal: 'T1', gate: 'B08', status: 'On Time', departure: '18:00', arrival: '22:30', checkInCloses: '16:00' },
];
const flightData = reactive({ ...DEMO_FLIGHTS[0] });

const transportData = reactive({
  destination: 'City Centre',
  options: [
    { mode: 'MRT', icon: 'mrt', label: 'East-West Line', detail: 'City Hall / Raffles Place', duration: '~30 min', price: 'S$2.10–2.50', tip: 'Most affordable option' },
    { mode: 'Express', icon: 'train', label: 'Changi Express (TEL)', detail: 'Direct city link, T2/T3 station', duration: '~29 min', price: 'S$5.00', tip: 'Fastest transit option' },
    { mode: 'Bus', icon: 'bus', label: 'Bus 36', detail: 'Orchard Road (direct)', duration: '~60 min', price: 'S$2.50', tip: 'Budget-friendly, scenic route' },
    { mode: 'Grab', icon: 'taxi', label: 'Grab / Taxi', detail: 'CBD or any destination', duration: '25–35 min', price: '~S$20–35', tip: 'Door-to-door, higher at peak hours' },
  ],
});

const jewelData = reactive({
  highlights: [
    { name: 'HSBC Rain Vortex', desc: "World's tallest indoor waterfall at 40m. Nightly light shows at 7:30pm & 8:30pm.", icon: 'vortex', tag: 'Free entry' },
    { name: 'Canopy Park', desc: 'Sky Nets Walk, Bouncing Net, Hedge Maze & Mirror Maze on Level 5.', icon: 'park', tag: 'From S$12' },
    { name: '100+ Dining Options', desc: 'Din Tai Fung, Shake Shack, Five Guys, Tsuta (Michelin), and local hawker favourites.', icon: 'dining', tag: 'Open daily' },
    { name: '280+ Retail Stores', desc: 'Luxury brands, tech gadgets, and Singapore souvenirs across 5 floors.', icon: 'shopping', tag: 'Open daily' },
  ],
  location: 'Connected to T1, T2, T3 · Free shuttle to T4',
  hours: 'Open 24 hours (some shops vary)',
});

const diningData = reactive({
  terminal: 'T3',
  restaurants: [
    { name: 'Shake Shack', cuisine: 'American Burgers', location: 'T3, Level 1', hours: '6am–12am', priceRange: 'S$12–22' },
    { name: 'Din Tai Fung', cuisine: 'Taiwanese Dim Sum', location: 'Jewel, Level 2', hours: '10am–10pm', priceRange: 'S$18–35' },
    { name: 'PAUL Bakery', cuisine: 'French Café & Pastries', location: 'T3, Level 2', hours: '24 hours', priceRange: 'S$8–18' },
    { name: 'Poulet', cuisine: 'French Comfort Food', location: 'T3, Level 2', hours: '10am–10pm', priceRange: 'S$15–28' },
    { name: 'A&W', cuisine: 'Singapore Nostalgia', location: 'T3, Level B2', hours: '24 hours', priceRange: 'S$6–12' },
  ],
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

// ─── Card detection (airport) ───
function detectAirportCard(text: string): 'flight_status' | 'transport' | 'jewel' | 'dining' | null {
  const lower = text.toLowerCase();
  const isFlight = lower.includes('flight details') || lower.includes('flight status') || lower.includes('your flight') ||
    lower.includes('on time') || lower.includes('boarding') || lower.includes('gate c') || lower.includes('gate a') ||
    lower.includes('gate d') || lower.includes('gate b') || lower.includes('sq 321') || lower.includes('cx 759') ||
    lower.includes('tr 608') || lower.includes('qr 647') || lower.includes('terminal 3') || lower.includes('terminal 4');
  if (isFlight && !shownCards.flight) return 'flight_status';

  const isTransport = lower.includes('transport options') || lower.includes('how to get') || lower.includes('getting to') ||
    lower.includes('take the mrt') || lower.includes('mrt') && lower.includes('city') || lower.includes('bus 36') ||
    lower.includes('grab') && lower.includes('taxi');
  if (isTransport && !shownCards.transport) return 'transport';

  const isJewel = lower.includes('jewel changi') || lower.includes('rain vortex') || lower.includes('canopy park') ||
    lower.includes("jewel has to offer") || lower.includes('show you jewel');
  if (isJewel && !shownCards.jewel) return 'jewel';

  const isDining = lower.includes('dining options') || lower.includes('great restaurants') || lower.includes('places to eat') ||
    lower.includes('din tai fung') || lower.includes('shake shack') || lower.includes('food options');
  if (isDining && !shownCards.dining) return 'dining';

  return null;
}

function extractFlightFromText(allText: string) {
  const lower = allText.toLowerCase();
  for (const f of DEMO_FLIGHTS) {
    const fn = f.flightNo.toLowerCase().replace(' ', '');
    if (lower.includes(fn) || lower.includes(f.flightNo.toLowerCase())) {
      Object.assign(flightData, f);
      return;
    }
  }
  Object.assign(flightData, DEMO_FLIGHTS[0]);
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

      if (agentId.value === 'airport') {
        extractFlightFromText(allText);
        const cardType = detectAirportCard(text);
        if (cardType === 'flight_status') { shownCards.flight = true; entries.value.push({ type: 'flight_status_card' }); }
        else if (cardType === 'transport') { shownCards.transport = true; entries.value.push({ type: 'transport_card' }); }
        else if (cardType === 'jewel') { shownCards.jewel = true; entries.value.push({ type: 'jewel_card' }); }
        else if (cardType === 'dining') { shownCards.dining = true; entries.value.push({ type: 'dining_card' }); }
      } else if (agentId.value === 'medical') {
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
    agentId.value = result.activeAgent as 'barista' | 'medical' | 'airport';
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
  airport: {
    text: "Welcome to Changi Airport! I'm ARIA, your AI passenger assistant. Need help with flights, transport, or exploring the airport?",
    card: '',
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
      if (agentId.value === 'airport') {
        // No initial card for airport — ARIA shows cards contextually
        scrollToBottom();
        return;
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

/* Airport agent uses purple rings */
.ring-wrap.airport .ring {
  border-color: #7C3AED;
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
.ring-wrap.airport.listening .orb {
  background: rgba(124,58,237,0.1);
  border-color: #7C3AED;
  color: #7C3AED;
  box-shadow: 0 0 24px rgba(124,58,237,0.25);
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

/* Mobile H5 */
@media (max-width: 640px) {
  .voice-panel {
    padding: 16px 12px 12px;
    gap: 14px;
  }

  .ring-wrap {
    width: 80px;
    height: 80px;
  }
  .ring-1 { width: 80px; height: 80px; }
  .ring-2 { width: 64px; height: 64px; }
  .ring-3 { width: 50px; height: 50px; }
  .orb { width: 48px; height: 48px; }
  .orb svg { width: 22px; height: 22px; }

  .status-section { gap: 8px; }
  .status-label { font-size: 12px; }

  .conversation-section {
    max-width: 100%;
    border-radius: var(--radius-md);
  }

  .conversation-body {
    padding: 10px;
    gap: 8px;
  }

  .card-entry {
    max-width: 100%;
    margin: 4px 0;
  }

  .message-bubble {
    max-width: 85%;
    font-size: 13px;
    padding: 7px 10px;
  }

  .btn-start, .btn-stop {
    padding: 10px 24px;
    font-size: 13px;
    width: 100%;
    justify-content: center;
    max-width: 300px;
  }
}
</style>
