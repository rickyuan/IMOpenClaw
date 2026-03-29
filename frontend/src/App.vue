<template>
  <div id="app-root">
    <TopNav v-model="mode" :userId="userId" @agent-changed="onAgentChanged" />
    <template v-if="ready">
      <ChatPanel
        v-if="mode === 'text'"
        :sdkAppId="sdkAppId"
        :userId="userId"
        :userSig="userSig"
      />
      <VoicePanel
        v-else
        :userId="userId"
      />
    </template>
    <div v-else-if="initError" class="state-screen">
      <div class="state-card error">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>{{ initError }}</p>
        <button @click="init">Retry</button>
      </div>
    </div>
    <div v-else class="state-screen">
      <div class="spinner" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import TopNav from './components/TopNav.vue';
import ChatPanel from './components/ChatPanel.vue';
import VoicePanel from './components/VoicePanel.vue';
import { fetchUserSig } from './services/api';
import { initChatSync } from './services/chat-sync';
import { stopVoiceMode } from './services/trtc';

const mode = ref<'text' | 'voice'>('voice');
const userId = ref('demo_user_001');
const userSig = ref('');
const sdkAppId = ref(0);
const ready = ref(false);
const initError = ref('');

async function init() {
  initError.value = '';
  try {
    const result = await fetchUserSig(userId.value);
    userSig.value = result.userSig;
    sdkAppId.value = result.sdkAppId;
    ready.value = true;
    setTimeout(() => initChatSync(), 2000);
  } catch (error: any) {
    initError.value = error.message || 'Failed to connect to backend.';
  }
}

function onAgentChanged(agentId: string) {
  window.dispatchEvent(new CustomEvent('agent-changed', { detail: agentId }));
}

function onBeforeUnload() { stopVoiceMode(); }

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload);
  init();
});
onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});
</script>

<style scoped>
#app-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-base);
}

.state-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 40px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  max-width: 360px;
  text-align: center;
}

.state-card.error {
  color: var(--error);
}

.state-card p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.state-card button {
  padding: 8px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.state-card button:hover {
  background: var(--accent-dark);
}
</style>
