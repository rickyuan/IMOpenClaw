/**
 * Barista Agent Plugin — QuickCafe AI Barista
 *
 * Self-contained agent implementing AgentPlugin.
 * Contains all barista-specific logic: system prompts, card detection,
 * order extraction, display text cleaning, menu data, and session state.
 */

import type { AgentPlugin, CardTrigger } from '../types';

// ─── System Prompts ─────────────────────────────────────────────────────

const TEXT_SYSTEM_PROMPT = `You are Bella, a cheerful AI barista for QuickCafé — a coffee ordering assistant powered by Tencent Cloud.

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

const VOICE_SYSTEM_PROMPT = `You are Bella, a cheerful AI barista for QuickCafé. Guide the customer through ordering coffee in a natural, friendly voice conversation. Keep responses SHORT (1-2 sentences). Sound like a real barista. Follow the ordering flow: greet → ask what they want → size/temp → milk/sugar → confirm order with price → delivery or pickup → confirmed. Menu: Espresso $4.50/$5.80, Americano $5.00/$6.30, Latte $6.50/$7.80, Cappuccino $6.50/$7.80, Mocha $7.00/$8.30. Always apply DEVDAY promo (free upsize). Default English, switch to Chinese if customer speaks Chinese.`;

const VOICE_WELCOME_MESSAGE = "Hey! Welcome to QuickCafé! I'm Bella, your AI barista. I've sent our menu to your chat — what catches your eye?";

// ─── Menu Data ──────────────────────────────────────────────────────────

const MENU_DATA = {
  items: [
    { name: 'Espresso', desc: 'Bold & classic', priceR: 4.50, priceL: 5.80 },
    { name: 'Americano', desc: 'Smooth & balanced', priceR: 5.00, priceL: 6.30 },
    { name: 'Latte', desc: 'Creamy favorite', priceR: 6.50, priceL: 7.80 },
    { name: 'Cappuccino', desc: 'Frothy & rich', priceR: 6.50, priceL: 7.80 },
    { name: 'Mocha', desc: 'Chocolate bliss', priceR: 7.00, priceL: 8.30 },
  ],
};

// ─── Menu Prices (for order total calculation) ──────────────────────────

const MENU_PRICES: Record<string, { regular: number; large: number }> = {
  Espresso: { regular: 4.50, large: 5.80 },
  Americano: { regular: 5.00, large: 6.30 },
  Latte: { regular: 6.50, large: 7.80 },
  Cappuccino: { regular: 6.50, large: 7.80 },
  Mocha: { regular: 7.00, large: 8.30 },
  Matcha: { regular: 7.00, large: 8.30 },
};

// ─── Per-User State ─────────────────────────────────────────────────────

/** Tracks which card types have been shown per user (reset on new session / new order) */
const userShownCards = new Map<string, Set<string>>();

/** Tracks conversation history per user for order extraction */
const userConversations = new Map<string, string[]>();

function getShownCards(userId: string): Set<string> {
  if (!userShownCards.has(userId)) userShownCards.set(userId, new Set());
  return userShownCards.get(userId)!;
}

function getConversation(userId: string): string[] {
  if (!userConversations.has(userId)) userConversations.set(userId, []);
  return userConversations.get(userId)!;
}

// ─── Order Extraction ───────────────────────────────────────────────────

interface OrderDetails {
  drink: string;
  size: string;
  temp: string;
  milk: string;
  sugar: string;
  price: number;
  total: number;
  promo: string;
}

interface ConfirmationDetails {
  orderNo: string;
  drink: string;
  eta: number;
  total: number;
}

function extractOrderDetails(userId: string): OrderDetails {
  const conv = getConversation(userId);

  const order: OrderDetails = {
    drink: 'Latte',
    size: 'Large',
    temp: 'Iced',
    milk: 'Regular milk',
    sugar: 'Regular',
    price: 6.50,
    total: 6.50,
    promo: 'DEVDAY Promo — Free upsize!',
  };

  const userMessages = conv.filter(m => m.startsWith('user:')).join('\n').toLowerCase();
  const aiMessages = conv.filter(m => m.startsWith('assistant:')).join('\n').toLowerCase();
  const drinks = ['espresso', 'americano', 'latte', 'cappuccino', 'mocha', 'matcha'];

  // Extract drink — prioritize user messages, then AI confirmation
  let drinkFound = false;
  for (const d of drinks) {
    if (userMessages.includes(d)) {
      order.drink = d.charAt(0).toUpperCase() + d.slice(1);
      drinkFound = true;
    }
  }
  if (!drinkFound) {
    for (const d of drinks) {
      const confirmPattern = new RegExp(`(?:got it|order|confirmed|your).*${d}`, 'i');
      if (confirmPattern.test(aiMessages)) {
        order.drink = d.charAt(0).toUpperCase() + d.slice(1);
      }
    }
  }

  // Chinese drink names
  const cnDrinkMap: Record<string, string> = {
    '美式': 'Americano', '拿铁': 'Latte', '卡布奇诺': 'Cappuccino',
    '摩卡': 'Mocha', '抹茶': 'Matcha', '浓缩': 'Espresso',
  };
  for (const [cn, en] of Object.entries(cnDrinkMap)) {
    if (userMessages.includes(cn)) order.drink = en;
  }

  // Extract size
  const allText = conv.join('\n').toLowerCase();
  if (userMessages.includes('large') || userMessages.includes('大')) order.size = 'Large';
  else if (userMessages.includes('regular') || userMessages.includes('常规') || userMessages.includes('中')) order.size = 'Regular';
  else if (allText.includes('large')) order.size = 'Large';

  // Extract temp
  if (userMessages.includes('iced') || userMessages.includes('ice') || userMessages.includes('冰')) order.temp = 'Iced';
  else if (userMessages.includes('hot') || userMessages.includes('热')) order.temp = 'Hot';
  else if (allText.includes('iced') || allText.includes('ice')) order.temp = 'Iced';
  else if (allText.includes('hot')) order.temp = 'Hot';

  // Extract milk
  if (allText.includes('oat') || allText.includes('燕麦')) order.milk = 'Oat milk';
  else if (allText.includes('soy') || allText.includes('豆')) order.milk = 'Soy milk';

  // Extract sugar
  if (allText.includes('no sugar') || allText.includes('不要糖') || allText.includes('无糖')) order.sugar = 'No sugar';
  else if (allText.includes('less sugar') || allText.includes('少糖')) order.sugar = 'Less sugar';

  // Calculate price (DEVDAY promo: charge regular price, give Large)
  const priceEntry = MENU_PRICES[order.drink];
  if (priceEntry) {
    order.price = priceEntry.regular;
    order.total = priceEntry.regular;
    order.size = 'Large'; // Always upsize with promo
  }

  // Milk surcharge
  if (order.milk === 'Oat milk' || order.milk === 'Soy milk') {
    order.total += 0.80;
    order.price += 0.80;
  }

  return order;
}

function buildConfirmationDetails(userId: string, order: OrderDetails): ConfirmationDetails {
  return {
    orderNo: 'QC-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    drink: `${order.size} ${order.temp} ${order.drink}`,
    eta: 10,
    total: order.total,
  };
}

// ─── Card Detection ─────────────────────────────────────────────────────

type BaristaCardType = 'menu_card' | 'order_card' | 'confirmation_card';

/**
 * Detect which card to show based on the current AI reply.
 * Each card triggers independently — no sequential dependency.
 * Uses a shown-cards set to prevent duplicate cards within the same ordering flow.
 */
function detectCardType(userId: string, reply: string): BaristaCardType | null {
  const shownCards = getShownCards(userId);
  const lower = reply.toLowerCase();

  // Step 5: Confirmation — AI says order is confirmed / on its way / enjoy
  // Check FIRST because confirmation phrases are the most specific.
  // Require order-specific context to avoid false positives.
  const isConfirmation = (
    lower.includes('order is confirmed') ||
    lower.includes('order confirmed') ||
    lower.includes('on its way') ||
    lower.includes('enjoy your coffee') ||
    lower.includes('enjoy your drink') ||
    (lower.includes('all set') && (lower.includes('order') || lower.includes('coffee') || lower.includes('delivery') || lower.includes('pickup'))) ||
    lower.includes('has been placed') ||
    lower.includes('order is placed') ||
    lower.includes('set for delivery') ||
    lower.includes('set for pickup') ||
    (lower.includes('ready in') && lower.includes('minute')) ||
    lower.includes('已确认') ||
    lower.includes('正在准备') ||
    lower.includes('马上就好')
  );
  if (isConfirmation && !shownCards.has('confirmation')) {
    shownCards.add('confirmation');
    return 'confirmation_card';
  }

  // Step 4: Order summary — AI asks delivery or pickup
  const isOrderSummary = (
    lower.includes('delivery or pickup') ||
    lower.includes('外送还是自取') ||
    lower.includes('配送还是自取')
  );
  if (isOrderSummary && !shownCards.has('order')) {
    shownCards.add('order');
    return 'order_card';
  }

  // Step 1: Menu — AI asks what drink / shows menu
  const isMenuStep = (
    lower.includes('menu') ||
    (lower.includes('which') && (lower.includes('coffee') || lower.includes('drink'))) ||
    (lower.includes('what') && lower.includes('like') && (lower.includes('coffee') || lower.includes('drink'))) ||
    lower.includes('哪种咖啡') ||
    lower.includes('想要什么咖啡') ||
    lower.includes('想喝什么') ||
    lower.includes('想要哪种')
  );
  if (isMenuStep) {
    // Reset all cards on new menu — supports multiple orders in one session
    shownCards.clear();
    shownCards.add('menu');
    return 'menu_card';
  }

  return null;
}

// ─── Display Text Cleaning ──────────────────────────────────────────────

/**
 * OpenClaw Agent sometimes auto-continues when the user doesn't reply,
 * producing multiple conversation steps in a single response.
 * This extracts only the first conversational turn — up to and including the first question.
 *
 * Also strips leaked internal instructions like "User wants coffee. Provide ordering flow."
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

/**
 * Clean up LLM text replies for IM display.
 * IM TIMTextElem doesn't render markdown, and order details are shown via cards.
 *
 * Aggressively removes all structured/order data patterns, then cleans up artifacts.
 */
function stripMarkdownSummary(text: string): string {
  let r = text;

  // 1. Remove markdown bold
  r = r.replace(/\*\*/g, '');

  // 2. Remove bullet items with order keys
  r = r.replace(/\s*[*•]\s*(?:Drink|Size|Temp|Temperature|Sweetness|Sugar|Milk|Price|Total|Order)[^.!?？。！*•]*[.!?]?\s*/gi, ' ');
  r = r.replace(/\s*[*•]\s*Delivery\s*[–—-]\s*ETA[^.!?？。！*•]*[.!?]?\s*/gi, ' ');
  r = r.replace(/\s*[*•]+\s*\.?\s*(?:\d{2}\s*\([^)]*\))?/g, ' ');

  // 3. Remove "Order Summary" headers
  r = r.replace(/Order Summary\s*/gi, '');
  r = r.replace(/订单[摘总]要\s*/gi, '');

  // 4. Remove "Key: Value" or "Key – Value" inline patterns
  const keys = 'Drink|Size|Temperature|Temp|Sweetness|Sugar|Milk|Price|Total';
  r = r.replace(new RegExp(`(?:${keys})\\s*[:：–—]\\s*[^.!?？。！]*`, 'gi'), ' ');

  // 5. Remove "Delivery – ETA about X minutes" inline
  r = r.replace(/Delivery\s*[–—-]\s*ETA[^.!?？。！]*/gi, ' ');

  // 6. Remove dash-separated order lines
  r = r.replace(/(?:Espresso|Americano|Latte|Cappuccino|Mocha|Matcha)\s*[–—-]\s*(?:Regular|Large)[^.!?？。！]*/gi, ' ');

  // 7. Remove orphaned price fragments
  r = r.replace(/\$?\d*\.?\d{2}\s*\([^)]*\)/g, ' ');
  r = r.replace(/\$\d+\.\d{2}/g, ' ');
  r = r.replace(/(?<![a-zA-Z\d])\d{2}(?![a-zA-Z\d])/g, ' ');

  // 8. Remove leftover artifacts
  r = r.replace(/\[\s*\]/g, '');
  r = r.replace(/\(\s*\)/g, '');
  r = r.replace(/\s*\.\s*(?=\s|$)/g, '');

  // 9. Final whitespace / punctuation cleanup
  r = r.replace(/\s{2,}/g, ' ');
  r = r.replace(/\.\s*\./g, '.');
  r = r.replace(/,\s*,/g, ',');
  r = r.replace(/\s+([.!?,?？。！])/g, '$1');
  r = r.replace(/^[!.,;:\s]+/, '');
  r = r.trim();

  return r;
}

// ─── Agent Plugin Export ────────────────────────────────────────────────

export const baristaAgent: AgentPlugin = {
  id: 'barista',
  name: 'QuickCafe',
  subtitle: 'AI Barista',
  icon: 'coffee',
  themeColor: '#6F4E37',

  textSystemPrompt: TEXT_SYSTEM_PROMPT,
  voiceSystemPrompt: VOICE_SYSTEM_PROMPT,
  voiceWelcomeMessage: VOICE_WELCOME_MESSAGE,

  trackMessage(userId: string, role: 'user' | 'assistant', text: string): void {
    const conv = getConversation(userId);
    conv.push(`${role}: ${text}`);
    // Keep last 20 messages
    if (conv.length > 20) conv.shift();
  },

  detectCard(userId: string, reply: string): CardTrigger | null {
    const cardType = detectCardType(userId, reply);
    if (!cardType) return null;

    if (cardType === 'menu_card') {
      return {
        type: 'menu_card',
        data: MENU_DATA,
        description: 'QuickCafe Menu',
      };
    }

    if (cardType === 'order_card') {
      const order = extractOrderDetails(userId);
      return {
        type: 'order_card',
        data: order,
        description: 'Order Summary',
      };
    }

    if (cardType === 'confirmation_card') {
      const order = extractOrderDetails(userId);
      const confirmation = buildConfirmationDetails(userId, order);
      return {
        type: 'confirmation_card',
        data: confirmation,
        description: 'Order Confirmed',
      };
    }

    return null;
  },

  cleanDisplayText(text: string): string {
    let result = truncateToFirstTurn(text);
    result = stripMarkdownSummary(result);
    return result || text;
  },

  resetSession(userId: string): void {
    userShownCards.delete(userId);
    userConversations.delete(userId);
  },
};
