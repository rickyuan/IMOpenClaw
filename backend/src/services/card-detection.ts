// Per-user conversation context & card detection for text chat IM cards

// Track which cards have been shown per user (reset on new session)
const userShownCards = new Map<string, Set<string>>();
// Track conversation history per user for order extraction
const userConversations = new Map<string, string[]>();

export function resetUserCards(userId: string): void {
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

export function trackMessage(userId: string, role: 'user' | 'assistant', text: string): void {
  const conv = getConversation(userId);
  conv.push(`${role}: ${text}`);
  // Keep last 20 messages
  if (conv.length > 20) conv.shift();
}

/**
 * Detect which card to show based on the CURRENT conversation step.
 *
 * No sequential dependency — each card triggers independently based on
 * what the AI is saying RIGHT NOW. This avoids chain-breaking issues where
 * stripping markdown from display text removes keywords needed by later cards.
 *
 * Also uses a cooldown to prevent duplicate cards within the same ordering flow.
 */
export function detectCardTrigger(userId: string, displayReply: string): 'menu_card' | 'order_card' | 'confirmation_card' | null {
  const shownCards = getShownCards(userId);
  const lower = displayReply.toLowerCase();

  // Step 5: Confirmation — AI says order is confirmed / on its way / enjoy
  // Check FIRST because confirmation phrases are the most specific.
  const isConfirmation = (
    lower.includes('confirmed') ||
    lower.includes('on its way') ||
    lower.includes('enjoy your coffee') ||
    lower.includes('enjoy!') ||
    lower.includes('all set') ||
    lower.includes('has been placed') ||
    lower.includes('order is placed') ||
    lower.includes('order is set') ||
    lower.includes('set for delivery') ||
    lower.includes('set for pickup') ||
    lower.includes('will be ready') ||
    lower.includes('ready in') ||
    lower.includes('已确认') ||
    lower.includes('正在准备') ||
    lower.includes('马上就好')
  );
  if (isConfirmation && !shownCards.has('confirmation')) {
    shownCards.add('confirmation');
    return 'confirmation_card';
  }

  // Step 4: Order summary — AI asks delivery or pickup (order is ready to confirm)
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

export interface OrderDetails {
  drink: string;
  size: string;
  temp: string;
  milk: string;
  sugar: string;
  price: number;
  total: number;
  promo: string;
}

export interface ConfirmationDetails {
  orderNo: string;
  drink: string;
  eta: number;
  total: number;
}

// Menu prices for calculating total
const MENU_PRICES: Record<string, { regular: number; large: number }> = {
  Espresso: { regular: 4.50, large: 5.80 },
  Americano: { regular: 5.00, large: 6.30 },
  Latte: { regular: 6.50, large: 7.80 },
  Cappuccino: { regular: 6.50, large: 7.80 },
  Mocha: { regular: 7.00, large: 8.30 },
  Matcha: { regular: 7.00, large: 8.30 },
};

export function extractOrderDetails(userId: string): OrderDetails {
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

  // Extract drink — prioritize user messages, then AI confirmation.
  // Check user messages first (what the customer actually ordered).
  const userMessages = conv.filter(m => m.startsWith('user:')).join('\n').toLowerCase();
  const aiMessages = conv.filter(m => m.startsWith('assistant:')).join('\n').toLowerCase();
  const drinks = ['espresso', 'americano', 'latte', 'cappuccino', 'mocha', 'matcha'];

  // First pass: check user messages for the drink they mentioned
  let drinkFound = false;
  for (const d of drinks) {
    if (userMessages.includes(d)) {
      order.drink = d.charAt(0).toUpperCase() + d.slice(1);
      drinkFound = true;
    }
  }
  // Fallback: check AI confirmation messages (look for "got it" / "order" context)
  if (!drinkFound) {
    for (const d of drinks) {
      // Only match in AI messages that confirm an order, not menu listings
      const confirmPattern = new RegExp(`(?:got it|order|confirmed|your).*${d}`, 'i');
      if (confirmPattern.test(aiMessages)) {
        order.drink = d.charAt(0).toUpperCase() + d.slice(1);
      }
    }
  }

  // Also check for Chinese drink names in user messages
  const cnDrinkMap: Record<string, string> = {
    '美式': 'Americano', '拿铁': 'Latte', '卡布奇诺': 'Cappuccino',
    '摩卡': 'Mocha', '抹茶': 'Matcha', '浓缩': 'Espresso',
  };
  for (const [cn, en] of Object.entries(cnDrinkMap)) {
    if (userMessages.includes(cn)) order.drink = en;
  }

  // Extract size from all text
  const allText = conv.join('\n').toLowerCase();
  if (userMessages.includes('large') || userMessages.includes('大')) order.size = 'Large';
  else if (userMessages.includes('regular') || userMessages.includes('常规') || userMessages.includes('中')) order.size = 'Regular';
  else if (allText.includes('large')) order.size = 'Large';

  // Extract temp — check user messages first
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

  // Calculate price from menu (with DEVDAY promo: free upsize to Large)
  const priceEntry = MENU_PRICES[order.drink];
  if (priceEntry) {
    // DEVDAY promo: charge regular price but give Large
    order.price = priceEntry.regular;
    order.total = priceEntry.regular;
    order.size = 'Large'; // Always upsize with promo
  }

  // Add milk surcharge
  if (order.milk === 'Oat milk' || order.milk === 'Soy milk') {
    order.total += 0.80;
    order.price += 0.80;
  }

  return order;
}

export function buildConfirmationDetails(userId: string, order: OrderDetails): ConfirmationDetails {
  return {
    orderNo: 'QC-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    drink: `${order.size} ${order.temp} ${order.drink}`,
    eta: 10,
    total: order.total,
  };
}
