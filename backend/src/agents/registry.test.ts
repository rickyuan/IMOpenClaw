import { describe, it, expect, beforeEach } from 'vitest';
import { registerAgent, getAgent, getAllAgents } from './registry';
import type { AgentPlugin } from './types';

function createMockAgent(id: string, name: string): AgentPlugin {
  return {
    id,
    name,
    subtitle: `${name} subtitle`,
    icon: '🤖',
    themeColor: '#000',
    textSystemPrompt: 'test prompt',
    voiceSystemPrompt: 'voice prompt',
    voiceWelcomeMessage: 'welcome',
    trackMessage: () => {},
    detectCard: () => null,
    cleanDisplayText: (t) => t,
    resetSession: () => {},
  };
}

describe('Agent Registry', () => {
  it('should register and retrieve an agent', () => {
    const agent = createMockAgent('test', 'Test Agent');
    registerAgent(agent);
    expect(getAgent('test')).toBe(agent);
  });

  it('should list all registered agents', () => {
    const a = createMockAgent('a', 'Agent A');
    const b = createMockAgent('b', 'Agent B');
    registerAgent(a);
    registerAgent(b);
    const all = getAllAgents();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('should fallback to first agent for unknown id', () => {
    registerAgent(createMockAgent('fallback', 'Fallback'));
    const agent = getAgent('nonexistent_agent_xyz');
    expect(agent).toBeDefined();
  });
});
