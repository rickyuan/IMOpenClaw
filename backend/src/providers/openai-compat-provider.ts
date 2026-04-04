/**
 * OpenAI-Compatible Provider
 *
 * Handles stateless LLM calls to any OpenAI-compatible endpoint (GPT-4, GPT-4o, etc.).
 * Manages conversation history locally and prepends the system prompt on every call.
 */

import type { LLMProvider, ChatParams, ChatResponse } from './types';

export class OpenAICompatProvider implements LLMProvider {
  id: string;
  name: string;
  model: string;
  isStateful = false;

  apiUrl: string;
  apiKey: string;
  private maxHistory: number;

  // Per-user conversation history
  private histories = new Map<string, Array<{ role: string; content: string }>>();

  constructor(config: { id: string; name: string; model: string; apiUrl: string; apiKey: string; maxHistory?: number }) {
    this.id = config.id;
    this.name = config.name;
    this.model = config.model;
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.maxHistory = config.maxHistory || 20;
  }

  private getHistory(userId: string): Array<{ role: string; content: string }> {
    if (!this.histories.has(userId)) this.histories.set(userId, []);
    return this.histories.get(userId)!;
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const history = this.getHistory(params.userId);
    history.push({ role: 'user', content: params.message });
    while (history.length > this.maxHistory) history.shift();

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        ...history,
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
      console.error(`[OpenAI-Compat] API error: ${response.status} ${response.statusText}`, errText);
      return { raw: '', display: 'Sorry, I could not process that request.' };
    }

    const data: any = await response.json();
    const raw = data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';

    // Track assistant reply in history
    history.push({ role: 'assistant', content: raw });

    return { raw, display: raw };
  }

  resetSession(userId: string): void {
    this.histories.delete(userId);
  }
}
