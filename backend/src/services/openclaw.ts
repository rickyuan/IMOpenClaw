/**
 * LLM Orchestration Service
 *
 * Thin orchestrator that connects agents (system prompts, display cleaning)
 * with providers (LLM API calls). This is the single entry point for all
 * LLM interactions.
 */

import { getAgent } from '../agents/registry';
import { getProvider, getAllProviders } from '../providers/registry';
import { getUserAgent, getUserModel } from '../state/user-preferences';

// ─── Model Config (legacy compatibility for trtc-ai.ts voice config) ──

export interface LLMModelConfig {
  id: string;
  name: string;
  model: string;
  apiUrl: string;
  apiKey: string;
  isOpenClaw?: boolean;
}

export function getModelConfigs(): LLMModelConfig[] {
  return getAllProviders().map(p => ({
    id: p.id,
    name: p.name,
    model: p.model,
    apiUrl: p.apiUrl,
    apiKey: p.apiKey,
    isOpenClaw: p.isStateful,
  }));
}

// ─── Chat History (for stateless providers managed here for legacy compat) ──

export function clearChatHistory(userId: string): void {
  // Reset session on all stateless providers for this user
  for (const provider of getAllProviders()) {
    if (provider.resetSession) {
      provider.resetSession(userId);
    }
  }
}

// ─── LLM Call ──────────────────────────────────────────────────────

export interface LLMReply {
  raw: string;
  display: string;
}

export async function callOpenClaw(message: string, userId: string): Promise<LLMReply> {
  const agentId = getUserAgent(userId, 'barista');
  const modelId = getUserModel(userId, '1');
  const agent = getAgent(agentId);
  const provider = getProvider(modelId);

  console.log(`[LLM] User ${userId} agent=${agentId} model: ${provider.name} (${provider.model}) stateful=${provider.isStateful}`);

  const response = await provider.chat({
    userId,
    message,
    systemPrompt: agent.textSystemPrompt,
    agentId,
  });

  // Agent-specific display text cleaning
  const display = agent.cleanDisplayText(response.raw) || 'Sorry, I could not process that.';

  return { raw: response.raw, display };
}
