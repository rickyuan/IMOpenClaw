/**
 * OpenClaw Provider
 *
 * Handles LLM calls to OpenClaw. OpenClaw manages conversation sessions
 * server-side via the 'user' field. We now send the system prompt on
 * every call so agent switches take effect immediately.
 *
 * When the agent changes (system prompt changes), we append a unique
 * suffix to the 'user' field to force OpenClaw to start a fresh session.
 */

import type { LLMProvider, ChatParams, ChatResponse } from './types';

export class OpenClawProvider implements LLMProvider {
  id: string;
  name: string;
  model: string;
  isStateful = true;

  apiUrl: string;
  apiKey: string;

  // Track active session per user: maps userId → { sessionSuffix, lastSystemPrompt }
  private sessions = new Map<string, { suffix: number; lastPrompt: string }>();

  constructor(config: { id: string; name: string; model: string; apiUrl: string; apiKey: string }) {
    this.id = config.id;
    this.name = config.name;
    this.model = config.model;
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * Get the effective user ID for OpenClaw sessions.
   * When the system prompt changes (agent switch), we bump the suffix
   * so OpenClaw starts a fresh session.
   */
  private getSessionUser(userId: string, systemPrompt: string): string {
    const session = this.sessions.get(userId);

    if (!session) {
      // First call — initialize session
      this.sessions.set(userId, { suffix: 0, lastPrompt: systemPrompt });
      return userId;
    }

    if (session.lastPrompt !== systemPrompt) {
      // Agent switched — bump suffix to start fresh OpenClaw session
      session.suffix += 1;
      session.lastPrompt = systemPrompt;
      console.log(`[OpenClaw] Agent switched for ${userId}, new session suffix: ${session.suffix}`);
    }

    return session.suffix === 0 ? userId : `${userId}_s${session.suffix}`;
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const sessionUser = this.getSessionUser(params.userId, params.systemPrompt);

    const body = {
      model: this.model,
      user: sessionUser,
      messages: [
        // Always send system prompt so OpenClaw knows the agent context
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.message },
      ],
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[OpenClaw] API error: ${response.status} ${response.statusText}`, errText);
      return { raw: '', display: 'Sorry, I could not process that request.' };
    }

    const data: any = await response.json();
    let raw = data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';

    // Clean up OpenClaw artifacts
    raw = raw.replace(/NO_REPLY/g, '').replace(/User hasn't responded\. No further action\./g, '').trim();
    raw = raw.replace(/\.\s*\./g, '.').replace(/\s{2,}/g, ' ').trim();

    return { raw, display: raw };
  }

  resetSession(userId: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.suffix += 1;
      console.log(`[OpenClaw] Session reset for ${userId}, new suffix: ${session.suffix}`);
    }
  }
}
