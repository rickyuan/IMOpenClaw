// Per-user conversation context & card detection for Changi Airport ARIA agent

const userShownCards = new Map<string, Set<string>>();
const userConversations = new Map<string, string[]>();

export function resetAirportCards(userId: string): void {
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

export function trackAirportMessage(userId: string, role: 'user' | 'assistant', text: string): void {
  const conv = getConversation(userId);
  conv.push(`${role}: ${text}`);
  if (conv.length > 20) conv.shift();
}

export type AirportCardType = 'flight_status_card' | 'transport_card' | 'jewel_card' | 'dining_card';

export function detectAirportCardTrigger(userId: string, displayReply: string): AirportCardType | null {
  const shownCards = getShownCards(userId);
  const lower = displayReply.toLowerCase();

  // Flight status card
  const isFlight = (
    lower.includes('here are your flight details') ||
    lower.includes('let me pull up your flight') ||
    lower.includes('flight details') ||
    lower.includes('flight status') ||
    lower.includes('your flight') ||
    lower.includes('flight is') ||
    lower.includes('sq 321') || lower.includes('sq321') ||
    lower.includes('cx 759') || lower.includes('cx759') ||
    lower.includes('tr 608') || lower.includes('tr608') ||
    lower.includes('qr 647') || lower.includes('qr647') ||
    lower.includes('on time') ||
    lower.includes('boarding') ||
    lower.includes('gate c23') || lower.includes('gate a12') || lower.includes('gate d15') || lower.includes('gate b08')
  );
  if (isFlight && !shownCards.has('flight')) {
    shownCards.add('flight');
    return 'flight_status_card';
  }

  // Transport card — shown once per conversation
  const isTransport = (
    lower.includes('here are your transport options') ||
    lower.includes("here's how to get there") ||
    lower.includes('transport options') ||
    lower.includes('take the mrt') ||
    lower.includes('changi airport mrt') ||
    lower.includes('getting to') ||
    lower.includes('how to get') ||
    lower.includes('grab or taxi') ||
    lower.includes('bus 36') ||
    (lower.includes('mrt') && lower.includes('city')) ||
    (lower.includes('taxi') && lower.includes('cbd'))
  );
  if (isTransport && !shownCards.has('transport')) {
    shownCards.add('transport');
    return 'transport_card';
  }

  // Jewel card
  const isJewel = (
    lower.includes("here's what jewel has to offer") ||
    lower.includes('let me show you jewel') ||
    lower.includes('jewel changi') ||
    lower.includes('rain vortex') ||
    lower.includes('canopy park') ||
    (lower.includes('jewel') && lower.includes('waterfall')) ||
    (lower.includes('jewel') && lower.includes('shopping')) ||
    (lower.includes('jewel') && lower.includes('dining'))
  );
  if (isJewel && !shownCards.has('jewel')) {
    shownCards.add('jewel');
    return 'jewel_card';
  }

  // Dining card
  const isDining = (
    lower.includes('here are some dining options') ||
    lower.includes('here are some great restaurants') ||
    lower.includes('here are great places to eat') ||
    lower.includes('dining options') ||
    lower.includes('din tai fung') ||
    lower.includes('shake shack') ||
    lower.includes('some restaurants') ||
    lower.includes('food options') ||
    (lower.includes('eat') && (lower.includes('terminal') || lower.includes('jewel'))) ||
    (lower.includes('restaurant') && lower.includes('terminal'))
  );
  if (isDining && !shownCards.has('dining')) {
    shownCards.add('dining');
    return 'dining_card';
  }

  return null;
}

// ─── Static data for cards ─────────────────────────────────────────────

export const DEMO_FLIGHTS = [
  {
    flightNo: 'SQ 321',
    airline: 'Singapore Airlines',
    airlineCode: 'SQ',
    origin: 'Singapore (SIN)',
    destination: 'London (LHR)',
    terminal: 'T3',
    gate: 'C23',
    status: 'On Time',
    departure: '14:30',
    arrival: '21:25+1',
    checkInCloses: '12:30',
  },
  {
    flightNo: 'CX 759',
    airline: 'Cathay Pacific',
    airlineCode: 'CX',
    origin: 'Singapore (SIN)',
    destination: 'Hong Kong (HKG)',
    terminal: 'T4',
    gate: 'A12',
    status: 'Boarding',
    departure: '13:45',
    arrival: '17:40',
    checkInCloses: '12:45',
  },
  {
    flightNo: 'TR 608',
    airline: 'Scoot',
    airlineCode: 'TR',
    origin: 'Singapore (SIN)',
    destination: 'Bangkok (BKK)',
    terminal: 'T2',
    gate: 'D15',
    status: 'Delayed',
    departure: '16:20',
    arrival: '17:50',
    checkInCloses: '14:20',
    delayMinutes: 45,
  },
  {
    flightNo: 'QR 647',
    airline: 'Qatar Airways',
    airlineCode: 'QR',
    origin: 'Singapore (SIN)',
    destination: 'Doha (DOH)',
    terminal: 'T1',
    gate: 'B08',
    status: 'On Time',
    departure: '18:00',
    arrival: '22:30',
    checkInCloses: '16:00',
  },
];

export const TRANSPORT_DATA = {
  destination: 'City Centre',
  options: [
    {
      mode: 'MRT',
      icon: 'mrt',
      label: 'East-West Line',
      detail: 'City Hall / Raffles Place',
      duration: '~30 min',
      price: 'S$2.10–2.50',
      tip: 'Most affordable option',
    },
    {
      mode: 'Express',
      icon: 'train',
      label: 'Changi Express (TEL)',
      detail: 'Direct city link, T2/T3 station',
      duration: '~29 min',
      price: 'S$5.00',
      tip: 'Fastest transit option',
    },
    {
      mode: 'Bus',
      icon: 'bus',
      label: 'Bus 36',
      detail: 'Orchard Road (direct)',
      duration: '~60 min',
      price: 'S$2.50',
      tip: 'Budget-friendly, scenic route',
    },
    {
      mode: 'Grab',
      icon: 'taxi',
      label: 'Grab / Taxi',
      detail: 'CBD or any destination',
      duration: '25–35 min',
      price: '~S$20–35',
      tip: 'Door-to-door, higher at peak hours',
    },
  ],
};

export const JEWEL_DATA = {
  highlights: [
    {
      name: 'HSBC Rain Vortex',
      desc: "World's tallest indoor waterfall at 40m. Nightly light shows at 7:30pm & 8:30pm.",
      icon: 'vortex',
      tag: 'Free entry',
    },
    {
      name: 'Canopy Park',
      desc: 'Sky Nets Walk, Bouncing Net, Hedge Maze & Mirror Maze on Level 5.',
      icon: 'park',
      tag: 'From S$12',
    },
    {
      name: '100+ Dining Options',
      desc: 'Din Tai Fung, Shake Shack, Five Guys, Tsuta (Michelin), and local hawker favourites.',
      icon: 'dining',
      tag: 'Open daily',
    },
    {
      name: '280+ Retail Stores',
      desc: 'Luxury brands, tech gadgets, and Singapore souvenirs across 5 floors.',
      icon: 'shopping',
      tag: 'Open daily',
    },
  ],
  location: 'Connected to T1, T2, T3 · Free shuttle to T4',
  hours: 'Open 24 hours (some shops vary)',
};

export const DINING_DATA = {
  terminal: 'T3',
  restaurants: [
    {
      name: 'Shake Shack',
      cuisine: 'American Burgers',
      location: 'T3, Level 1 (Departure)',
      hours: '6am–12am',
      priceRange: 'S$12–22',
    },
    {
      name: 'Din Tai Fung',
      cuisine: 'Taiwanese Dim Sum',
      location: 'Jewel, Level 2',
      hours: '10am–10pm',
      priceRange: 'S$18–35',
    },
    {
      name: 'PAUL Bakery',
      cuisine: 'French Café & Pastries',
      location: 'T3, Level 2 (Transit)',
      hours: '24 hours',
      priceRange: 'S$8–18',
    },
    {
      name: 'Poulet',
      cuisine: 'French Comfort Food',
      location: 'T3, Level 2 (Transit)',
      hours: '10am–10pm',
      priceRange: 'S$15–28',
    },
    {
      name: 'A&W',
      cuisine: 'Singapore Nostalgia',
      location: 'T3, Level B2 (Arrival)',
      hours: '24 hours',
      priceRange: 'S$6–12',
    },
  ],
};

export function extractFlightData(userId: string): typeof DEMO_FLIGHTS[0] {
  const conv = getConversation(userId);
  const allText = conv.join('\n').toLowerCase();

  for (const flight of DEMO_FLIGHTS) {
    const fn = flight.flightNo.toLowerCase().replace(' ', '');
    if (allText.includes(fn) || allText.includes(flight.flightNo.toLowerCase())) {
      return flight;
    }
  }
  // Default to first flight if no match
  return DEMO_FLIGHTS[0];
}

export function extractDiningTerminal(userId: string): typeof DINING_DATA {
  const conv = getConversation(userId);
  const allText = conv.join('\n').toLowerCase();

  const data = { ...DINING_DATA };
  if (allText.includes('t1') || allText.includes('terminal 1')) data.terminal = 'T1';
  else if (allText.includes('t2') || allText.includes('terminal 2')) data.terminal = 'T2';
  else if (allText.includes('t4') || allText.includes('terminal 4')) data.terminal = 'T4';
  else if (allText.includes('jewel')) data.terminal = 'Jewel';
  return data;
}
