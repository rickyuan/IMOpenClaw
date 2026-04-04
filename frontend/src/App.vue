<template>
  <div id="app-root" class="flex flex-col h-full bg-bg-base overflow-hidden">
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
    <div v-else-if="initError" class="flex-1 flex items-center justify-center px-6">
      <div class="flex flex-col items-center gap-5 text-center max-w-[320px]">
        <div class="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-error">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p class="text-sm text-text-secondary leading-relaxed">{{ initError }}</p>
        <button
          @click="init"
          class="px-8 py-2.5 bg-white/10 text-white border border-white/10 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-white/15 active:scale-95"
        >Retry</button>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="w-10 h-10 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
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
