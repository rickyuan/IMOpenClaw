<template>
  <div class="flex-1 overflow-hidden bg-bg-base relative">
    <div
      v-if="error"
      class="flex flex-col items-center justify-center h-full gap-5 px-6"
    >
      <div class="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-error">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="text-sm text-text-secondary text-center max-w-xs leading-relaxed">{{ error }}</p>
      <button
        @click="retry"
        class="px-8 py-2.5 bg-white/10 text-white border border-white/10 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-white/15 active:scale-95"
      >
        Retry
      </button>
    </div>
    <!-- Absolute container to give TUIKit a fixed pixel height -->
    <div v-else class="absolute inset-0 overflow-hidden">
      <TUIKit
        :SDKAppID="sdkAppId"
        :userID="userId"
        :userSig="userSig"
        :conversationID="conversationID"
      />
    </div>
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
const pendingTimers: ReturnType<typeof setTimeout>[] = [];

const switchToBot = () => {
  if (switched) return;
  TUIConversationService.switchConversation(conversationID.value)
    .then(() => { switched = true; })
    .catch(() => {});
};

const onConvListUpdate = (list: any[]) => {
  if (list !== undefined) {
    const t = setTimeout(switchToBot, 100);
    pendingTimers.push(t);
  }
};

onMounted(() => {
  if (!props.sdkAppId || !props.userId || !props.userSig) {
    error.value = 'Missing credentials. Please check your configuration.';
    return;
  }
  TUIStore.watch(StoreName.CONV, { conversationList: onConvListUpdate });
  [3000, 5000, 8000].forEach(d => {
    const t = setTimeout(switchToBot, d);
    pendingTimers.push(t);
  });
});

onUnmounted(() => {
  TUIStore.unwatch(StoreName.CONV, { conversationList: onConvListUpdate });
  pendingTimers.forEach(t => clearTimeout(t));
  pendingTimers.length = 0;
});

function retry() {
  error.value = '';
  window.location.reload();
}
</script>
