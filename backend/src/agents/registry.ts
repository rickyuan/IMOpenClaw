/**
 * Agent Registry
 *
 * Central registry for all agent plugins. Agents register themselves here
 * and the rest of the system uses getAgent() / getAllAgents() to access them.
 */

import type { AgentPlugin } from './types';
import { baristaAgent } from './barista';
import { medicalAgent } from './medical';
import { airportAgent } from './airport';

const agents = new Map<string, AgentPlugin>();

// Register built-in agents
registerAgent(baristaAgent);
registerAgent(medicalAgent);
registerAgent(airportAgent);

export function registerAgent(agent: AgentPlugin): void {
  if (agents.has(agent.id)) {
    console.warn(`Agent "${agent.id}" is already registered, overwriting.`);
  }
  agents.set(agent.id, agent);
  console.log(`[AgentRegistry] Registered agent: ${agent.id} (${agent.name})`);
}

export function getAgent(agentId: string): AgentPlugin {
  const agent = agents.get(agentId);
  if (!agent) {
    // Fall back to first registered agent
    const first = agents.values().next().value;
    if (!first) {
      throw new Error('No agents registered');
    }
    console.warn(`Agent "${agentId}" not found, falling back to "${first.id}"`);
    return first;
  }
  return agent;
}

export function getAllAgents(): AgentPlugin[] {
  return Array.from(agents.values());
}

export function hasAgent(agentId: string): boolean {
  return agents.has(agentId);
}
