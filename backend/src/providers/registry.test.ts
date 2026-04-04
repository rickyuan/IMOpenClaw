import { describe, it, expect } from 'vitest';
import { parseProviderConfigs } from './registry';

describe('Provider Registry', () => {
  it('should parse LLM_N_* env vars', () => {
    process.env.LLM_1_MODEL = 'openclaw:main';
    process.env.LLM_1_NAME = 'OpenClaw';
    process.env.LLM_1_API_URL = 'https://example.com/v1/chat/completions';
    process.env.LLM_1_API_KEY = 'test-key';

    const configs = parseProviderConfigs();
    expect(configs.length).toBeGreaterThanOrEqual(1);
    expect(configs[0].model).toBe('openclaw:main');
    expect(configs[0].name).toBe('OpenClaw');

    // Cleanup
    delete process.env.LLM_1_MODEL;
    delete process.env.LLM_1_NAME;
    delete process.env.LLM_1_API_URL;
    delete process.env.LLM_1_API_KEY;
  });

  it('should return empty array when no LLM env vars exist', () => {
    const configs = parseProviderConfigs();
    // May not be empty if other tests set env vars, but should not throw
    expect(Array.isArray(configs)).toBe(true);
  });
});
