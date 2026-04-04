/**
 * User Preferences State
 *
 * Manages per-user agent and model selection.
 * Currently in-memory; Phase 3 will add persistence via Redis/Vercel KV.
 */

const userAgentSelection = new Map<string, string>();
const userModelSelection = new Map<string, string>();

export function getUserAgent(userId: string, defaultAgentId: string): string {
  return userAgentSelection.get(userId) || defaultAgentId;
}

export function setUserAgent(userId: string, agentId: string): void {
  userAgentSelection.set(userId, agentId);
}

export function getUserModel(userId: string, defaultModelId: string): string {
  return userModelSelection.get(userId) || defaultModelId;
}

export function setUserModel(userId: string, modelId: string): void {
  userModelSelection.set(userId, modelId);
}

export function clearUserPreferences(userId: string): void {
  userAgentSelection.delete(userId);
  userModelSelection.delete(userId);
}
