/**
 * Provider Registry
 *
 * Discovers and registers LLM providers from LLM_N_* environment variables.
 * Automatically creates the appropriate provider type based on model name.
 */

import type { LLMProvider, ProviderConfig } from './types';
import { OpenClawProvider } from './openclaw-provider';
import { OpenAICompatProvider } from './openai-compat-provider';

const providers = new Map<string, LLMProvider>();
let defaultProviderId: string | null = null;

export function registerProvider(provider: LLMProvider): void {
  providers.set(provider.id, provider);
  if (!defaultProviderId) {
    defaultProviderId = provider.id;
  }
  console.log(`[ProviderRegistry] Registered: ${provider.id} (${provider.name}, model=${provider.model}, stateful=${provider.isStateful})`);
}

export function getProvider(providerId: string): LLMProvider {
  const provider = providers.get(providerId);
  if (!provider) {
    const fallback = providers.values().next().value;
    if (!fallback) {
      throw new Error('No LLM providers registered');
    }
    console.warn(`Provider "${providerId}" not found, falling back to "${fallback.id}"`);
    return fallback;
  }
  return provider;
}

export function getAllProviders(): LLMProvider[] {
  return Array.from(providers.values());
}

export function getDefaultProviderId(): string {
  if (!defaultProviderId) {
    throw new Error('No LLM providers registered');
  }
  return defaultProviderId;
}

/**
 * Parse LLM_N_* environment variables and return provider configs.
 */
export function parseProviderConfigs(): ProviderConfig[] {
  const configs: ProviderConfig[] = [];
  for (let i = 1; i <= 10; i++) {
    const model = process.env[`LLM_${i}_MODEL`];
    if (!model) continue;
    configs.push({
      model,
      name: process.env[`LLM_${i}_NAME`] || model,
      apiUrl: process.env[`LLM_${i}_API_URL`] || '',
      apiKey: process.env[`LLM_${i}_API_KEY`] || '',
    });
  }
  return configs;
}

/**
 * Initialize providers from environment variables.
 * Call this once at startup after dotenv is loaded.
 */
export function initProviders(): void {
  const configs = parseProviderConfigs();
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const id = String(i + 1);
    const isOpenClaw = config.model.startsWith('openclaw:');

    const provider = isOpenClaw
      ? new OpenClawProvider({ id, ...config })
      : new OpenAICompatProvider({ id, ...config });

    registerProvider(provider);
  }

  if (configs.length === 0) {
    console.warn('[ProviderRegistry] No LLM_N_* env vars found. LLM calls will fail.');
  }
}
