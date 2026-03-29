<template>
  <div class="chat-panel">
    <div v-if="error" class="chat-error">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ error }}</p>
      <button @click="retry">Retry</button>
    </div>
    <TUIKit
      v-else
      :SDKAppID="sdkAppId"
      :userID="userId"
      :userSig="userSig"
      :conversationID="conversationID"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { TUIKit } from '../TUIKit';
import { TUIConversationService, TUIStore, StoreName } from '@tencentcloud/chat-uikit-engine-lite';

const props = defineProps<{
  sdkAppId: number;
  userId: string;
  userSig: string;
}>();

const error = ref('');
const botUserId = import.meta.env.VITE_BOT_USERID || 'openclaw_bot';
const conversationID = computed(() => `C2C${botUserId}`);

let switched = false;

const switchToBot = () => {
  if (switched) return;
  TUIConversationService.switchConversation(conversationID.value)
    .then(() => { switched = true; })
    .catch(() => {});
};

const onConvListUpdate = (list: any[]) => {
  if (list !== undefined) setTimeout(switchToBot, 100);
};

onMounted(() => {
  if (!props.sdkAppId || !props.userId || !props.userSig) {
    error.value = 'Missing credentials. Please check your configuration.';
    return;
  }
  // Watch for SDK_READY signal: conversationList populates only after SDK is ready
  TUIStore.watch(StoreName.CONV, { conversationList: onConvListUpdate });
  // Fallback retries in case watch fires too early
  [3000, 5000, 8000].forEach(d => setTimeout(switchToBot, d));
});

onUnmounted(() => {
  TUIStore.unwatch(StoreName.CONV, { conversationList: onConvListUpdate });
});

function retry() {
  error.value = '';
  window.location.reload();
}
</script>

<style scoped>
.chat-panel {
  flex: 1;
  overflow: hidden;
  background: var(--bg-base);
}

.chat-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--error);
}

.chat-error p {
  color: var(--text-secondary);
  font-size: 14px;
}

.chat-error button {
  padding: 8px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-error button:hover {
  background: var(--accent-dark);
}

</style>
