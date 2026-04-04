import type { AgentPlugin, CardTrigger } from '../types';

// ─── Per-user state ─────────────────────────────────────────────────────────

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

// ─── Static card data ───────────────────────────────────────────────────────

const DEMO_FLIGHTS = [
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

const TRANSPORT_DATA = {
  destination: 'City Centre',
  options: [
    {
      mode: 'MRT',
      icon: 'mrt',
      label: 'East-West Line',
      detail: 'City Hall / Raffles Place',
      duration: '~30 min',
      price: 'S$2.10\u20132.50',
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
      duration: '25\u201335 min',
      price: '~S$20\u201335',
      tip: 'Door-to-door, higher at peak hours',
    },
  ],
};

const JEWEL_DATA = {
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
  location: 'Connected to T1, T2, T3 \u00B7 Free shuttle to T4',
  hours: 'Open 24 hours (some shops vary)',
};

const DINING_DATA = {
  terminal: 'T3',
  restaurants: [
    {
      name: 'Shake Shack',
      cuisine: 'American Burgers',
      location: 'T3, Level 1 (Departure)',
      hours: '6am\u201312am',
      priceRange: 'S$12\u201322',
    },
    {
      name: 'Din Tai Fung',
      cuisine: 'Taiwanese Dim Sum',
      location: 'Jewel, Level 2',
      hours: '10am\u201310pm',
      priceRange: 'S$18\u201335',
    },
    {
      name: 'PAUL Bakery',
      cuisine: 'French Caf\u00E9 & Pastries',
      location: 'T3, Level 2 (Transit)',
      hours: '24 hours',
      priceRange: 'S$8\u201318',
    },
    {
      name: 'Poulet',
      cuisine: 'French Comfort Food',
      location: 'T3, Level 2 (Transit)',
      hours: '10am\u201310pm',
      priceRange: 'S$15\u201328',
    },
    {
      name: 'A&W',
      cuisine: 'Singapore Nostalgia',
      location: 'T3, Level B2 (Arrival)',
      hours: '24 hours',
      priceRange: 'S$6\u201312',
    },
  ],
};

// ─── Data extraction helpers ────────────────────────────────────────────────

function extractFlightData(userId: string): typeof DEMO_FLIGHTS[0] {
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

function extractDiningTerminal(userId: string): typeof DINING_DATA {
  const conv = getConversation(userId);
  const allText = conv.join('\n').toLowerCase();

  const data = { ...DINING_DATA };
  if (allText.includes('t1') || allText.includes('terminal 1')) data.terminal = 'T1';
  else if (allText.includes('t2') || allText.includes('terminal 2')) data.terminal = 'T2';
  else if (allText.includes('t4') || allText.includes('terminal 4')) data.terminal = 'T4';
  else if (allText.includes('jewel')) data.terminal = 'Jewel';
  return data;
}

// ─── Display text helpers ───────────────────────────────────────────────────

/**
 * OpenClaw sometimes auto-continues when the user hasn't replied,
 * producing multiple conversation turns in a single response.
 * Extract only the first conversational turn — up to and including the first question.
 */
function truncateToFirstTurn(text: string): string {
  // Strip leaked internal instructions / agent directives
  const internalPatterns = [
    /User (?:hasn't responded|wants|said|asked)[^.?!]*\.?\s*/gi,
    /Provide (?:ordering|menu|coffee)[^.?!]*\.?\s*/gi,
    /No further action[^.?!]*\.?\s*/gi,
  ];
  let cleaned = text;
  for (const pat of internalPatterns) {
    cleaned = cleaned.replace(pat, '');
  }
  cleaned = cleaned.trim();
  if (!cleaned) return text;

  // Split into sentences by punctuation boundaries
  const sentenceRegex = /[^.?!。？！]*[.?!。？！]+/g;
  const sentences: string[] = [];
  let match;
  while ((match = sentenceRegex.exec(cleaned)) !== null) {
    const s = match[0].trim();
    if (s) sentences.push(s);
  }

  if (sentences.length === 0) return cleaned;
  if (sentences.length === 1) return sentences[0];

  // Collect sentences up to and including the first question, then stop.
  const result: string[] = [];
  for (const sentence of sentences) {
    result.push(sentence);
    if (/[?？]/.test(sentence)) break;
  }

  return result.join(' ');
}

// ─── System prompts ─────────────────────────────────────────────────────────

const AIRPORT_PROMPT = `You are ARIA, Changi Airport's warm and knowledgeable AI passenger assistant \u2014 powered by Tencent Cloud.

## CORE RULES
- Keep every response SHORT: 1-3 sentences max, then offer to show a card
- Be like a friendly local guide who knows every corner of the airport
- Proactively offer useful info the passenger didn't ask for
- Use these EXACT trigger phrases to show information cards (the system detects them):
  \u2192 Flight status: say "Here are your flight details" or "let me pull up your flight"
  \u2192 Transport: say "Here are your transport options" or "here's how to get there"
  \u2192 Jewel Changi: say "Here's what Jewel has to offer" or "let me show you Jewel"
  \u2192 Dining: say "Here are some dining options" or "here are some great restaurants"

## CHANGI AIRPORT KNOWLEDGE

### Terminals & Airlines
- T1: Singapore Airlines (regional), Silk Air, Star Alliance partners
- T2: Scoot, TigerAir, Jetstar, some SQ codeshare
- T3: Singapore Airlines mainline (SQ), Virgin Australia
- T4: Cathay Pacific, Vietnam Airlines, Korean Air, Malaysia Airlines, AirAsia
- Jewel: Connected to T1, T2, T3 via link bridges; free shuttle bus to T4

### Sample Flights (use these for demos)
- SQ 321  Singapore Airlines  T3 Gate C23  On Time    Dep 14:30  SIN\u2192LHR
- CX 759  Cathay Pacific      T4 Gate A12  Boarding   Dep 13:45  SIN\u2192HKG
- TR 608  Scoot               T2 Gate D15  Delayed    Dep 16:20  SIN\u2192BKK (+45min)
- QR 647  Qatar Airways       T1 Gate B08  On Time    Dep 18:00  SIN\u2192DOH

### Transport to City Centre
- MRT East-West Line: Changi Airport MRT \u2192 City Hall ~30 min \u00B7 S$2.10\u20132.50
- Changi Express (TEL): Direct to city, ~29 min \u00B7 S$5.00 (T2/T3 station)
- Bus 36: Direct to Orchard, ~60 min \u00B7 S$2.50
- Grab/Taxi: CBD ~25\u201335 min \u00B7 S$20\u201335 (peak hours higher)
- Hotel Shuttle: Most major hotels run dedicated shuttles (check hotel concierge)

### Key Destinations & Travel Time from Airport
- Orchard Road: MRT 40 min or Grab 25 min
- Marina Bay Sands / CBD: MRT 35 min (Bayfront station) or Grab 25 min
- Sentosa/Universal Studios: MRT + Sentosa Express ~50 min or Grab 30 min
- Little India / Chinatown: MRT ~40 min

### Jewel Changi (open daily, connected to T1/T2/T3)
- HSBC Rain Vortex: World's tallest indoor waterfall (40m) \u2014 light shows nightly at 7:30pm & 8:30pm
- Canopy Park (Level 5): Bouncing nets, Sky Nets Walk, Hedge Maze, Mirror Maze \u2014 from S$12
- Dining: 100+ restaurants \u2014 Din Tai Fung, Shake Shack, A&W, Five Guys, local hawker food
- Shopping: 280+ stores from luxury brands to Singapore souvenirs
- Forest Valley: 4-storey indoor garden with 2,000+ trees

### Airport Facilities
- Free WiFi: SingTel_Wifi_Auto (all terminals, no registration needed)
- Lounges: SilverKris (T1, T2, T3) \u00B7 Plaza Premium (T1, T2, T3, T4)
- Showers: All terminals, Level 2 Transit Area \u00B7 S$15 including towel
- Left Luggage: All terminals \u00B7 From S$5/hour per bag
- Free City Tours: 5.5hr or 2.5hr tours for transit passengers (min 5.5hr layover, register at T2/T3)
- Sleeping: Ambassador Transit Hotel in T1/T2/T3; Rest Zones (free) near gates
- Lost & Found: Tel 6542 1234 \u00B7 Counter at T1/T2/T3/T4 Arrival Halls

### Dining Highlights by Terminal
- T1: The Coffee Bean, Crystal Jade, Takashimaya Food Hall (B2)
- T2: Bacha Coffee, Burger King, Sushi Express
- T3: Shake Shack (L1), PAUL Bakery, Poulet, Ichiban Boshi
- T4: Canton Paradise, KFC, Starbucks
- Jewel: Din Tai Fung, Shake Shack, Five Guys, Tsuta (Michelin), Taiwanese night market food

## CONVERSATION FLOW

### Arrival (passenger just landed)
1. Greet warmly, ask if they need help with transport, directions, or have time to explore
2. Based on need: show transport card, or suggest Jewel if they have time

### Departure (passenger catching a flight)
1. Ask flight number
2. Confirm terminal/gate/status \u2192 show flight status card
3. If time permits \u2192 suggest Jewel or dining

### Transit (connecting flight)
1. Ask layover duration
2. <5.5hrs: Jewel card + dining recommendations
3. >5.5hrs: Offer free city tour info + Jewel card

## LANGUAGE
- Default: English. Switch to Chinese/Malay/Tamil/Japanese/Korean if passenger uses it.`;

const VOICE_SYSTEM_PROMPT = `You are ARIA, Changi Airport's AI passenger assistant. Keep responses SHORT (1-2 sentences). Be a friendly local guide who knows every corner of the airport. Help with flights, transport, Jewel Changi, dining, and facilities. Sample flights: SQ 321 (T3, Gate C23, On Time, 14:30), CX 759 (T4, Gate A12, Boarding, 13:45), TR 608 (T2, Gate D15, Delayed +45min, 16:20), QR 647 (T1, Gate B08, On Time, 18:00). Transport: MRT EW Line to City Hall ~30min S$2.50, Grab/Taxi to CBD ~25-35min S$20-35, Bus 36 ~60min S$2.50. Jewel: Rain Vortex (40m waterfall, light shows 7:30pm/8:30pm), Canopy Park, 100+ dining, 280+ retail. Default English, switch to other languages if passenger uses them.`;

const VOICE_WELCOME_MESSAGE = "Welcome to Changi Airport! I'm ARIA, your AI passenger assistant. How can I help you today \u2014 are you arriving, departing, or in transit?";

// ─── Card detection ─────────────────────────────────────────────────────────

function detectAirportCardTrigger(userId: string, displayReply: string): CardTrigger | null {
  const shownCards = getShownCards(userId);
  const lower = displayReply.toLowerCase();

  // Flight status card — only trigger on explicit phrases from the system prompt
  // Avoid: hardcoded flight numbers, generic words like "on time", "boarding"
  const isFlight = (
    lower.includes('here are your flight details') ||
    lower.includes('let me pull up your flight') ||
    (lower.includes('flight') && lower.includes('gate') && lower.includes('terminal'))
  );
  if (isFlight && !shownCards.has('flight')) {
    shownCards.add('flight');
    return {
      type: 'flight_status_card',
      data: extractFlightData(userId),
      description: 'Flight status information',
    };
  }

  // Transport card — explicit trigger phrases + compound conditions only
  const isTransport = (
    lower.includes('here are your transport options') ||
    lower.includes("here's how to get there") ||
    lower.includes('transport options') ||
    (lower.includes('take the mrt') && (lower.includes('min') || lower.includes('station'))) ||
    (lower.includes('mrt') && lower.includes('grab') && lower.includes('min'))
  );
  if (isTransport && !shownCards.has('transport')) {
    shownCards.add('transport');
    return {
      type: 'transport_card',
      data: TRANSPORT_DATA,
      description: 'Transport options to city centre',
    };
  }

  // Jewel card — explicit trigger phrases + Jewel-specific landmarks
  const isJewel = (
    lower.includes("here's what jewel has to offer") ||
    lower.includes('let me show you jewel') ||
    (lower.includes('jewel changi') && (lower.includes('rain vortex') || lower.includes('canopy') || lower.includes('shopping') || lower.includes('dining'))) ||
    lower.includes('rain vortex')
  );
  if (isJewel && !shownCards.has('jewel')) {
    shownCards.add('jewel');
    return {
      type: 'jewel_card',
      data: JEWEL_DATA,
      description: 'Jewel Changi highlights',
    };
  }

  // Dining card — explicit trigger phrases + compound conditions
  const isDining = (
    lower.includes('here are some dining options') ||
    lower.includes('here are some great restaurants') ||
    lower.includes('here are great places to eat') ||
    (lower.includes('dining options') && (lower.includes('terminal') || lower.includes('jewel'))) ||
    (lower.includes('restaurant') && lower.includes('terminal') && lower.includes('recommend'))
  );
  if (isDining && !shownCards.has('dining')) {
    shownCards.add('dining');
    return {
      type: 'dining_card',
      data: extractDiningTerminal(userId),
      description: 'Dining recommendations',
    };
  }

  return null;
}

// ─── Agent Plugin ───────────────────────────────────────────────────────────

export const airportAgent: AgentPlugin = {
  id: 'airport',
  name: 'Changi Airport',
  subtitle: 'AI Passenger Assistant',
  icon: 'airport',
  themeColor: '#00693E',

  textSystemPrompt: AIRPORT_PROMPT,
  voiceSystemPrompt: VOICE_SYSTEM_PROMPT,
  voiceWelcomeMessage: VOICE_WELCOME_MESSAGE,

  trackMessage(userId: string, role: 'user' | 'assistant', text: string): void {
    const conv = getConversation(userId);
    conv.push(`${role}: ${text}`);
    if (conv.length > 20) conv.shift();
  },

  detectCard(userId: string, reply: string): CardTrigger | null {
    return detectAirportCardTrigger(userId, reply);
  },

  cleanDisplayText(text: string): string {
    let display = text;

    // Remove markdown bold
    display = display.replace(/\*\*/g, '');

    // Normalize bullets to newlines
    display = display.replace(/\s*[*\u2022]\s+/g, '\n');

    // Collapse whitespace
    display = display.replace(/\s{2,}/g, ' ').trim();

    // Truncate auto-continued OpenClaw responses to first turn
    display = truncateToFirstTurn(display);

    return display || 'Sorry, I could not process that.';
  },

  resetSession(userId: string): void {
    userShownCards.delete(userId);
    userConversations.delete(userId);
  },
};
