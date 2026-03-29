<template>
  <header class="topnav">
    <div class="brand">
      <!-- Coffee icon for barista -->
      <svg v-if="activeAgentId === 'barista'" class="brand-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="url(#grad-coffee)"/>
        <path d="M9 12h10v9a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-9z" fill="#fff" opacity="0.9"/>
        <path d="M19 14h2a2.5 2.5 0 0 1 0 5h-2" stroke="#fff" stroke-width="1.5" fill="none"/>
        <path d="M12 10c0-1.5 1-2 1-3" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
        <path d="M16 10c0-1.5 1-2 1-3" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
        <defs>
          <linearGradient id="grad-coffee" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stop-color="#C67C4E"/><stop offset="1" stop-color="#8B5A2B"/>
          </linearGradient>
        </defs>
      </svg>
      <!-- Medical icon for medical -->
      <svg v-else class="brand-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="url(#grad-medical)"/>
        <rect x="14" y="8" width="4" height="16" rx="1" fill="#fff" opacity="0.9"/>
        <rect x="8" y="14" width="16" height="4" rx="1" fill="#fff" opacity="0.9"/>
        <defs>
          <linearGradient id="grad-medical" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stop-color="#2E86DE"/><stop offset="1" stop-color="#1B5E9E"/>
          </linearGradient>
        </defs>
      </svg>
      <div class="brand-text">
        <span class="brand-name">{{ activeBrand.name }}</span>
        <span class="brand-sub">{{ activeBrand.subtitle }}</span>
      </div>
    </div>

    <div class="mode-tabs">
      <button
        :class="['tab', modelValue === 'text' && 'active']"
        @click="$emit('update:modelValue', 'text')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Text Chat
      </button>
      <button
        :class="['tab', modelValue === 'voice' && 'active']"
        @click="$emit('update:modelValue', 'voice')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        Voice Chat
      </button>
    </div>

    <div class="controls">
      <!-- Agent selector -->
      <div v-if="agents.length > 1" class="agent-selector">
        <div class="agent-tabs">
          <button
            v-for="a in agents"
            :key="a.id"
            :class="['agent-tab', activeAgentId === a.id && 'active', a.id]"
            @click="onAgentChange(a.id)"
          >
            <span class="agent-icon">{{ a.id === 'barista' ? '&#9749;' : '&#9764;' }}</span>
            {{ a.name }}
          </button>
        </div>
      </div>

      <div v-if="models.length > 0" class="model-selector">
        <span class="model-label">Model</span>
        <div class="select-wrap">
          <select :value="activeModelId" @change="onModelChange">
            <option v-for="m in models" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
          <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      <div class="user-badge">
        <div class="avatar">{{ userInitial }}</div>
        <span class="username">{{ userId }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fetchModels, selectModel, fetchAgents, selectAgent, type ModelInfo, type AgentInfo } from '../services/api';

const props = defineProps<{
  modelValue: 'text' | 'voice';
  userId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: 'text' | 'voice'];
  'agent-changed': [agentId: string];
}>();

const models = ref<ModelInfo[]>([]);
const activeModelId = ref('');
const agents = ref<AgentInfo[]>([]);
const activeAgentId = ref('barista');

const userInitial = computed(() => props.userId.charAt(0).toUpperCase());

const activeBrand = computed(() => {
  const agent = agents.value.find(a => a.id === activeAgentId.value);
  if (agent) return { name: agent.name, subtitle: agent.subtitle };
  return { name: 'QuickCafe', subtitle: 'AI Barista Demo' };
});

async function loadModels() {
  try {
    const result = await fetchModels(props.userId);
    models.value = result.models;
    activeModelId.value = result.activeId;
  } catch (e) {
    console.error('Failed to load models:', e);
  }
}

async function loadAgents() {
  try {
    const result = await fetchAgents(props.userId);
    agents.value = result.agents;
    activeAgentId.value = result.activeAgent;
  } catch (e) {
    console.error('Failed to load agents:', e);
  }
}

async function onModelChange(e: Event) {
  const modelId = (e.target as HTMLSelectElement).value;
  try {
    const result = await selectModel(props.userId, modelId);
    activeModelId.value = result.activeId;
  } catch (err) {
    console.error('Failed to switch model:', err);
  }
}

async function onAgentChange(agentId: string) {
  if (agentId === activeAgentId.value) return;
  try {
    const result = await selectAgent(props.userId, agentId);
    activeAgentId.value = result.activeAgent;
    emit('agent-changed', result.activeAgent);
  } catch (err) {
    console.error('Failed to switch agent:', err);
  }
}

onMounted(() => {
  loadModels();
  loadAgents();
});
</script>

<style scoped>
.topnav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 16px;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.brand-sub {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab:hover {
  color: var(--text-primary);
  background: rgba(0,0,0,0.05);
}

.tab.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 0 12px var(--accent-glow);
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

/* Agent selector */
.agent-tabs {
  display: flex;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}

.agent-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.agent-tab:hover {
  color: var(--text-primary);
  background: rgba(0,0,0,0.05);
}

.agent-tab.active.barista {
  background: linear-gradient(135deg, #C67C4E, #A0522D);
  color: #fff;
}

.agent-tab.active.medical {
  background: linear-gradient(135deg, #2E86DE, #1B5E9E);
  color: #fff;
}

.agent-icon {
  font-size: 14px;
}

.model-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.select-wrap select {
  appearance: none;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 13px;
  padding: 5px 28px 5px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.select-wrap select:hover,
.select-wrap select:focus {
  border-color: var(--accent);
}

.select-wrap select option {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.select-arrow {
  position: absolute;
  right: 8px;
  pointer-events: none;
  color: var(--text-muted);
}

/* User badge */
.user-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.username {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
