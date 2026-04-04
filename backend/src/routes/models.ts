import { Router, Request, Response } from 'express';
import {
  getModelConfigs, getUserModel, setUserModel, clearChatHistory,
  AGENTS, getUserAgent, setUserAgent, type AgentId,
} from '../services/openclaw';
import { resetMedicalCards } from '../services/medical-detection';
import { resetUserCards } from '../services/card-detection';
import { resetAirportCards } from '../services/airport-detection';

const router = Router();

// ─── Models ──────────────────────────────────────────────────────────

router.get('/api/models', (req: Request, res: Response) => {
  const userId = req.query.userId as string || '';
  const configs = getModelConfigs();
  const activeId = getUserModel(userId);

  res.json({
    models: configs.map(c => ({ id: c.id, name: c.name, model: c.model })),
    activeId,
  });
});

router.post('/api/models/select', (req: Request, res: Response) => {
  const { userId, modelId } = req.body;
  const configs = getModelConfigs();
  const found = configs.find(c => c.id === modelId);

  if (!found) {
    res.status(400).json({ error: 'Invalid model ID' });
    return;
  }

  setUserModel(userId, modelId);
  clearChatHistory(userId);
  console.log(`[Models] User ${userId} switched to: ${found.name}`);
  res.json({ activeId: modelId, name: found.name });
});

// ─── Agents ──────────────────────────────────────────────────────────

router.get('/api/agents', (req: Request, res: Response) => {
  const userId = req.query.userId as string || '';
  const activeAgent = getUserAgent(userId);
  res.json({ agents: AGENTS, activeAgent });
});

router.post('/api/agents/select', (req: Request, res: Response) => {
  const { userId, agentId } = req.body;
  const agent = AGENTS.find(a => a.id === agentId);

  if (!agent) {
    res.status(400).json({ error: 'Invalid agent ID' });
    return;
  }

  setUserAgent(userId, agentId as AgentId);
  clearChatHistory(userId);
  resetUserCards(userId);
  resetMedicalCards(userId);
  resetAirportCards(userId);
  console.log(`[Agents] User ${userId} switched to agent: ${agent.name}`);
  res.json({ activeAgent: agentId, name: agent.name });
});

export default router;
