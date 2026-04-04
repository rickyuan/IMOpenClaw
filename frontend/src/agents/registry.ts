/**
 * Frontend Agent UI Registry
 *
 * Central registry for agent UI plugins. Components use getAgentUI()
 * to resolve card components and theme settings for the active agent.
 */

import type { AgentUIPlugin } from './types';
import { baristaAgentUI } from './barista';
import { medicalAgentUI } from './medical';
import { airportAgentUI } from './airport';

const agentUIs = new Map<string, AgentUIPlugin>();

export function registerAgentUI(agent: AgentUIPlugin): void {
  agentUIs.set(agent.id, agent);
}

export function getAgentUI(agentId: string): AgentUIPlugin | undefined {
  return agentUIs.get(agentId) || agentUIs.values().next().value;
}

export function getAllAgentUIs(): AgentUIPlugin[] {
  return Array.from(agentUIs.values());
}

// Register all agent UI plugins at module load time
registerAgentUI(baristaAgentUI);
registerAgentUI(medicalAgentUI);
registerAgentUI(airportAgentUI);
