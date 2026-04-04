<template>
  <header class="relative z-30 flex items-center justify-between px-4 py-2 shrink-0 sm:px-6 sm:py-2.5">
    <!-- Left: Agent picker — web.dev: 48px min touch target -->
    <button
      @click="showAgentSheet = !showAgentSheet"
      class="flex items-center gap-2.5 h-11 px-3 rounded-full bg-white/[0.06] border border-white/[0.08] transition-all duration-200 active:scale-95 hover:bg-white/[0.1]"
    >
      <div
        class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        :style="{ background: agentGradient }"
      >
        <span v-if="activeAgentId === 'barista'" class="text-white" style="font-size: var(--text-xs, 12px)">&#9749;</span>
        <span v-else-if="activeAgentId === 'medical'" class="text-white font-bold" style="font-size: var(--text-xs, 12px)">+</span>
        <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="white">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </div>
      <span class="font-medium text-text-primary truncate max-w-[100px]" style="font-size: var(--text-sm, 13px)">{{ activeBrand.name }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-text-muted shrink-0">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <!-- Center: Mode toggle — web.dev: 48px combined height, 8px spacing between -->
    <div class="flex bg-white/[0.06] border border-white/[0.08] rounded-full p-[3px]">
      <button
        :class="[
          'flex items-center gap-1.5 px-4 py-2 rounded-full font-medium transition-all duration-200',
          modelValue === 'text'
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-text-muted hover:text-text-secondary'
        ]"
        style="font-size: var(--text-xs, 12px)"
        @click="$emit('update:modelValue', 'text')"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="hidden sm:inline">Text</span>
      </button>
      <button
        :class="[
          'flex items-center gap-1.5 px-4 py-2 rounded-full font-medium transition-all duration-200',
          modelValue === 'voice'
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-text-muted hover:text-text-secondary'
        ]"
        style="font-size: var(--text-xs, 12px)"
        @click="$emit('update:modelValue', 'voice')"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        </svg>
        <span class="hidden sm:inline">Voice</span>
      </button>
    </div>

    <!-- Right: Model & Settings — web.dev: 48px touch target -->
    <button
      @click="showSettings = !showSettings"
      class="flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.06] border border-white/[0.08] transition-all duration-200 active:scale-95 hover:bg-white/[0.1]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted shrink-0">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/>
      </svg>
    </button>

    <!-- Agent picker bottom sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showAgentSheet" class="fixed inset-0 z-50" @click="showAgentSheet = false">
          <div class="absolute inset-0 bg-black/50" />
          <div class="absolute bottom-0 left-0 right-0 bg-bg-surface rounded-t-3xl p-5 pb-8 sm:max-w-[400px] sm:mx-auto sm:mb-4 sm:rounded-3xl sm:bottom-auto sm:top-20 sm:left-1/2 sm:-translate-x-1/2" @click.stop>
            <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
            <h3 class="font-semibold text-text-primary mb-4" style="font-size: var(--text-lg, 16px)">Choose Scene</h3>
            <div class="flex flex-col gap-2">
              <!-- web.dev: each row is 48px+ touch target with 8px gap -->
              <button
                v-for="a in agents"
                :key="a.id"
                :class="[
                  'flex items-center gap-3.5 p-3.5 min-h-[56px] rounded-2xl border transition-all duration-200 active:scale-[0.98]',
                  activeAgentId === a.id
                    ? 'border-white/15 bg-white/[0.08]'
                    : 'border-transparent hover:bg-white/[0.04]'
                ]"
                @click="onAgentChange(a.id); showAgentSheet = false"
              >
                <div
                  class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  :style="{ background: getAgentGradient(a.id) }"
                >
                  <span v-if="a.id === 'barista'" class="text-white text-base">&#9749;</span>
                  <span v-else-if="a.id === 'medical'" class="text-white font-bold text-base">+</span>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <div class="flex flex-col items-start gap-0.5 min-w-0">
                  <span class="font-medium text-text-primary" style="font-size: var(--text-base, 14px)">{{ a.name }}</span>
                  <span class="text-text-muted" style="font-size: var(--text-xs, 12px)">{{ a.subtitle }}</span>
                </div>
                <svg v-if="activeAgentId === a.id" class="ml-auto text-accent shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Settings bottom sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showSettings" class="fixed inset-0 z-50" @click="showSettings = false">
          <div class="absolute inset-0 bg-black/50" />
          <div class="absolute bottom-0 left-0 right-0 bg-bg-surface rounded-t-3xl p-5 pb-8 sm:max-w-[400px] sm:mx-auto sm:mb-4 sm:rounded-3xl sm:bottom-auto sm:top-20 sm:right-4 sm:left-auto sm:translate-x-0" @click.stop>
            <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
            <h3 class="text-base font-semibold text-text-primary mb-4">Model</h3>
            <div class="flex flex-col gap-1.5">
              <button
                v-for="m in models"
                :key="m.id"
                :class="[
                  'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 active:scale-[0.98]',
                  activeModelId === m.id
                    ? 'border-white/15 bg-white/[0.08]'
                    : 'border-transparent hover:bg-white/[0.04]'
                ]"
                @click="onModelChangeById(m.id)"
              >
                <div class="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-secondary">
                    <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01"/>
                  </svg>
                </div>
                <span class="text-sm text-text-primary">{{ m.name }}</span>
                <svg v-if="activeModelId === m.id" class="ml-auto text-accent shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>

            <div class="mt-5 pt-4 border-t border-white/[0.06]">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-xs font-bold text-white shrink-0">{{ userInitial }}</div>
                <span class="text-sm text-text-secondary">{{ userId }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
const showAgentSheet = ref(false);
const showSettings = ref(false);

const userInitial = computed(() => props.userId.charAt(0).toUpperCase());

const activeModelName = computed(() => {
  const m = models.value.find(m => m.id === activeModelId.value);
  return m?.name || 'Model';
});

const activeBrand = computed(() => {
  const agent = agents.value.find(a => a.id === activeAgentId.value);
  if (agent) return { name: agent.name, subtitle: agent.subtitle };
  return { name: 'QuickCafe', subtitle: 'AI Barista Demo' };
});

function getAgentGradient(id: string) {
  if (id === 'barista') return 'linear-gradient(135deg, #C67C4E, #8B5A2B)';
  if (id === 'medical') return 'linear-gradient(135deg, #2E86DE, #1B5E9E)';
  return 'linear-gradient(135deg, #7C3AED, #0EA5E9)';
}

const agentGradient = computed(() => getAgentGradient(activeAgentId.value));

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

async function onModelChangeById(modelId: string) {
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

<style>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .sheet-enter-from > div:last-child,
  .sheet-leave-to > div:last-child {
    transform: translateY(-8px) scale(0.98);
    opacity: 0;
  }
}
</style>
