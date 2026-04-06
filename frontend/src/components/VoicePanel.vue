<template>
  <div class="relative flex flex-1 flex-col overflow-hidden">
    <!-- Subtle ambient glow -->
    <div class="absolute inset-0 transition-all duration-1000" :style="{ background: ambientGradient }" />

    <div class="relative z-10 flex flex-1 flex-col overflow-hidden">

      <!-- ── Status bar: 56px, 16px margins (HIG), 48px touch targets (web.dev) ── -->
      <div class="shrink-0 flex items-center border-b border-white/[0.06] bg-white/[0.02]" style="height: 56px; padding: 0 16px">
        <!-- Agent orb + status -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="relative shrink-0">
            <div
              v-if="isActive && (aiState === 'listening' || aiState === 'speaking')"
              class="absolute -inset-2 rounded-full animate-orb-ring"
              :style="{ background: `radial-gradient(circle, ${orbGlowColor} 0%, transparent 70%)` }"
            />
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
              :class="[
                isActive && aiState === 'listening' ? 'animate-orb-breathe' :
                isActive && aiState === 'speaking' ? 'animate-orb-speak' :
                isActive && aiState === 'thinking' ? 'animate-orb-think' : '',
              ]"
              :style="{ background: orbBackground }"
            >
              <div v-if="isActive && (aiState === 'listening' || aiState === 'speaking')" class="flex items-center gap-[2px]">
                <div v-for="n in 3" :key="n" class="w-[2px] bg-white/90 rounded-full animate-wave-bar" :style="{ height: waveBarHeights[n - 1], animationDelay: `${n * 0.12}s` }" />
              </div>
              <div v-else-if="isActive && aiState === 'thinking'" class="flex items-center gap-[3px]">
                <div v-for="n in 3" :key="n" class="w-1 h-1 bg-white/70 rounded-full animate-think-dot" :style="{ animationDelay: `${n * 0.15}s` }" />
              </div>
              <span v-else class="text-white text-[13px] font-bold">{{ botInitial }}</span>
            </div>
          </div>
          <div class="flex flex-col min-w-0 gap-0.5">
            <span class="font-semibold text-white/90 truncate" style="font-size: var(--text-base, 15px)">{{ botName }}</span>
            <span class="leading-tight" :class="isActive ? 'text-white/50' : 'text-white/35'" style="font-size: var(--text-xs, 11px)">{{ statusLabel }}</span>
          </div>
        </div>
        <!-- End button: 48px touch target (web.dev minimum), 8px spacing -->
        <button
          v-if="isActive"
          @click="stop"
          class="ml-auto flex items-center justify-center h-12 min-w-[48px] px-4 -mr-1 rounded-xl font-medium text-red-400/90 transition-all active:scale-95 active:bg-white/[0.04]"
          style="font-size: var(--text-sm, 13px)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="mr-1.5"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          End
        </button>
      </div>

      <!-- ── Conversation: flex-1 fills remaining space ── -->
      <div
        ref="conversationArea"
        class="flex-1 min-h-0 overflow-y-auto custom-scrollbar"
      >
        <!-- Empty state: centered, generous padding, fluid text (web.dev) -->
        <div v-if="entries.length === 0 && !isActive" class="flex flex-col items-center justify-center h-full" style="padding: 0 48px">
          <div
            class="w-20 h-20 rounded-[22px] flex items-center justify-center mb-6 shadow-lg"
            :style="{ background: orbBackground }"
          >
            <svg class="w-9 h-9 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
            </svg>
          </div>
          <p class="font-semibold text-white/70 text-center mb-1.5" style="font-size: var(--text-lg, 17px)">{{ botName }}</p>
          <!-- web.dev: max-inline-size with ch for ideal line length (45-75 chars) -->
          <p class="text-white/35 text-center leading-relaxed" :style="{ fontSize: 'var(--text-sm, 13px)', maxInlineSize: windowWidth > 1024 ? '48ch' : '36ch' }">{{
            agentId === 'medical' ? 'Your AI healthcare assistant. Tap below to start a voice consultation.' :
            agentId === 'airport' ? 'Your Changi Airport guide. Ask about flights, transport, or dining.' :
            'Your AI barista. Start a voice order and Bella will help you pick a drink.'
          }}</p>
        </div>

        <!-- Messages: 16px margins (HIG), max-width (MD3), fluid text (web.dev) -->
        <div v-else class="flex flex-col" :style="{ gap: '4px', padding: '16px 16px', maxWidth: conversationMaxWidth, margin: windowWidth >= 640 ? '0 auto' : undefined }">
          <template v-for="(entry, i) in entries" :key="i">
            <!-- Message -->
            <div v-if="entry.type === 'message'">
              <!-- Sender change = extra spacing for visual grouping -->
              <div
                v-if="i > 0 && (entries[i-1]?.type !== 'message' || (entries[i-1] as any)?.role !== entry.role)"
                style="height: 12px"
              />
              <!-- Show sender label only when sender changes -->
              <div
                v-if="i === 0 || (entries[i-1]?.type === 'message' && (entries[i-1] as any)?.role !== entry.role) || entries[i-1]?.type !== 'message'"
                :class="entry.role === 'user' ? 'flex items-center justify-end' : 'flex items-center'"
                style="gap: 8px; margin-bottom: 6px"
              >
                <!-- Avatar: 30px -->
                <div
                  v-if="entry.role !== 'user'"
                  class="rounded-full flex items-center justify-center font-bold text-white shrink-0"
                  :style="{ width: '30px', height: '30px', background: orbBackground, fontSize: '11px' }"
                >
                  {{ botInitial }}
                </div>
                <span class="font-medium text-white/40" style="font-size: 11px">{{ entry.role === 'user' ? 'You' : botName }}</span>
                <div
                  v-if="entry.role === 'user'"
                  class="rounded-full flex items-center justify-center font-bold text-white shrink-0"
                  :style="{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #C67C4E, #8B5A2B)', fontSize: '11px' }"
                >
                  U
                </div>
              </div>
              <!-- Bubble: constrained width, proper alignment -->
              <div :class="['flex', entry.role === 'user' ? 'justify-end' : '']">
                <div
                  :style="{
                    fontSize: 'var(--text-base, 15px)',
                    lineHeight: '1.5',
                    maxWidth: windowWidth > 1024 ? '85%' : 'min(42ch, 80%)',
                    padding: '10px 16px',
                    borderRadius: entry.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                    background: entry.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                    color: entry.role === 'user' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
                  }"
                >
                  {{ entry.text }}
                  <span v-if="entry.active" class="ml-1 inline-block w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse align-middle" />
                </div>
              </div>
            </div>
            <!-- Card: aligned with bot messages -->
            <div v-else :style="{ padding: '8px 0', maxWidth: windowWidth > 1024 ? '85%' : 'min(42ch, 90%)' }">
              <component
                :is="getCardComponent(entry.type)"
                v-bind="getCardProps(entry.type)"
                v-if="getCardComponent(entry.type)"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- ── Bottom: Start button or error ── -->
      <div
        class="shrink-0 w-full flex flex-col items-center"
        style="gap: 12px; padding: 16px 16px max(1.25rem, calc(0.75rem + env(safe-area-inset-bottom, 0px)))"
      >
        <div v-if="errorMsg" class="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/10 max-w-[340px]" style="font-size: var(--text-sm, 13px)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-red-400">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span class="text-red-400">{{ errorMsg }}</span>
        </div>
        <!-- Start: 52px height (above 48px web.dev minimum), full-width on mobile -->
        <button
          v-if="!isActive"
          @click="start"
          :disabled="isLoading"
          class="flex items-center justify-center gap-2.5 w-full max-w-[340px] lg:max-w-[420px] h-[52px] rounded-2xl font-semibold text-white shadow-lg transition-all duration-200 active:scale-[0.97] disabled:opacity-40"
          :style="{ background: orbBackground, fontSize: 'var(--text-base, 15px)' }"
        >
          <svg v-if="!isLoading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          </svg>
          <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ isLoading ? 'Connecting...' : startButtonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, defineAsyncComponent, type Component } from 'vue';
import { startVoiceMode, stopVoiceMode } from '../services/trtc';
import { fetchAgents } from '../services/api';

// Lazy-load card components
const MenuCard = defineAsyncComponent(() => import('./cards/MenuCard.vue'));
const OrderCard = defineAsyncComponent(() => import('./cards/OrderCard.vue'));
const ConfirmationCard = defineAsyncComponent(() => import('./cards/ConfirmationCard.vue'));
const ServiceMenuCard = defineAsyncComponent(() => import('./cards/ServiceMenuCard.vue'));
const DoctorListCard = defineAsyncComponent(() => import('./cards/DoctorListCard.vue'));
const AppointmentCard = defineAsyncComponent(() => import('./cards/AppointmentCard.vue'));
const FlightStatusCard = defineAsyncComponent(() => import('./cards/FlightStatusCard.vue'));
const TransportCard = defineAsyncComponent(() => import('./cards/TransportCard.vue'));
const JewelCard = defineAsyncComponent(() => import('./cards/JewelCard.vue'));
const TerminalDiningCard = defineAsyncComponent(() => import('./cards/TerminalDiningCard.vue'));

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
const windowWidth = ref(window.innerWidth);
const agentId = ref<'barista' | 'medical' | 'airport'>('barista');
let welcomeTimeout: ReturnType<typeof setTimeout> | null = null;

// Pre-computed wave bar heights (avoid Math.random in template)
const waveBarHeights = [10, 12, 8].map(h => `${h}px`);

const shownCards = reactive({
  menu: false, order: false, confirmation: false,
  serviceMenu: false, doctorList: false, appointment: false,
  flight: false, transport: false, jewel: false, dining: false,
});

const conversationText = ref<string[]>([]);
const orbSize = computed(() => (aiState.value === 'speaking' ? 'lg' : 'md'));

// ─── Theme-aware computed styles ───
// Desktop-responsive conversation column width (percentage-based for natural scaling)
const conversationMaxWidth = computed(() => {
  if (windowWidth.value >= 1536) return '82%';
  if (windowWidth.value >= 1280) return '84%';
  if (windowWidth.value >= 1024) return '86%';
  if (windowWidth.value >= 640) return '92%';
  return 'none';
});

const orbBackground = computed(() => {
  if (agentId.value === 'medical') return 'linear-gradient(135deg, #2E86DE, #1B5E9E)';
  if (agentId.value === 'airport') return 'linear-gradient(135deg, #7C3AED, #0EA5E9)';
  return 'linear-gradient(135deg, #C67C4E, #8B5A2B)';
});

const orbGlowColor = computed(() => {
  if (agentId.value === 'medical') return 'rgba(46,134,222,0.15)';
  if (agentId.value === 'airport') return 'rgba(124,58,237,0.15)';
  return 'rgba(198,124,78,0.15)';
});

const ambientGradient = computed(() => {
  if (!isActive.value) return 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.02) 0%, transparent 70%)';
  if (agentId.value === 'medical') return 'radial-gradient(ellipse at 50% 30%, rgba(46,134,222,0.06) 0%, transparent 60%)';
  if (agentId.value === 'airport') return 'radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.06) 0%, transparent 60%)';
  return 'radial-gradient(ellipse at 50% 30%, rgba(198,124,78,0.06) 0%, transparent 60%)';
});

const botInitial = computed(() => agentId.value === 'medical' ? 'A' : agentId.value === 'airport' ? 'R' : 'B');
const botName = computed(() => agentId.value === 'medical' ? 'Ava' : agentId.value === 'airport' ? 'ARIA' : 'Bella');

const startButtonLabel = computed(() => {
  if (agentId.value === 'medical') return 'Start Consultation';
  if (agentId.value === 'airport') return 'Chat with ARIA';
  return 'Start Voice Order';
});

const statusLabel = computed(() => {
  if (isLoading.value) return 'Connecting...';
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

// ─── Card component mapping ───
function getCardComponent(type: string): Component | null {
  const map: Record<string, Component> = {
    menu_card: MenuCard,
    order_card: OrderCard,
    confirmation_card: ConfirmationCard,
    service_menu_card: ServiceMenuCard,
    doctor_list_card: DoctorListCard,
    appointment_card: AppointmentCard,
    flight_status_card: FlightStatusCard,
    transport_card: TransportCard,
    jewel_card: JewelCard,
    dining_card: TerminalDiningCard,
  };
  return map[type] || null;
}

function getCardProps(type: string): Record<string, any> {
  const propsMap: Record<string, Record<string, any>> = {
    order_card: { order: orderData },
    confirmation_card: { confirmation: confirmationData },
    service_menu_card: { services: serviceMenuData.services },
    doctor_list_card: { doctors: doctorListData.doctors },
    appointment_card: { appointment: appointmentData },
    flight_status_card: { flight: flightData },
    transport_card: { data: transportData },
    jewel_card: { data: jewelData },
    dining_card: { data: diningData },
  };
  return propsMap[type] || {};
}

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

// ─── Airport data ───
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
    { name: 'PAUL Bakery', cuisine: 'French Cafe & Pastries', location: 'T3, Level 2', hours: '24 hours', priceRange: 'S$8–18' },
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

// ─── Card detection (barista) — aligned with backend logic ───
function detectBaristaCard(text: string): 'menu' | 'order' | 'confirmation' | null {
  const lower = text.toLowerCase();
  // Confirmation: require order-specific context
  if (!shownCards.confirmation && (
    lower.includes('order is confirmed') || lower.includes('order confirmed') ||
    lower.includes('on its way') || lower.includes('enjoy your coffee') || lower.includes('enjoy your drink') ||
    (lower.includes('all set') && (lower.includes('order') || lower.includes('coffee') || lower.includes('delivery') || lower.includes('pickup'))) ||
    lower.includes('has been placed') || lower.includes('order is placed') ||
    lower.includes('set for delivery') || lower.includes('set for pickup') ||
    (lower.includes('ready in') && lower.includes('minute'))
  )) return 'confirmation';
  // Order: delivery or pickup prompt
  if (!shownCards.order && (lower.includes('delivery or pickup'))) return 'order';
  // Menu: explicit menu mentions
  if (!shownCards.menu && (
    lower.includes('menu') ||
    (lower.includes('which') && (lower.includes('coffee') || lower.includes('drink'))) ||
    (lower.includes('what') && lower.includes('like') && (lower.includes('coffee') || lower.includes('drink')))
  )) {
    shownCards.menu = false; shownCards.order = false; shownCards.confirmation = false;
    return 'menu';
  }
  return null;
}

// ─── Card detection (airport) — aligned with backend logic ───
function detectAirportCard(text: string): 'flight_status' | 'transport' | 'jewel' | 'dining' | null {
  const lower = text.toLowerCase();
  // Flight: only explicit trigger phrases from system prompt
  const isFlight = lower.includes('here are your flight details') ||
    lower.includes('let me pull up your flight') ||
    (lower.includes('flight') && lower.includes('gate') && lower.includes('terminal'));
  if (isFlight && !shownCards.flight) return 'flight_status';

  // Transport: explicit phrases + compound conditions
  const isTransport = lower.includes('here are your transport options') ||
    lower.includes("here's how to get there") || lower.includes('transport options') ||
    (lower.includes('take the mrt') && (lower.includes('min') || lower.includes('station'))) ||
    (lower.includes('mrt') && lower.includes('grab') && lower.includes('min'));
  if (isTransport && !shownCards.transport) return 'transport';

  // Jewel: explicit phrases + landmarks
  const isJewel = lower.includes("here's what jewel has to offer") ||
    lower.includes('let me show you jewel') ||
    (lower.includes('jewel changi') && (lower.includes('rain vortex') || lower.includes('canopy') || lower.includes('shopping') || lower.includes('dining'))) ||
    lower.includes('rain vortex');
  if (isJewel && !shownCards.jewel) return 'jewel';

  // Dining: explicit phrases + compound conditions
  const isDining = lower.includes('here are some dining options') ||
    lower.includes('here are some great restaurants') || lower.includes('here are great places to eat') ||
    (lower.includes('dining options') && (lower.includes('terminal') || lower.includes('jewel'))) ||
    (lower.includes('restaurant') && lower.includes('terminal') && lower.includes('recommend'));
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
  // Only default to first flight if no specific flight was mentioned —
  // this prevents showing SQ 321 when user hasn't mentioned any flight yet
}

// ─── Card detection (medical) — aligned with backend logic ───
function detectMedicalCard(text: string): 'service_menu' | 'doctor_list' | 'appointment' | null {
  const lower = text.toLowerCase();
  // Appointment: require explicit confirmation phrases
  if (!shownCards.appointment && (
    lower.includes('appointment is confirmed') || lower.includes('booking is confirmed') ||
    lower.includes('appointment has been booked') || lower.includes('successfully booked') ||
    lower.includes('booked your appointment') || lower.includes('confirmed your appointment') ||
    (lower.includes('see you on') && lower.includes('dr.'))
  )) return 'appointment';
  // Doctor list: require "available doctors" or doctor recommendations
  if (!shownCards.doctorList && (
    lower.includes('available doctors') || lower.includes('here are our available') ||
    lower.includes('here are the doctors') ||
    lower.includes('recommend dr.') || lower.includes('i\'d recommend dr.') ||
    lower.includes('i recommend dr.') || lower.includes('suggest dr.') ||
    (lower.includes('dr.') && lower.includes('available') && lower.includes('specializ'))
  )) return 'doctor_list';
  // Service menu: require Doctor Anywhere context
  if (!shownCards.serviceMenu && (
    lower.includes('welcome to doctor anywhere') ||
    (lower.includes('our services') && (lower.includes('teleconsult') || lower.includes('screening') || lower.includes('gp'))) ||
    (lower.includes('how can i help') && (lower.includes('doctor') || lower.includes('consult') || lower.includes('booking') || lower.includes('appointment'))) ||
    lower.includes('see a gp') ||
    (lower.includes('teleconsult') && lower.includes('screening'))
  )) {
    shownCards.serviceMenu = false; shownCards.doctorList = false; shownCards.appointment = false;
    return 'service_menu';
  }
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
  for (const doc of doctorListData.doctors) {
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

function onResize() { windowWidth.value = window.innerWidth; }

function onAgentChanged(e: Event) {
  agentId.value = (e as CustomEvent).detail as 'barista' | 'medical' | 'airport';
}

onMounted(() => {
  window.addEventListener('voice-subtitle', onSubtitle);
  window.addEventListener('voice-state', onState);
  window.addEventListener('resize', onResize);
  window.addEventListener('agent-changed', onAgentChanged);
  loadAgent();
});

onUnmounted(() => {
  window.removeEventListener('voice-subtitle', onSubtitle);
  window.removeEventListener('voice-state', onState);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('agent-changed', onAgentChanged);
  if (welcomeTimeout) { clearTimeout(welcomeTimeout); welcomeTimeout = null; }
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
    if (result.agentId) agentId.value = result.agentId;
    isActive.value = true;
    aiState.value = 'idle';

    const welcome = welcomeMessages[agentId.value];
    if (welcomeTimeout) clearTimeout(welcomeTimeout);
    welcomeTimeout = setTimeout(() => {
      welcomeTimeout = null;
      if (!isActive.value) return; // Component may have stopped
      if (!entries.value.some(e => e.type === 'message' && e.role === 'assistant')) {
        entries.value.push({ type: 'message', text: welcome.text, role: 'assistant', active: false });
      }
      if (agentId.value === 'airport') {
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
  if (welcomeTimeout) { clearTimeout(welcomeTimeout); welcomeTimeout = null; }
  try { await stopVoiceMode(); } catch (e) { console.warn('Stop voice error:', e); }
  isActive.value = false;
  aiState.value = 'idle';
}
</script>

<style>
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}

@keyframes orb-think {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25%      { transform: scale(0.95) rotate(2deg); }
  50%      { transform: scale(1.02) rotate(0deg); }
  75%      { transform: scale(0.97) rotate(-2deg); }
}

@keyframes orb-speak {
  0%, 100% { transform: scale(1); }
  25%      { transform: scale(1.06); }
  50%      { transform: scale(0.97); }
  75%      { transform: scale(1.04); }
}

@keyframes orb-ring {
  0%   { transform: scale(0.8); opacity: 0.4; }
  100% { transform: scale(1.3); opacity: 0; }
}

@keyframes wave-bar {
  0%, 100% { transform: scaleY(0.4); }
  50%      { transform: scaleY(1); }
}

@keyframes think-dot {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50%      { opacity: 1; transform: scale(1.2); }
}

@utility animate-orb-breathe {
  animation: orb-breathe 3s ease-in-out infinite;
}
@utility animate-orb-think {
  animation: orb-think 2s ease-in-out infinite;
}
@utility animate-orb-speak {
  animation: orb-speak 1.5s ease-in-out infinite;
}
@utility animate-orb-ring {
  animation: orb-ring 2.5s ease-out infinite;
}
@utility animate-wave-bar {
  animation: wave-bar 0.8s ease-in-out infinite;
}
@utility animate-think-dot {
  animation: think-dot 1s ease-in-out infinite;
}
</style>
