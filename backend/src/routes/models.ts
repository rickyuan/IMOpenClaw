import { Router, Request, Response } from 'express';
import { getModelConfigs, clearChatHistory } from '../services/openclaw';
import { getAllAgents, getAgent } from '../agents/registry';
import {
  getUserModel, setUserModel,
  getUserAgent, setUserAgent,
} from '../state/user-preferences';
import { selectionLimiter } from '../middleware/rate-limit';

const router = Router();

// ─── Models ──────────────────────────────────────────────────────────

router.get('/api/models', (req: Request, res: Response) => {
  const userId = req.query.userId as string || '';
  const configs = getModelConfigs();
  const activeId = getUserModel(userId, '1');

  res.json({
    models: configs.map(c => ({ id: c.id, name: c.name, model: c.model })),
    activeId,
  });
});

router.post('/api/models/select', selectionLimiter, (req: Request, res: Response) => {
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
  const activeAgentId = getUserAgent(userId, 'barista');
  const agents = getAllAgents().map(a => ({
    id: a.id,
    name: a.name,
    subtitle: a.subtitle,
    icon: a.icon,
  }));
  res.json({ agents, activeAgent: activeAgentId });
});

router.post('/api/agents/select', selectionLimiter, (req: Request, res: Response) => {
  const { userId, agentId } = req.body;

  const agent = getAgent(agentId);
  if (!agent) {
    res.status(400).json({ error: 'Invalid agent ID' });
    return;
  }

  // Reset previous agent's session
  const prevAgentId = getUserAgent(userId, 'barista');
  const prevAgent = getAgent(prevAgentId);
  prevAgent.resetSession(userId);

  // Switch to new agent
  setUserAgent(userId, agentId);
  clearChatHistory(userId);
  agent.resetSession(userId);

  console.log(`[Agents] User ${userId} switched to agent: ${agent.name}`);
  res.json({ activeAgent: agentId, name: agent.name });
});

export default router;
