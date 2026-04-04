/**
 * State Store Abstraction
 *
 * Provides a key-value store interface with optional TTL support.
 * Implementations: MemoryStore (default), RedisStore (for Vercel KV / production).
 */

export interface StateStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory store with TTL support.
 * Suitable for local development and single-instance deployments.
 */
export class MemoryStore implements StateStore {
  private data = new Map<string, { value: any; expiresAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.data.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }
}

// Singleton store instance
let store: StateStore | null = null;

export function getStore(): StateStore {
  if (!store) {
    // TODO: Check for REDIS_URL or VERCEL_KV_URL to use RedisStore in production
    store = new MemoryStore();
    console.log('[Store] Using in-memory store');
  }
  return store;
}
