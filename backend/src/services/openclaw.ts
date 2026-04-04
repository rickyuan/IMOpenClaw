export interface LLMModelConfig {
  id: string;
  name: string;
  model: string;
  apiUrl: string;
  apiKey: string;
  isOpenClaw?: boolean; // OpenClaw on Lighthouse — manages its own session & system prompt
}

// ─── Agent definitions ───────────────────────────────────────────────
export type AgentId = 'barista' | 'medical' | 'airport';

export interface AgentDef {
  id: AgentId;
  name: string;
  subtitle: string;
  icon: string; // emoji or short label for frontend
}

export const AGENTS: AgentDef[] = [
  { id: 'barista', name: 'QuickCafe', subtitle: 'AI Barista Demo', icon: 'coffee' },
  { id: 'medical', name: 'Doctor Anywhere', subtitle: 'AI Healthcare Assistant', icon: 'medical' },
  { id: 'airport', name: 'Changi Airport', subtitle: 'AI Passenger Assistant', icon: 'airport' },
];

// Per-user agent selection (in-memory)
const userAgentSelection = new Map<string, AgentId>();

export function setUserAgent(userId: string, agentId: AgentId): void {
  userAgentSelection.set(userId, agentId);
}

export function getUserAgent(userId: string): AgentId {
  return userAgentSelection.get(userId) || 'barista';
}

// Load model configs from env vars (LLM_1_*, LLM_2_*, LLM_3_*, ...)
export function getModelConfigs(): LLMModelConfig[] {
  const models: LLMModelConfig[] = [];
  for (let i = 1; ; i++) {
    const model = process.env[`LLM_${i}_MODEL`];
    if (!model) break;
    models.push({
      id: String(i),
      name: process.env[`LLM_${i}_NAME`] || model,
      model,
      apiUrl: process.env[`LLM_${i}_API_URL`]!,
      apiKey: process.env[`LLM_${i}_API_KEY`]!,
      isOpenClaw: model.startsWith('openclaw:'),
    });
  }
  return models;
}

// Per-user model selection (in-memory)
const userModelSelection = new Map<string, string>();

export function setUserModel(userId: string, modelId: string): void {
  userModelSelection.set(userId, modelId);
}

export function getUserModel(userId: string): string {
  return userModelSelection.get(userId) || process.env.LLM_DEFAULT || '1';
}

function getConfigForUser(userId: string): LLMModelConfig {
  const modelId = getUserModel(userId);
  const configs = getModelConfigs();
  return configs.find(c => c.id === modelId) || configs[0];
}

// Per-user conversation history for stateless models (non-OpenClaw)
const userChatHistory = new Map<string, Array<{ role: string; content: string }>>();

function getChatHistory(userId: string): Array<{ role: string; content: string }> {
  if (!userChatHistory.has(userId)) userChatHistory.set(userId, []);
  return userChatHistory.get(userId)!;
}

export function clearChatHistory(userId: string): void {
  userChatHistory.delete(userId);
}

// ─── System prompts per agent ────────────────────────────────────────

const BARISTA_PROMPT = `You are Bella, a cheerful AI barista for QuickCafé — a coffee ordering assistant powered by Tencent Cloud.

## CORE RULES
- You guide the customer through ordering coffee in a natural, friendly conversation
- Keep every response SHORT: 1-3 sentences max
- Sound like a real barista, not a robot: "Great choice!", "Coming right up!"
- Follow the ordering flow step by step — don't skip ahead or ask multiple questions at once

## ORDERING FLOW (follow this sequence strictly)

### Step 1: Greet & Ask What They'd Like
- Greet them warmly, ask what type of coffee they'd like

### Step 2: Confirm Choice & Ask Customization
- Confirm the choice enthusiastically
- Ask about size (Regular or Large) and Hot or Iced

### Step 3: Ask About Milk & Sweetness
- Ask milk preference (regular, oat +$0.80, or soy +$0.80) and sugar level (Regular, Less, None)

### Step 4: Confirm & Place Order
- Summarize the complete order with price
- ALWAYS apply the DEVDAY promo: free upsize to Large
- Ask delivery or pickup

Menu prices: Espresso $4.50/$5.80, Americano $5.00/$6.30, Latte $6.50/$7.80, Cappuccino $6.50/$7.80, Mocha $7.00/$8.30

### Step 5: Order Confirmed
- Confirm order placed, ETA ~10 minutes, end warmly

## EDGE CASES
- "What's good?" → Recommend Latte (most popular)
- Not on menu → Suggest Matcha Latte
- Change mind → "No problem! What would you like instead?"
- Non-coffee questions → Gently redirect

## LANGUAGE
- Default: English. If customer speaks Chinese: switch to Chinese.`;

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

const AIRPORT_PROMPT = `You are ARIA, Changi Airport's warm and knowledgeable AI passenger assistant — powered by Tencent Cloud.

## CORE RULES
- Keep every response SHORT: 1-3 sentences max, then offer to show a card
- Be like a friendly local guide who knows every corner of the airport
- Proactively offer useful info the passenger didn't ask for
- Use these EXACT trigger phrases to show information cards (the system detects them):
  → Flight status: say "Here are your flight details" or "let me pull up your flight"
  → Transport: say "Here are your transport options" or "here's how to get there"
  → Jewel Changi: say "Here's what Jewel has to offer" or "let me show you Jewel"
  → Dining: say "Here are some dining options" or "here are some great restaurants"

## CHANGI AIRPORT KNOWLEDGE

### Terminals & Airlines
- T1: Singapore Airlines (regional), Silk Air, Star Alliance partners
- T2: Scoot, TigerAir, Jetstar, some SQ codeshare
- T3: Singapore Airlines mainline (SQ), Virgin Australia
- T4: Cathay Pacific, Vietnam Airlines, Korean Air, Malaysia Airlines, AirAsia
- Jewel: Connected to T1, T2, T3 via link bridges; free shuttle bus to T4

### Sample Flights (use these for demos)
- SQ 321  Singapore Airlines  T3 Gate C23  On Time    Dep 14:30  SIN→LHR
- CX 759  Cathay Pacific      T4 Gate A12  Boarding   Dep 13:45  SIN→HKG
- TR 608  Scoot               T2 Gate D15  Delayed    Dep 16:20  SIN→BKK (+45min)
- QR 647  Qatar Airways       T1 Gate B08  On Time    Dep 18:00  SIN→DOH

### Transport to City Centre
- MRT East-West Line: Changi Airport MRT → City Hall ~30 min · S$2.10–2.50
- Changi Express (TEL): Direct to city, ~29 min · S$5.00 (T2/T3 station)
- Bus 36: Direct to Orchard, ~60 min · S$2.50
- Grab/Taxi: CBD ~25–35 min · S$20–35 (peak hours higher)
- Hotel Shuttle: Most major hotels run dedicated shuttles (check hotel concierge)

### Key Destinations & Travel Time from Airport
- Orchard Road: MRT 40 min or Grab 25 min
- Marina Bay Sands / CBD: MRT 35 min (Bayfront station) or Grab 25 min
- Sentosa/Universal Studios: MRT + Sentosa Express ~50 min or Grab 30 min
- Little India / Chinatown: MRT ~40 min

### Jewel Changi (open daily, connected to T1/T2/T3)
- HSBC Rain Vortex: World's tallest indoor waterfall (40m) — light shows nightly at 7:30pm & 8:30pm
- Canopy Park (Level 5): Bouncing nets, Sky Nets Walk, Hedge Maze, Mirror Maze — from S$12
- Dining: 100+ restaurants — Din Tai Fung, Shake Shack, A&W, Five Guys, local hawker food
- Shopping: 280+ stores from luxury brands to Singapore souvenirs
- Forest Valley: 4-storey indoor garden with 2,000+ trees

### Airport Facilities
- Free WiFi: SingTel_Wifi_Auto (all terminals, no registration needed)
- Lounges: SilverKris (T1, T2, T3) · Plaza Premium (T1, T2, T3, T4)
- Showers: All terminals, Level 2 Transit Area · S$15 including towel
- Left Luggage: All terminals · From S$5/hour per bag
- Free City Tours: 5.5hr or 2.5hr tours for transit passengers (min 5.5hr layover, register at T2/T3)
- Sleeping: Ambassador Transit Hotel in T1/T2/T3; Rest Zones (free) near gates
- Lost & Found: Tel 6542 1234 · Counter at T1/T2/T3/T4 Arrival Halls

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
2. Confirm terminal/gate/status → show flight status card
3. If time permits → suggest Jewel or dining

### Transit (connecting flight)
1. Ask layover duration
2. <5.5hrs: Jewel card + dining recommendations
3. >5.5hrs: Offer free city tour info + Jewel card

## LANGUAGE
- Default: English. Switch to Chinese/Malay/Tamil/Japanese/Korean if passenger uses it.`;

function getSystemPrompt(agentId: AgentId): string {
  if (agentId === 'medical') return MEDICAL_PROMPT;
  if (agentId === 'airport') return AIRPORT_PROMPT;
  return BARISTA_PROMPT;
}

/**
 * OpenClaw Agent sometimes auto-continues when the user doesn't reply,
 * producing multiple conversation steps in a single response (even on a single line).
 * This extracts only the first conversational turn — up to and including the first question.
 *
 * Also strips leaked internal instructions like "User wants coffee. Provide ordering flow."
 *
 * Example input:
 *   "Would you like Regular or Large?Got it—Regular. How about sweetness?Got it—placing order."
 * Output:
 *   "Would you like Regular or Large?"
 */
function truncateToFirstTurn(text: string): string {
  // First, strip leaked internal instructions / agent directives
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

  // Split into sentences by punctuation boundaries (works even without newlines).
  // Match sentences ending in . ? ! 。？！ followed by optional space.
  const sentenceRegex = /[^.?!。？！]*[.?!。？！]+/g;
  const sentences: string[] = [];
  let match;
  while ((match = sentenceRegex.exec(cleaned)) !== null) {
    const s = match[0].trim();
    if (s) sentences.push(s);
  }

  if (sentences.length === 0) return cleaned;
  if (sentences.length === 1) return sentences[0];

  // Strictly collect sentences up to and including the first question, then stop.
  // This prevents OpenClaw's auto-continued turns from leaking into the display.
  const result: string[] = [];
  for (const sentence of sentences) {
    result.push(sentence);
    if (/[?？]/.test(sentence)) break;
  }

  return result.join(' ');
}

/**
 * Clean up LLM text replies for IM display.
 * IM TIMTextElem doesn't render markdown, and order details are shown via cards.
 *
 * Strategy: aggressively remove all structured/order data patterns first,
 * then clean up leftover artifacts.
 */
function stripMarkdownSummary(text: string): string {
  let r = text;

  // 1. Remove markdown bold
  r = r.replace(/\*\*/g, '');

  // 2. Remove bullet items with order keys: "* Drink: ..." "* Delivery – ETA ..."
  //    Use non-greedy match up to the next bullet or sentence-ending punctuation
  r = r.replace(/\s*[*•]\s*(?:Drink|Size|Temp|Temperature|Sweetness|Sugar|Milk|Price|Total|Order)[^.!?？。！*•]*[.!?]?\s*/gi, ' ');
  r = r.replace(/\s*[*•]\s*Delivery\s*[–—-]\s*ETA[^.!?？。！*•]*[.!?]?\s*/gi, ' ');
  // Catch remaining bullet noise: "* ." or "* 00 (...)"
  r = r.replace(/\s*[*•]+\s*\.?\s*(?:\d{2}\s*\([^)]*\))?/g, ' ');

  // 3. Remove "Order Summary" headers
  r = r.replace(/Order Summary\s*/gi, '');
  r = r.replace(/订单[摘总]要\s*/gi, '');

  // 4. Remove "Key: Value" or "Key – Value" inline patterns
  const keys = 'Drink|Size|Temperature|Temp|Sweetness|Sugar|Milk|Price|Total';
  r = r.replace(new RegExp(`(?:${keys})\\s*[:：–—]\\s*[^.!?？。！]*`, 'gi'), ' ');

  // 5. Remove "Delivery – ETA about X minutes" inline
  r = r.replace(/Delivery\s*[–—-]\s*ETA[^.!?？。！]*/gi, ' ');

  // 6. Remove dash-separated order lines: "Americano – Large (...) – Hot – No sugar"
  r = r.replace(/(?:Espresso|Americano|Latte|Cappuccino|Mocha|Matcha)\s*[–—-]\s*(?:Regular|Large)[^.!?？。！]*/gi, ' ');

  // 7. Remove orphaned price fragments: ".00 (regular price...)", "$5.00 (...)", standalone "$5.00" or "00"
  r = r.replace(/\$?\d*\.?\d{2}\s*\([^)]*\)/g, ' ');
  r = r.replace(/\$\d+\.\d{2}/g, ' ');
  r = r.replace(/(?<![a-zA-Z\d])\d{2}(?![a-zA-Z\d])/g, ' '); // orphaned 2-digit numbers like "00"

  // 8. Remove leftover artifacts
  r = r.replace(/\[\s*\]/g, '');          // empty brackets
  r = r.replace(/\(\s*\)/g, '');          // empty parens
  r = r.replace(/\s*\.\s*(?=\s|$)/g, ''); // orphaned dots

  // 9. Final whitespace / punctuation cleanup
  r = r.replace(/\s{2,}/g, ' ');
  r = r.replace(/\.\s*\./g, '.');
  r = r.replace(/,\s*,/g, ',');
  r = r.replace(/\s+([.!?,?？。！])/g, '$1');
  r = r.replace(/^[!.,;:\s]+/, '');   // leading orphan punctuation
  r = r.trim();

  return r;
}

export interface LLMReply {
  raw: string;      // Full AI reply (for card detection / tracking)
  display: string;  // Cleaned reply (for sending to user via IM)
}

export async function callOpenClaw(message: string, userId: string): Promise<LLMReply> {
  const config = getConfigForUser(userId);
  const agentId = getUserAgent(userId);
  console.log(`[LLM] User ${userId} agent=${agentId} model: ${config.name} (${config.model}) isOpenClaw=${!!config.isOpenClaw}`);

  let body: Record<string, any>;

  if (config.isOpenClaw) {
    body = {
      model: config.model,
      user: userId,
      messages: [
        { role: 'user', content: message },
      ],
    };
  } else {
    const history = getChatHistory(userId);
    history.push({ role: 'user', content: message });
    while (history.length > 20) history.shift();

    body = {
      model: config.model,
      messages: [
        { role: 'system', content: getSystemPrompt(agentId) },
        ...history,
      ],
    };
  }

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`LLM API error: ${response.status} ${response.statusText}`, errText);
    return { raw: '', display: 'Sorry, I could not process that request.' };
  }

  const data: any = await response.json();
  let raw = data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';

  // Light cleanup on raw (remove NO_REPLY but keep content intact for card detection)
  raw = raw.replace(/NO_REPLY/g, '').replace(/User hasn't responded\. No further action\./g, '').trim();
  raw = raw.replace(/\.\s*\./g, '.').replace(/\s{2,}/g, ' ').trim();

  // Build display version: truncate + strip markdown
  let display = raw;

  if (config.isOpenClaw) {
    display = truncateToFirstTurn(display);
  }

  if (agentId === 'barista') {
    display = stripMarkdownSummary(display);
  } else {
    // Light markdown cleanup for non-barista agents
    display = display.replace(/\*\*/g, '');
    display = display.replace(/\s*[*•]\s+/g, '\n');
    display = display.replace(/\s{2,}/g, ' ').trim();
  }

  if (config.isOpenClaw && agentId !== 'barista') {
    display = truncateToFirstTurn(display);
  }
  display = display || 'Sorry, I could not process that.';

  // For stateless models, track assistant reply in history
  if (!config.isOpenClaw) {
    const history = getChatHistory(userId);
    history.push({ role: 'assistant', content: display });
  }

  return { raw, display };
}
