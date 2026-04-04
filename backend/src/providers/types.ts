/**
 * LLM Provider Interface
 *
 * Each model provider (OpenClaw, OpenAI, Anthropic, etc.) implements this interface.
 * Providers handle the specifics of calling their LLM API, managing conversation
 * state (if stateful), and formatting requests/responses.
 */

export interface ChatParams {
  userId: string;
  message: string;
  systemPrompt: string;
  /** Agent ID — used to namespace OpenClaw sessions per agent */
  agentId?: string;
  /** Conversation history (only used by stateless providers) */
  history?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  /** Raw LLM response (before agent-specific cleaning) */
  raw: string;
  /** Display-ready text (after basic provider-level cleaning) */
  display: string;
}

export interface LLMProvider {
  /** Unique provider instance ID (derived from env var index, e.g. 'llm_1') */
  id: string;

  /** Display name, e.g. 'OpenClaw', 'GPT-4o Mini' */
  name: string;

  /** Model identifier, e.g. 'openclaw:main', 'gpt-4o-mini' */
  model: string;

  /** Whether this provider manages its own conversation state server-side */
  isStateful: boolean;

  /** API endpoint URL */
  apiUrl: string;

  /** API key */
  apiKey: string;

  /** Send a chat message and get a response */
  chat(params: ChatParams): Promise<ChatResponse>;

  /** Reset conversation state for a user (if stateful) */
  resetSession?(userId: string): void;
}

export interface ProviderConfig {
  model: string;
  name: string;
  apiUrl: string;
  apiKey: string;
}
