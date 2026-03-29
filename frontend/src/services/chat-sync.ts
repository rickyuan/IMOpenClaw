import { TUILogin } from '@tencentcloud/tui-core-lite';
import TencentCloudChat from '@tencentcloud/lite-chat';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

let chatSDK: any = null;

/**
 * Initialize chat sync by reusing TUIKit's existing Chat SDK instance.
 * Must be called after TUIKit login completes.
 */
export function initChatSync() {
  const context = TUILogin.getContext();
  chatSDK = context.chat;
  if (!chatSDK) {
    console.warn('[chat-sync] Chat SDK instance not available yet. Sync will be skipped.');
  }
}

/**
 * Sync a voice transcript line to Chat IM.
 *
 * - User messages: sent from frontend Chat SDK (appears on right side as "me")
 * - AI messages: sent via backend REST API as bot (appears on left side as "bot")
 */
export async function syncVoiceTranscript(text: string, role: 'user' | 'assistant', userId: string) {
  if (role === 'user') {
    // User message: send via frontend Chat SDK → right side
    await syncUserMessage(text);
  } else {
    // AI message: send via backend as bot → left side
    await syncBotMessage(text, userId);
  }
}

/** Send user's voice transcript as a custom message from the user */
async function syncUserMessage(text: string) {
  if (!chatSDK) {
    const context = TUILogin.getContext();
    chatSDK = context.chat;
    if (!chatSDK) return;
  }

  const botUserId = import.meta.env.VITE_BOT_USERID || 'openclaw_bot';

  try {
    const message = chatSDK.createCustomMessage({
      to: botUserId,
      conversationType: TencentCloudChat.TYPES.CONV_C2C,
      payload: {
        data: JSON.stringify({
          source: 'voice_conversation',
          role: 'user',
          text,
          timestamp: Date.now(),
        }),
        description: `🎙 ${text}`,
        extension: 'voice_transcript',
      },
    });

    await chatSDK.sendMessage(message);
  } catch (e) {
    console.warn('[chat-sync] Failed to sync user voice transcript:', e);
  }
}

/** Send AI's voice transcript via backend REST API (bot identity → left side) */
async function syncBotMessage(text: string, userId: string) {
  try {
    await fetch(`${BACKEND_URL}/api/voice/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text, role: 'assistant' }),
    });
  } catch (e) {
    console.warn('[chat-sync] Failed to sync bot voice transcript:', e);
  }
}
