const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export async function fetchUserSig(userId: string): Promise<{ userSig: string; sdkAppId: number }> {
  const response = await fetch(`${BACKEND_URL}/api/auth/usersig?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch userSig: ${response.statusText}`);
  }
  return response.json();
}

export interface ModelInfo {
  id: string;
  name: string;
  model: string;
}

export async function fetchModels(userId: string): Promise<{ models: ModelInfo[]; activeId: string }> {
  const response = await fetch(`${BACKEND_URL}/api/models?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }
  return response.json();
}

export async function selectModel(userId: string, modelId: string): Promise<{ activeId: string; name: string }> {
  const response = await fetch(`${BACKEND_URL}/api/models/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, modelId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to select model: ${response.statusText}`);
  }
  return response.json();
}

// ─── Agents ──────────────────────────────────────────────────────────

export interface AgentInfo {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
}

export async function fetchAgents(userId: string): Promise<{ agents: AgentInfo[]; activeAgent: string }> {
  const response = await fetch(`${BACKEND_URL}/api/agents?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }
  return response.json();
}

export async function selectAgent(userId: string, agentId: string): Promise<{ activeAgent: string; name: string }> {
  const response = await fetch(`${BACKEND_URL}/api/agents/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, agentId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to select agent: ${response.statusText}`);
  }
  return response.json();
}

// ─── Google Calendar ─────────────────────────────────────────────────

export async function getGoogleCalendarStatus(userId: string): Promise<{ configured: boolean; connected: boolean }> {
  const response = await fetch(`${BACKEND_URL}/api/google-calendar/status?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) return { configured: false, connected: false };
  return response.json();
}

export async function getGoogleAuthUrl(userId: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/auth/google?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error('Failed to get auth URL');
  const data = await response.json();
  return data.authUrl;
}

export async function addToGoogleCalendar(userId: string, appointment: any): Promise<{ success: boolean; eventLink?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/google-calendar/add-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, appointment }),
  });
  if (!response.ok) throw new Error('Failed to add event');
  return response.json();
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await fetch(`${BACKEND_URL}/api/google-calendar/disconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}
