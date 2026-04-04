/**
 * Medical Agent Plugin — Doctor Anywhere AI Healthcare Assistant
 *
 * Self-contained agent: system prompts, card detection, data, session state.
 */

import type { AgentPlugin, CardTrigger } from '../types';

// ─── Static Data ─────────────────────────────────────────────────────

const DOCTORS = [
  { name: 'Dr. Sarah Chen', specialty: 'General Practice', available: '24/7', fee: 27.25, avatar: 'SC' },
  { name: 'Dr. James Liu', specialty: 'Cardiology', available: 'Tue/Thu, 10am-4pm', fee: 76.30, avatar: 'JL' },
  { name: 'Dr. Emily Wang', specialty: 'Dermatology', available: 'Mon-Fri, 9am-1pm', fee: 76.30, avatar: 'EW' },
  { name: 'Dr. Michael Zhang', specialty: 'Orthopaedics', available: 'Wed/Fri, 2pm-6pm', fee: 76.30, avatar: 'MZ' },
  { name: 'Dr. Lisa Park', specialty: 'Paediatrics', available: 'Mon-Fri, 9am-5pm', fee: 76.30, avatar: 'LP' },
  { name: 'Dr. Rachel Tan', specialty: 'O&G', available: 'Mon/Wed/Fri, 10am-3pm', fee: 76.30, avatar: 'RT' },
];

const SERVICES = [
  { name: 'GP Teleconsult', desc: 'Video call with a GP', price: '$27.25', icon: 'video', tag: '24/7' },
  { name: 'Specialist', desc: 'Cardiology, Dermatology & more', price: 'From $76.30', icon: 'specialist', tag: '' },
  { name: 'Health Screening', desc: 'Comprehensive health packages', price: 'From $86', icon: 'screening', tag: '' },
  { name: 'Mental Wellness', desc: '60-min therapy session', price: '$119.90', icon: 'wellness', tag: '' },
  { name: 'Doctor House Call', desc: 'Doctor visits your home', price: 'From $220', icon: 'house', tag: '' },
];

// ─── Data Accessors ──────────────────────────────────────────────────

interface ServiceMenuData {
  services: typeof SERVICES;
}

function getServiceMenuData(): ServiceMenuData {
  return { services: SERVICES };
}

interface DoctorListData {
  doctors: typeof DOCTORS;
}

function getDoctorListData(): DoctorListData {
  return { doctors: DOCTORS };
}

interface AppointmentDetails {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  patientName: string;
  consultType: string;
  fee: number;
  confirmationNo: string;
}

function extractAppointmentDetails(userId: string): AppointmentDetails {
  const conv = getConversation(userId);
  const allText = conv.join('\n').toLowerCase();
  const userText = conv.filter(m => m.startsWith('user:')).join('\n').toLowerCase();

  const appt: AppointmentDetails = {
    doctor: 'Dr. Sarah Chen',
    specialty: 'General Practice',
    date: 'TBD',
    time: 'TBD',
    patientName: 'Patient',
    consultType: 'Video Teleconsult',
    fee: 27.25,
    confirmationNo: 'DA-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  };

  // Extract doctor
  for (const doc of DOCTORS) {
    const lastName = doc.name.split(' ').pop()!.toLowerCase();
    if (allText.includes(doc.name.toLowerCase()) || userText.includes(lastName)) {
      appt.doctor = doc.name;
      appt.specialty = doc.specialty;
      appt.fee = doc.fee;
      break;
    }
  }

  // Extract consult type
  if (allText.includes('house call') || allText.includes('home visit')) {
    appt.consultType = 'Doctor House Call';
    appt.fee = 220;
  } else if (allText.includes('clinic') || allText.includes('in-person') || allText.includes('walk-in')) {
    appt.consultType = 'Clinic Visit';
  } else if (allText.includes('screening')) {
    appt.consultType = 'Health Screening';
    appt.fee = 86;
  }

  // Extract date
  const datePatterns = [
    /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i,
    /\d{1,2}\/\d{1,2}/,
    /tomorrow|today|next\s+\w+day/i,
  ];
  for (const pat of datePatterns) {
    const match = userText.match(pat) || allText.match(pat);
    if (match) {
      appt.date = match[0].charAt(0).toUpperCase() + match[0].slice(1);
      break;
    }
  }

  // Extract time
  const timeMatch = allText.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i) ||
                     allText.match(/(\d{1,2}:\d{2})/);
  if (timeMatch) appt.time = timeMatch[1];

  // Extract patient name
  const nameMatch = userText.match(/(?:my name is|i'm|i am|name is)\s+([a-z]+ ?[a-z]*)/i) ||
                    userText.match(/(?:name|叫)\s*[:：]?\s*([a-z]+ ?[a-z]*)/i);
  if (nameMatch) {
    appt.patientName = nameMatch[1].split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return appt;
}

// ─── Per-User State ──────────────────────────────────────────────────

const userShownCards = new Map<string, Set<string>>();
const userConversations = new Map<string, string[]>();

function getShownCards(userId: string): Set<string> {
  if (!userShownCards.has(userId)) userShownCards.set(userId, new Set());
  return userShownCards.get(userId)!;
}

function getConversation(userId: string): string[] {
  if (!userConversations.has(userId)) userConversations.set(userId, []);
  return userConversations.get(userId)!;
}

// ─── Card Detection ──────────────────────────────────────────────────

function detectMedicalCardTrigger(userId: string, displayReply: string): CardTrigger | null {
  const shownCards = getShownCards(userId);
  const lower = displayReply.toLowerCase();

  // Appointment confirmed
  const isConfirmed = (
    lower.includes('appointment is confirmed') ||
    lower.includes('booking is confirmed') ||
    lower.includes('appointment has been booked') ||
    lower.includes('successfully booked') ||
    lower.includes('booked your') ||
    lower.includes('you\'re all set') ||
    lower.includes('all set') ||
    lower.includes('see you on') ||
    lower.includes('confirmed your') ||
    lower.includes('预约已确认') ||
    lower.includes('预约成功')
  );
  if (isConfirmed && !shownCards.has('appointment')) {
    shownCards.add('appointment');
    return {
      type: 'appointment_card',
      data: extractAppointmentDetails(userId),
      description: 'Appointment confirmed',
    };
  }

  // Doctor list — AI mentions a specific doctor or recommends
  const isDoctorList = (
    lower.includes('available doctors') ||
    lower.includes('here are our') ||
    lower.includes('here are the') ||
    lower.includes('recommend dr.') ||
    lower.includes('i\'d recommend dr.') ||
    lower.includes('i recommend dr.') ||
    lower.includes('suggest dr.') ||
    lower.includes('which doctor') ||
    lower.includes('dr. sarah') ||
    lower.includes('dr. james') ||
    lower.includes('dr. emily') ||
    lower.includes('dr. michael') ||
    lower.includes('dr. lisa') ||
    lower.includes('dr. rachel') ||
    (lower.includes('dr.') && lower.includes('available')) ||
    (lower.includes('dr.') && lower.includes('specializ')) ||
    lower.includes('推荐医生') ||
    lower.includes('可以预约')
  );
  if (isDoctorList && !shownCards.has('doctor_list')) {
    shownCards.add('doctor_list');
    return {
      type: 'doctor_list_card',
      data: getDoctorListData(),
      description: 'Available doctors',
    };
  }

  // Service menu — AI greets or asks what service they need
  const isServiceMenu = (
    lower.includes('how can i help') ||
    lower.includes('happy to help') ||
    lower.includes('what do you need') ||
    lower.includes('what would you like') ||
    lower.includes('are you looking to') ||
    lower.includes('welcome to doctor anywhere') ||
    lower.includes('our services') ||
    lower.includes('see a gp') ||
    (lower.includes('teleconsult') && lower.includes('screening')) ||
    lower.includes('想要什么服务')
  );
  if (isServiceMenu && !shownCards.has('service_menu')) {
    shownCards.clear();
    shownCards.add('service_menu');
    return {
      type: 'service_menu_card',
      data: getServiceMenuData(),
      description: 'Our services',
    };
  }

  return null;
}

// ─── System Prompts ──────────────────────────────────────────────────

const MEDICAL_PROMPT = `You are Ava, a friendly and professional AI healthcare assistant for Doctor Anywhere — Singapore's leading telehealth platform.

## CORE RULES
- Help patients book consultations, choose the right service, and collect basic info
- Keep every response SHORT: 1-3 sentences max
- Be warm but professional: "I'd be happy to help!", "Let me find the right doctor for you."
- Follow the flow step by step — don't skip ahead or ask multiple questions at once
- You are NOT a doctor. Never diagnose or give medical advice. Always say "The doctor will be able to advise you during the consultation."
- All prices in SGD (nett, no hidden fees)

## SERVICES & PRICING

### Teleconsult (Video Call)
- GP Consultation: $27.25 (standard hours 6am-9pm) / $49.05 (after-hours 9pm-6am)
- Specialist Teleconsult: from $76.30 per session
- Mental Wellness (60 min): $119.90 per session

### In-Person
- DA Clinic Visit: Walk-in or by appointment at 6 clinic locations
- Doctor House Call: from $220

### Health Screenings (at DA MedSuites, Orchard)
- Core (ages 20-30): $86 in-clinic / $129 at-home
- Select (ages 30-40): $140 in-clinic / $184 at-home
- Elite (ages 40+): $195 in-clinic / $238 at-home
- Prestige (comprehensive): $358 in-clinic / $402 at-home

## AVAILABLE DOCTORS (Teleconsult)
- Dr. Sarah Chen — General Practice, available 24/7
- Dr. James Liu — Cardiology, Tue/Thu 10am-4pm
- Dr. Emily Wang — Dermatology, Mon-Fri 9am-1pm
- Dr. Michael Zhang — Orthopaedics, Wed/Fri 2pm-6pm
- Dr. Lisa Park — Paediatrics, Mon-Fri 9am-5pm
- Dr. Rachel Tan — O&G (Women's Health), Mon/Wed/Fri 10am-3pm

## DA CLINIC LOCATIONS
- Anchorvale, Ang Mo Kio, Simei, Potong Pasir, Bukit Batok, Taman Jurong

## BOOKING FLOW (follow this sequence strictly)

### Step 1: Greet & Ask What They Need
- Greet warmly: "Hi! Welcome to Doctor Anywhere."
- Ask what they need: see a GP, specialist consultation, health screening, or something else

### Step 2: Recommend Service Type
- Based on their concern, recommend: Teleconsult (most common), Clinic Visit, or Health Screening
- Mention the relevant price
- Ask if they'd like to proceed

### Step 3: Show Available Doctors
- Present the recommended doctor(s) with specialty, availability, and consultation fee
- Say "Here are our available doctors" to trigger the doctor list
- Ask which doctor they prefer

### Step 4: Choose Date & Time
- Ask for preferred date and time slot
- Available slots: 9:00am, 10:00am, 11:00am, 2:00pm, 3:00pm, 4:00pm
- Confirm the slot

### Step 5: Collect Patient Info
- Ask for patient's full name and phone number
- Ask: "Any symptoms or concerns you'd like the doctor to know beforehand?"

### Step 6: Confirm Booking
- Summarize: service type, doctor, date, time, patient name, consultation fee
- Say "Your appointment is confirmed!" to trigger the confirmation card
- Mention: "Medication can be delivered to your door within 3 hours after consultation."

## EDGE CASES
- Emergency → "Please call 995 or go to the nearest A&E immediately."
- Medical advice → "The doctor will be able to advise you during your consultation."
- Unsure which service → Recommend GP Teleconsult ($27.25, quickest option)
- Cancel/reschedule → "No problem! Would you like to pick a different time?"
- Insurance/CHAS → "Yes, we accept CHAS and most insurance plans. The doctor can verify during your visit."

## LANGUAGE
- Default: English. If patient speaks Chinese: switch to Chinese.`;

const VOICE_SYSTEM_PROMPT = `You are Ava, a friendly AI healthcare assistant for Doctor Anywhere, Singapore's leading telehealth platform. Help patients book consultations. Keep responses SHORT (1-2 sentences). Be warm but professional. You are NOT a doctor — never diagnose. Services: GP Teleconsult $27.25 (24/7), Specialist from $76.30, Health Screening from $86, Mental Wellness $119.90, House Call from $220. Doctors: Dr. Sarah Chen (GP, 24/7), Dr. James Liu (Cardiology), Dr. Emily Wang (Dermatology), Dr. Michael Zhang (Orthopaedics), Dr. Lisa Park (Paediatrics), Dr. Rachel Tan (O&G). Flow: ask what they need → recommend service → show doctors → pick date/time → collect name → confirm. Medication delivered within 3 hours. Default English, switch to Chinese if patient speaks Chinese.`;

const VOICE_WELCOME_MESSAGE = "Hi! Welcome to Doctor Anywhere. I'm Ava, your healthcare assistant. How can I help you today — would you like to see a doctor, book a health screening, or something else?";

// ─── Plugin Export ───────────────────────────────────────────────────

export const medicalAgent: AgentPlugin = {
  id: 'medical',
  name: 'Doctor Anywhere',
  subtitle: 'AI Healthcare Assistant',
  icon: 'medical',
  themeColor: '#00B4D8',

  textSystemPrompt: MEDICAL_PROMPT,
  voiceSystemPrompt: VOICE_SYSTEM_PROMPT,
  voiceWelcomeMessage: VOICE_WELCOME_MESSAGE,

  trackMessage(userId: string, role: 'user' | 'assistant', text: string): void {
    const conv = getConversation(userId);
    conv.push(`${role}: ${text}`);
    if (conv.length > 20) conv.shift();
  },

  detectCard(userId: string, reply: string): CardTrigger | null {
    return detectMedicalCardTrigger(userId, reply);
  },

  cleanDisplayText(text: string): string {
    let r = text;
    // Remove markdown bold
    r = r.replace(/\*\*/g, '');
    // Normalize bullets to newlines
    r = r.replace(/\s*[*•]\s+/g, '\n');
    // Collapse whitespace
    r = r.replace(/\s{2,}/g, ' ');
    return r.trim();
  },

  resetSession(userId: string): void {
    userShownCards.delete(userId);
    userConversations.delete(userId);
  },
};
