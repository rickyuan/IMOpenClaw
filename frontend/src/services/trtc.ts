import TRTC from 'trtc-sdk-v5';

let trtc: any = null;
let currentTaskId: string | null = null;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export interface VoiceStartResult {
  taskId: string;
  agentId?: string;
}

export async function startVoiceMode(roomId: string, userId: string): Promise<VoiceStartResult> {
  // 1. Request backend to start AI task and get credentials
  const res = await fetch(`${BACKEND_URL}/api/voice/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start voice AI');
  }

  const { taskId, userSig, sdkAppId, agentId } = await res.json();
  currentTaskId = taskId;

  // 2. Create TRTC instance with assets path for AI denoiser
  trtc = TRTC.create({ assetsPath: '/trtc-assets/' });

  await trtc.enterRoom({
    strRoomId: roomId,
    sdkAppId: Number(sdkAppId),
    userId,
    userSig,
    scene: 'rtc',
  });

  // 3. Start microphone (speech quality, no camera)
  await trtc.startLocalAudio({ option: { profile: 'speech' } });

  // 4. Enable AI denoiser (mode 1 = far-field elimination, optimized for ASR)
  try {
    await trtc.startPlugin('AIDenoiser', {
      sdkAppId: Number(sdkAppId),
      userId,
      userSig,
    });
    await trtc.updatePlugin('AIDenoiser', { mode: 1 });
    console.log('[TRTC] AI denoiser enabled (mode 1)');
  } catch (e) {
    console.warn('[TRTC] AI denoiser failed to start:', e);
  }

  // 5. Listen for AI bot remote audio (auto-played by SDK)
  trtc.on(TRTC.EVENT.REMOTE_AUDIO_AVAILABLE, ({ userId: remoteUserId }: any) => {
    console.log(`AI bot audio available: ${remoteUserId}`);
  });

  // 6. Listen for custom messages (subtitles + AI state)
  trtc.on(TRTC.EVENT.CUSTOM_MESSAGE, (event: any) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(event.data));
      handleCustomMessage(data);
    } catch (e) {
      console.warn('Failed to parse custom message', e);
    }
  });

  return { taskId, agentId };
}

function handleCustomMessage(data: any) {
  console.log('[TRTC] Custom message:', JSON.stringify(data));

  // Type 10000: Real-time subtitle (STT result / AI reply text)
  if (data.type === 10000) {
    const payload = data.payload || {};
    const text = payload.text;
    const end = payload.end;
    // TRTC may use 'role', 'userid', or 'sender' to identify speaker
    const rawRole = payload.role || data.sender || payload.userid || '';
    // Normalize: bot userId means assistant, anything else is user
    const role = (rawRole === 'assistant' || rawRole === 'openclaw_ai_bot') ? 'assistant' : 'user';
    if (text) {
      window.dispatchEvent(
        new CustomEvent('voice-subtitle', {
          detail: { text, role, end: !!end },
        })
      );
    }
  }

  // Type 10001: AI state change
  if (data.type === 10001) {
    const stateMap: Record<number, string> = {
      1: 'listening',
      2: 'thinking',
      3: 'speaking',
      4: 'interrupted',
    };
    const state = stateMap[data.payload?.state] || 'idle';
    window.dispatchEvent(new CustomEvent('voice-state', { detail: { state } }));
  }
}

export async function stopVoiceMode(): Promise<void> {
  if (trtc) {
    try {
      await trtc.stopPlugin('AIDenoiser').catch(() => {});
      await trtc.stopLocalAudio();
      await trtc.exitRoom();
      trtc.destroy();
    } catch (e) {
      console.warn('Error cleaning up TRTC:', e);
    }
    trtc = null;
  }

  if (currentTaskId) {
    try {
      await fetch(`${BACKEND_URL}/api/voice/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: currentTaskId }),
      });
    } catch (e) {
      console.warn('Error stopping voice AI task:', e);
    }
    currentTaskId = null;
  }
}
