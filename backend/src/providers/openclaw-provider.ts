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

  constructor(config: { id: string; name: string; model: string; apiUrl: string; apiKey: string }) {
    this.id = config.id;
    this.name = config.name;
    this.model = config.model;
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * Get the effective user ID for OpenClaw sessions.
   * We encode the agentId directly into the user field so each agent
   * gets its own OpenClaw session. This is stateless — no in-memory
   * tracking needed, which is critical for Vercel serverless where
   * the instance may cold-start on every request.
   */
  private getSessionUser(userId: string, agentId?: string): string {
    if (agentId && agentId !== 'barista') {
      return `${userId}_${agentId}`;
    }
    return userId;
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const sessionUser = this.getSessionUser(params.userId, params.agentId);

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

  resetSession(_userId: string): void {
    // No-op: sessions are now namespaced by agentId in the user field,
    // so each agent automatically gets its own OpenClaw session.
  }
}
