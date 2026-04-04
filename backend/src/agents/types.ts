/**
 * Agent Plugin Interface
 *
 * Each agent (barista, medical, airport, etc.) implements this interface.
 * Adding a new agent means creating a directory under agents/ with an index.ts
 * that exports an AgentPlugin, then registering it in the registry.
 */

export interface CardTrigger {
  type: string;                    // e.g. 'menu_card', 'flight_status_card'
  data: Record<string, any>;       // Card payload for frontend rendering
  description: string;             // Human-readable description (used in IM custom message)
}

export interface AgentPlugin {
  /** Unique identifier, e.g. 'barista', 'medical', 'airport' */
  id: string;

  /** Display name shown in UI, e.g. 'QuickCafé' */
  name: string;

  /** Short subtitle, e.g. 'AI Barista' */
  subtitle: string;

  /** Icon identifier or emoji */
  icon: string;

  /** Theme color (CSS value) */
  themeColor: string;

  // ─── System Prompts ───────────────────────────────────────

  /** Full system prompt for text chat (can be long, includes data) */
  textSystemPrompt: string;

  /** Shorter system prompt optimized for voice (TTS-friendly) */
  voiceSystemPrompt: string;

  /** Welcome message spoken when voice chat starts */
  voiceWelcomeMessage: string;

  // ─── Card Detection ───────────────────────────────────────

  /**
   * Track a message for card detection context.
   * Called after each user message and AI reply.
   */
  trackMessage(userId: string, role: 'user' | 'assistant', text: string): void;

  /**
   * Analyze the AI reply and determine if a card should be shown.
   * Returns null if no card should trigger.
   */
  detectCard(userId: string, reply: string): CardTrigger | null;

  // ─── Display Text Cleaning ────────────────────────────────

  /**
   * Agent-specific post-processing of AI response for display.
   * E.g. stripping markdown order summaries, truncating auto-continuations.
   */
  cleanDisplayText(text: string): string;

  // ─── Session Management ───────────────────────────────────

  /** Reset all per-user state (card tracking, conversation context) */
  resetSession(userId: string): void;
}
