// Per-user conversation context & card detection for Doctor Anywhere medical assistant

const userShownCards = new Map<string, Set<string>>();
const userConversations = new Map<string, string[]>();

export function resetMedicalCards(userId: string): void {
  userShownCards.delete(userId);
  userConversations.delete(userId);
}

function getShownCards(userId: string): Set<string> {
  if (!userShownCards.has(userId)) userShownCards.set(userId, new Set());
  return userShownCards.get(userId)!;
}

function getConversation(userId: string): string[] {
  if (!userConversations.has(userId)) userConversations.set(userId, []);
  return userConversations.get(userId)!;
}

export function trackMedicalMessage(userId: string, role: 'user' | 'assistant', text: string): void {
  const conv = getConversation(userId);
  conv.push(`${role}: ${text}`);
  if (conv.length > 20) conv.shift();
}

export type MedicalCardType = 'service_menu_card' | 'doctor_list_card' | 'appointment_card';

export function detectMedicalCardTrigger(userId: string, displayReply: string): MedicalCardType | null {
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
    return 'appointment_card';
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
    return 'doctor_list_card';
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
    return 'service_menu_card';
  }

  return null;
}

// ─── Data structures ─────────────────────────────────────────────────

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

export interface ServiceMenuData {
  services: typeof SERVICES;
}

export function getServiceMenuData(): ServiceMenuData {
  return { services: SERVICES };
}

export interface DoctorListData {
  doctors: typeof DOCTORS;
}

export function getDoctorListData(): DoctorListData {
  return { doctors: DOCTORS };
}

export interface AppointmentDetails {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  patientName: string;
  consultType: string;
  fee: number;
  confirmationNo: string;
}

export function extractAppointmentDetails(userId: string): AppointmentDetails {
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
