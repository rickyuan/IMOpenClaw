# OpenClaw + TRTC + Chat Demo

## Project Overview

Build a web demo that enables real-time **text chat** and **voice conversation** with an OpenClaw AI agent, powered by Tencent Cloud Chat SDK and TRTC SDK.

- **Text mode**: User sends messages via Chat UIKit → backend relays to OpenClaw → bot replies via Chat REST API
- **Voice mode**: User speaks in TRTC room → TRTC Conversational AI (server-side STT) → OpenClaw as LLM → TTS audio back to user
- **Sync**: Voice transcripts are synced to Chat IM history so the user sees a unified conversation

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vue 3 + Vite + TypeScript | SPA framework |
| Chat UI | `@tencentcloud/chat-uikit-vue` (TUIKit) | Pre-built chat components |
| RTC | `trtc-sdk-v5` | WebRTC audio room |
| Backend | Node.js + Express + TypeScript | API gateway, callback handler |
| Tencent Cloud SDK | `tencentcloud-sdk-nodejs-intl-en` | StartAIConversation API |
| AI Gateway | OpenClaw (Tencent Cloud Lighthouse) | AI agent with OpenAI-compatible HTTP API |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Web Frontend (Vue 3, localhost:5173)                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Chat UIKit   │  │ TRTC Web SDK │  │ Mode Switch│ │
│  │ (TUIKit Vue) │  │ Audio room   │  │ Text/Voice │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┘ │
└─────────┼─────────────────┼─────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────┐
│  Backend (Node.js, localhost:3000)                   │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────┐ │
│  │ IM Callback │ │ Chat REST  │ │ StartAI          │ │
│  │ (webhook)   │ │ API client │ │ Conversation API │ │
│  └──────┬──────┘ └─────┬──────┘ └────────┬─────────┘ │
│         │              │                 │           │
│         ▼              ▼                 ▼           │
│  ┌─────────────────────────────────────────────┐     │
│  │  OpenClaw HTTP Client                       │     │
│  │  POST /v1/chat/completions                  │     │
│  └──────────────────────┬──────────────────────┘     │
└─────────────────────────┼───────────────────────────┘
                          │ (HTTPS, public IP)
                          ▼
┌─────────────────────────────────────────────────────┐
│  Tencent Cloud Lighthouse (e.g. Singapore region)   │
│  ┌────────────────────────────────────────────────┐  │
│  │  OpenClaw Gateway (:18789)                     │  │
│  │  AI Agent + multi-model routing                │  │
│  │  Reverse proxy: Caddy/Nginx → HTTPS :443       │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

Voice path (server-side, all within Tencent Cloud network):
  User mic → TRTC Cloud (STT) ──[Tencent internal network]──→ OpenClaw on Lighthouse (LLM)
           → TTS provider → TRTC Cloud → User speaker

Network advantage: TRTC Cloud and Lighthouse are both on Tencent Cloud.
When Lighthouse is in the same region (e.g. ap-singapore), the LLM call
from TRTC to OpenClaw stays on the internal network with minimal latency.
```

## Directory Structure

```
openclaw-trtc-demo/
├── Claude.md                        # This file
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── index.html
│   └── src/
│       ├── main.ts
│       ├── App.vue                  # Root layout with mode switch
│       ├── env.d.ts
│       ├── TUIKit/                  # Copied from @tencentcloud/chat-uikit-vue
│       ├── components/
│       │   ├── ChatPanel.vue        # Wraps TUIKit, handles bot conversation
│       │   ├── VoicePanel.vue       # TRTC voice controls + status + subtitles
│       │   └── ModeSwitch.vue       # Toggle between text/voice mode
│       ├── services/
│       │   ├── api.ts               # Backend HTTP calls
│       │   ├── trtc.ts              # TRTC SDK init, enterRoom, events
│       │   └── chat-sync.ts         # Sync voice transcripts to Chat IM
│       └── styles/
│           └── main.css
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts                   # Express server entry
│       ├── routes/
│       │   ├── auth.ts              # GET /api/auth/usersig
│       │   ├── callback.ts          # POST /api/im/callback (IM webhook)
│       │   └── voice.ts             # POST /api/voice/start, /stop, /status
│       └── services/
│           ├── usersig.ts           # HMAC-SHA256 UserSig generator
│           ├── openclaw.ts          # OpenClaw HTTP client
│           ├── chat-api.ts          # Chat REST API (send bot messages)
│           └── trtc-ai.ts           # TencentCloud StartAIConversation
└── .env.example                     # Environment variable template
```

## Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories.

### backend/.env

```env
# Tencent Cloud
TRTC_SDK_APP_ID=1400000000
TRTC_SDK_SECRET_KEY=your_sdk_secret_key

# Tencent Cloud API (for StartAIConversation)
TCLOUD_SECRET_ID=AKIDxxxxxxxx
TCLOUD_SECRET_KEY=xxxxxxxx
TCLOUD_APP_ID=1300000000

# OpenClaw (deployed on Tencent Cloud Lighthouse)
# OPENCLAW_API_URL: used by YOUR backend to call OpenClaw (text chat path)
# OPENCLAW_PUBLIC_URL: used in LLMConfig so TRTC Cloud can call OpenClaw (voice path)
# Both point to the same Lighthouse instance. Use HTTPS via reverse proxy.
OPENCLAW_API_URL=https://openclaw.your-domain.com/v1/chat/completions
OPENCLAW_PUBLIC_URL=https://openclaw.your-domain.com/v1/chat/completions
OPENCLAW_GATEWAY_TOKEN=your-openclaw-token

# TTS (Tencent Cloud TTS)
TTS_VOICE_TYPE=101001
TTS_SPEED=1.25

# Chat REST API
IM_ADMIN_USERID=administrator
IM_BOT_USERID=openclaw_bot

# Server
PORT=3000
```

### frontend/.env

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_SDK_APP_ID=1400000000
```

## Implementation Plan

### Phase 1: Text Chat (Days 1-2)

Goal: User sends text in Chat UIKit → AI bot replies via OpenClaw.

#### 1.1 Frontend — Chat UIKit setup

- Create Vue 3 + Vite project with TypeScript + sass
- Install and copy TUIKit: `npm i @tencentcloud/chat-uikit-vue`, then copy to `src/TUIKit/`
- In `App.vue`, render `<TUIKit>` with SDKAppID, userID, userSig from backend
- On mount, call `GET /api/auth/usersig?userId=xxx` to get userSig

```vue
<!-- App.vue simplified -->
<template>
  <div id="app">
    <ModeSwitch v-model="mode" />
    <ChatPanel v-if="mode === 'text'" :sdkAppId="sdkAppId" :userId="userId" :userSig="userSig" />
    <VoicePanel v-else :sdkAppId="sdkAppId" :userId="userId" :userSig="userSig" />
  </div>
</template>
```

#### 1.2 Backend — UserSig generation

- Use HMAC-SHA256 to generate UserSig (same logic as your existing OpenClaw Skill)
- Endpoint: `GET /api/auth/usersig?userId=xxx` → returns `{ userSig, sdkAppId }`

```typescript
// backend/src/services/usersig.ts
import * as crypto from 'crypto';

export function generateUserSig(userId: string): string {
  const sdkAppId = Number(process.env.TRTC_SDK_APP_ID);
  const secretKey = process.env.TRTC_SDK_SECRET_KEY!;
  const expireTime = 86400 * 7; // 7 days
  const currTime = Math.floor(Date.now() / 1000);

  const sigDoc = {
    'TLS.ver': '2.0',
    'TLS.identifier': userId,
    'TLS.sdkappid': sdkAppId,
    'TLS.expire': expireTime,
    'TLS.time': currTime,
  };

  let sigStr = `TLS.identifier:${userId}\n`;
  sigStr += `TLS.sdkappid:${sdkAppId}\n`;
  sigStr += `TLS.time:${currTime}\n`;
  sigStr += `TLS.expire:${expireTime}\n`;

  const hmac = crypto.createHmac('sha256', secretKey).update(sigStr).digest();
  const sigDocStr = JSON.stringify(sigDoc);
  const buffer = Buffer.concat([hmac, Buffer.from(sigDocStr)]);
  const compressed = zlib.deflateSync(buffer);
  return compressed.toString('base64').replace(/\+/g, '*').replace(/\//g, '-').replace(/=/g, '_');
}
```

> Note: The above is a simplified version. Use the official `tls-sig-api-v2` npm package or the proven implementation from your existing TRTC Skill for production correctness.

#### 1.3 Backend — IM Callback → OpenClaw → Bot Reply

Data flow:
1. User sends message in Chat UIKit
2. IM Server fires **After Send Msg** callback to `POST /api/im/callback`
3. Backend extracts text, calls OpenClaw `/v1/chat/completions`
4. Backend sends bot reply via Chat REST API `v2/openim/sendmsg`

```typescript
// backend/src/routes/callback.ts
router.post('/api/im/callback', async (req, res) => {
  const { CallbackCommand, From_Account, To_Account, MsgBody } = req.body;

  // Only handle C2C after-send callback
  if (CallbackCommand !== 'C2C.CallbackAfterSendMsg') {
    return res.json({ ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: '' });
  }

  // Skip bot's own messages to prevent infinite loop
  if (From_Account === process.env.IM_BOT_USERID) {
    return res.json({ ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: '' });
  }

  // Only process messages sent TO the bot
  if (To_Account !== process.env.IM_BOT_USERID) {
    return res.json({ ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: '' });
  }

  // Extract text content
  const textElem = MsgBody?.find((m: any) => m.MsgType === 'TIMTextElem');
  const userMessage = textElem?.MsgContent?.Text;

  if (!userMessage) {
    return res.json({ ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: '' });
  }

  // Call OpenClaw
  const aiReply = await callOpenClaw(userMessage, From_Account);

  // Send bot reply via Chat REST API
  await sendBotMessage(From_Account, aiReply);

  res.json({ ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: '' });
});
```

```typescript
// backend/src/services/openclaw.ts
export async function callOpenClaw(message: string, userId: string): Promise<string> {
  const response = await fetch(process.env.OPENCLAW_API_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openclaw:main',
      user: userId, // Maintains session context per user
      messages: [{ role: 'user', content: message }],
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
}
```

```typescript
// backend/src/services/chat-api.ts
// Uses Chat Server REST API: https://trtc.io/document/34620
export async function sendBotMessage(toUserId: string, text: string): Promise<void> {
  const sdkAppId = process.env.TRTC_SDK_APP_ID;
  const adminUserId = process.env.IM_ADMIN_USERID;
  const userSig = generateUserSig(adminUserId);

  const url = `https://console.tim.qq.com/v4/openim/sendmsg?sdkappid=${sdkAppId}&identifier=${adminUserId}&usersig=${userSig}&contenttype=json`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      SyncOtherMachine: 1,
      From_Account: process.env.IM_BOT_USERID,
      To_Account: toUserId,
      MsgRandom: Math.floor(Math.random() * 4294967295),
      MsgBody: [{
        MsgType: 'TIMTextElem',
        MsgContent: { Text: text },
      }],
    }),
  });
}
```

#### 1.4 IM Console Configuration

1. Go to [TRTC Console](https://console.trtc.io/app) → your app → Chat → Callback Configuration
2. Add callback URL: `https://your-ngrok-or-public-url/api/im/callback`
3. Enable callback: `C2C.CallbackAfterSendMsg`
4. Create bot user account `openclaw_bot` in Chat Console → Users

### Phase 2: Voice Chat — TRTC Conversational AI (Days 3-4)

Goal: User speaks in TRTC room → TRTC cloud handles STT → sends to OpenClaw as LLM → TTS audio back.

#### 2.1 Key Insight

TRTC `StartAIConversation` API accepts `LLMConfig` with OpenAI-compatible endpoint. OpenClaw Gateway exposes `/v1/chat/completions`. This means **TRTC cloud server directly calls OpenClaw** — your backend only triggers the task.

**Critical requirement**: OpenClaw must be accessible from the public internet (TRTC cloud needs to reach it). Since OpenClaw is deployed on Tencent Cloud Lighthouse with a public IP and reverse proxy, this is already satisfied. Use the HTTPS URL (e.g. `https://openclaw.your-domain.com/v1/chat/completions`) as the `APIUrl` in `LLMConfig`.

**Latency bonus**: When both Lighthouse and TRTC Conversational AI are in the same Tencent Cloud region (e.g. `ap-singapore`), the LLM call travels over Tencent's internal network — significantly lower latency than going through the public internet.

#### 2.2 Backend — StartAIConversation

```typescript
// backend/src/services/trtc-ai.ts
import * as tencentcloud from 'tencentcloud-sdk-nodejs-intl-en';
const TrtcClient = tencentcloud.trtc.v20190722.Client;

const client = new TrtcClient({
  credential: {
    secretId: process.env.TCLOUD_SECRET_ID!,
    secretKey: process.env.TCLOUD_SECRET_KEY!,
  },
  region: 'ap-singapore',
});

export async function startVoiceAI(roomId: string, targetUserId: string): Promise<string> {
  const botUserId = 'openclaw_ai_bot';
  const botUserSig = generateUserSig(botUserId);

  const result = await client.StartAIConversation({
    SdkAppId: Number(process.env.TRTC_SDK_APP_ID),
    RoomId: roomId,
    RoomIdType: 1, // string room ID

    AgentConfig: {
      UserId: botUserId,
      UserSig: botUserSig,
      TargetUserId: targetUserId,
      MaxIdleTime: 120,
      WelcomeMessage: 'Hi! I am your OpenClaw AI assistant. How can I help you?',
    },

    STTConfig: {
      Language: 'en',
      AlternativeLanguage: ['en', 'zh'],
    },

    LLMConfig: JSON.stringify({
      LLMType: 'openai',
      Model: 'openclaw:main',
      APIKey: process.env.OPENCLAW_GATEWAY_TOKEN,
      APIUrl: process.env.OPENCLAW_PUBLIC_URL, // Lighthouse HTTPS URL, e.g. https://openclaw.your-domain.com/v1/chat/completions
      Streaming: true,
      SystemPrompt: 'You are a helpful AI assistant. Keep responses concise for voice conversation. Respond in the same language the user speaks.',
    }),

    TTSConfig: JSON.stringify({
      TTSType: 'tencent',
      AppId: Number(process.env.TCLOUD_APP_ID),
      SecretId: process.env.TCLOUD_SECRET_ID,
      SecretKey: process.env.TCLOUD_SECRET_KEY,
      VoiceType: Number(process.env.TTS_VOICE_TYPE || 101001),
      Speed: Number(process.env.TTS_SPEED || 1.25),
      Volume: 5,
      PrimaryLanguage: 'en-US',
    }),

    SessionId: `voice_${roomId}_${Date.now()}`,
  });

  return result.TaskId;
}

export async function stopVoiceAI(taskId: string): Promise<void> {
  await client.StopAIConversation({ TaskId: taskId });
}

export async function describeVoiceAI(taskId: string): Promise<string> {
  const result = await client.DescribeAIConversation({ TaskId: taskId });
  return result.Status; // Idle | Preparing | InProgress | Stopped
}
```

```typescript
// backend/src/routes/voice.ts
router.post('/api/voice/start', async (req, res) => {
  const { roomId, userId } = req.body;
  const userSig = generateUserSig(userId);
  const taskId = await startVoiceAI(roomId, userId);

  res.json({ taskId, roomId, userSig, sdkAppId: process.env.TRTC_SDK_APP_ID });
});

router.post('/api/voice/stop', async (req, res) => {
  await stopVoiceAI(req.body.taskId);
  res.json({ success: true });
});

router.get('/api/voice/status/:taskId', async (req, res) => {
  const status = await describeVoiceAI(req.params.taskId);
  res.json({ status });
});
```

#### 2.3 Frontend — TRTC voice room + subtitle handling

```typescript
// frontend/src/services/trtc.ts
import TRTC from 'trtc-sdk-v5';

let trtc: any = null;
let currentTaskId: string | null = null;

export async function startVoiceMode(roomId: string, userId: string) {
  // 1. Request backend to get userSig and start AI task
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/voice/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, userId }),
  });
  const { taskId, userSig, sdkAppId } = await res.json();
  currentTaskId = taskId;

  // 2. Create TRTC instance and enter room
  trtc = TRTC.create();

  await trtc.enterRoom({
    roomId,
    sdkAppId: Number(sdkAppId),
    userId,
    userSig,
    scene: 'rtc',
  });

  // 3. Start microphone (speech quality, no camera)
  await trtc.startLocalAudio({ option: { profile: 'speech' } });

  // 4. Listen for AI bot remote audio (auto-played)
  trtc.on(TRTC.EVENT.REMOTE_AUDIO_AVAILABLE, ({ userId }: any) => {
    console.log(`AI bot audio available: ${userId}`);
  });

  // 5. Listen for custom messages (subtitles + AI state)
  trtc.on(TRTC.EVENT.CUSTOM_MESSAGE, (event: any) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(event.data));
      handleCustomMessage(data);
    } catch (e) {
      console.warn('Failed to parse custom message', e);
    }
  });

  return taskId;
}

function handleCustomMessage(data: any) {
  // Type 10000: Real-time subtitle (STT result / AI reply text)
  if (data.type === 10000) {
    const { text, role } = data.payload || {};
    if (text) {
      // Emit event for UI to display subtitle
      window.dispatchEvent(new CustomEvent('voice-subtitle', {
        detail: { text, role, timestamp: Date.now() },
      }));
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

export async function stopVoiceMode() {
  if (trtc) {
    await trtc.stopLocalAudio();
    await trtc.exitRoom();
    trtc.destroy();
    trtc = null;
  }

  if (currentTaskId) {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/voice/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: currentTaskId }),
    });
    currentTaskId = null;
  }
}
```

#### 2.4 Frontend — VoicePanel.vue

```vue
<!-- frontend/src/components/VoicePanel.vue -->
<template>
  <div class="voice-panel">
    <div class="status-indicator" :class="aiState">
      <span class="status-dot" />
      <span class="status-text">{{ aiState }}</span>
    </div>

    <div class="subtitle-area">
      <div v-for="(line, i) in subtitles" :key="i" :class="['subtitle-line', line.role]">
        <span class="role-tag">{{ line.role === 'user' ? 'You' : 'AI' }}</span>
        <span>{{ line.text }}</span>
      </div>
    </div>

    <div class="controls">
      <button v-if="!isActive" @click="start" class="btn-start">Start Voice Chat</button>
      <button v-else @click="stop" class="btn-stop">End Conversation</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { startVoiceMode, stopVoiceMode } from '../services/trtc';

const props = defineProps<{ userId: string }>();

const isActive = ref(false);
const aiState = ref('idle');
const subtitles = ref<{ text: string; role: string }[]>([]);

function onSubtitle(e: Event) {
  const { text, role } = (e as CustomEvent).detail;
  subtitles.value.push({ text, role });
  // Keep last 20 lines
  if (subtitles.value.length > 20) subtitles.value.shift();
}

function onState(e: Event) {
  aiState.value = (e as CustomEvent).detail.state;
}

onMounted(() => {
  window.addEventListener('voice-subtitle', onSubtitle);
  window.addEventListener('voice-state', onState);
});

onUnmounted(() => {
  window.removeEventListener('voice-subtitle', onSubtitle);
  window.removeEventListener('voice-state', onState);
  if (isActive.value) stopVoiceMode();
});

async function start() {
  const roomId = `voice_${props.userId}_${Date.now()}`;
  await startVoiceMode(roomId, props.userId);
  isActive.value = true;
}

async function stop() {
  await stopVoiceMode();
  isActive.value = false;
  aiState.value = 'idle';
}
</script>
```

### Phase 3: Chat + Voice Sync (Day 5)

Goal: Voice conversation transcripts are stored in Chat IM history.

#### 3.1 Approach

When the frontend receives TRTC custom messages (subtitles), it also writes them to Chat IM as custom messages. This creates a unified conversation history visible in the Chat UIKit.

```typescript
// frontend/src/services/chat-sync.ts
import TencentCloudChat from '@tencentcloud/chat';

let chatSDK: any = null;

export function initChatSync(sdkAppId: number, userId: string, userSig: string) {
  chatSDK = TencentCloudChat.create({ SDKAppID: sdkAppId });
  chatSDK.login({ userID: userId, userSig });
}

export async function syncVoiceTranscript(text: string, role: 'user' | 'assistant') {
  if (!chatSDK) return;

  const botUserId = 'openclaw_bot';
  const message = chatSDK.createCustomMessage({
    to: botUserId,
    conversationType: TencentCloudChat.TYPES.CONV_C2C,
    payload: {
      data: JSON.stringify({
        source: 'voice_conversation',
        role,
        text,
        timestamp: Date.now(),
      }),
      description: text, // Shown as fallback in chat list
      extension: 'voice_transcript',
    },
  });

  await chatSDK.sendMessage(message);
}
```

#### 3.2 Wire subtitle events to Chat sync

In `VoicePanel.vue`, update the subtitle handler:

```typescript
import { syncVoiceTranscript } from '../services/chat-sync';

function onSubtitle(e: Event) {
  const { text, role } = (e as CustomEvent).detail;
  subtitles.value.push({ text, role });

  // Sync to Chat IM
  syncVoiceTranscript(text, role);
}
```

### Phase 4: Polish (Day 6)

- [ ] Add loading states and error boundaries
- [ ] AI state animations (pulsing dot for listening, spinner for thinking, waveform for speaking)
- [ ] Responsive layout for mobile
- [ ] OpenClaw branding / logo
- [ ] Session context: pass `user` field in OpenClaw calls so conversations persist
- [ ] Handle TRTC Conversational AI error codes (display to user with guidance)
- [ ] Clean up on page unload (stop AI task, exit room)

## Prerequisites Checklist

### Tencent Cloud Console

- [ ] Create TRTC application → get `SDKAppID` and `SDKSecretKey`
- [ ] Activate Conversational AI feature (may require beta application)
- [ ] Purchase RTC-Engine Monthly Package (Starter+) to enable STT
- [ ] Get Tencent Cloud API credentials (`SecretId`, `SecretKey`) from [CAM Console](https://console.tencentcloud.com/cam/capi)
- [ ] Chat: create bot user account `openclaw_bot` in Chat Console → Users
- [ ] Chat: create test user account(s) for demo
- [ ] Chat: configure IM callback URL in Console → Callback Configuration → enable `C2C.CallbackAfterSendMsg`
- [ ] (If using Tencent TTS) Activate TTS service at [TTS Console](https://console.tencentcloud.com/tts)

### OpenClaw Gateway (Tencent Cloud Lighthouse)

OpenClaw runs on a Lighthouse instance with a public IP. TRTC Cloud calls it directly for the voice path, and your local backend calls it for the text chat path.

#### Lighthouse Instance Setup

- [ ] Create Lighthouse instance in **Singapore region** (same region as TRTC `ap-singapore` to minimize latency)
- [ ] Recommended specs: 2 vCPU / 4 GB RAM / Ubuntu 22.04 or 24.04
- [ ] Note the public IP (e.g. `43.xxx.xxx.xxx`)

#### Install OpenClaw on Lighthouse

```bash
# SSH into Lighthouse
ssh ubuntu@43.xxx.xxx.xxx

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install OpenClaw
npm install -g openclaw@latest

# Run onboarding
openclaw onboard --install-daemon
```

#### OpenClaw Gateway Config

```bash
# Edit config
nano ~/.openclaw/openclaw.json
```

```json
{
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "auth": {
      "mode": "token",
      "token": "your-secure-gateway-token"
    },
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

Key points:
- `bind: "0.0.0.0"` — listen on all interfaces (required for external access)
- `auth.mode: "token"` — protect the endpoint with a bearer token
- `chatCompletions.enabled: true` — expose the OpenAI-compatible HTTP API

#### Reverse Proxy (Caddy — recommended for auto HTTPS)

Use Caddy for automatic TLS certificate via Let's Encrypt. This gives you a stable HTTPS URL.

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Caddyfile
sudo tee /etc/caddy/Caddyfile <<'EOF'
openclaw.your-domain.com {
    reverse_proxy localhost:18789
}
EOF

sudo systemctl restart caddy
```

If you don't have a domain, you can use the Lighthouse public IP directly with Nginx:

```bash
sudo apt install nginx

# /etc/nginx/sites-available/openclaw
server {
    listen 443 ssl;
    server_name 43.xxx.xxx.xxx;

    # Use self-signed cert or skip TLS (HTTP only, less secure)
    # For quick demo, HTTP is acceptable:
    listen 80;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 300s;  # LLM streaming can be slow
    }
}
```

#### Lighthouse Firewall Rules

Configure in [Lighthouse Console](https://console.tencentcloud.com/lighthouse) → Firewall:

| Protocol | Port | Source | Purpose |
|----------|------|--------|---------|
| TCP | 22 | Your IP | SSH access |
| TCP | 80 | 0.0.0.0/0 | HTTP (Caddy redirect) |
| TCP | 443 | 0.0.0.0/0 | HTTPS (Caddy → OpenClaw) |

Do NOT expose port 18789 directly — always go through the reverse proxy.

#### Process Management (systemd)

```bash
# Create systemd service
sudo tee /etc/systemd/system/openclaw.service <<'EOF'
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/openclaw gateway
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable openclaw
sudo systemctl start openclaw
```

#### Verify Deployment

```bash
# From your local machine
curl https://openclaw.your-domain.com/v1/chat/completions \
  -H 'Authorization: Bearer your-secure-gateway-token' \
  -H 'Content-Type: application/json' \
  -d '{"model":"openclaw:main","messages":[{"role":"user","content":"hello"}]}'
```

Expected: JSON response with AI-generated reply.

### Local Development

- [ ] Node.js ≥ 18
- [ ] Install frontend deps: `cd frontend && npm install`
- [ ] Install backend deps: `cd backend && npm install`
- [ ] Copy `.env.example` to `.env` and fill in values
- [ ] Verify OpenClaw on Lighthouse is reachable: `curl https://openclaw.your-domain.com/v1/chat/completions ...`
- [ ] For IM Callback during local dev: use ngrok to expose backend port 3000 (only needed for text chat path)

## Running the Project

```bash
# OpenClaw is already running on Lighthouse (systemd managed)
# Verify it's up:
curl https://openclaw.your-domain.com/v1/chat/completions \
  -H 'Authorization: Bearer your-token' \
  -H 'Content-Type: application/json' \
  -d '{"model":"openclaw:main","messages":[{"role":"user","content":"ping"}]}'

# Terminal 1: Backend
cd backend
npm run dev
# Starts on http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm run dev
# Starts on http://localhost:5173

# Terminal 3 (for local dev): ngrok tunnel for IM callback only
ngrok http 3000
# Copy the https URL → update IM Console callback URL
# e.g. https://xxxx.ngrok-free.app/api/im/callback
```

> **Note**: Unlike the previous local-only plan, you no longer need an ngrok tunnel for OpenClaw.
> The Lighthouse public IP / domain is directly accessible by both your backend and TRTC Cloud.
> You only need ngrok for the IM Callback webhook (your local backend receiving IM server pushes).

## API Reference Quick Links

| API | Doc URL |
|-----|---------|
| Chat UIKit Vue integration | https://trtc.io/document/58644?product=chat&menulabel=uikit&platform=vue |
| Chat REST API (sendmsg) | https://trtc.io/document/34620?product=chat&menulabel=restfulapi |
| TRTC Web SDK Quick Start | https://trtc.io/document/35607?platform=web&product=rtcengine |
| TRTC Web SDK Integration Guide | https://trtc.io/document/59649?platform=web&product=rtcengine |
| StartAIConversation API | https://trtc.io/document/64963?product=rtcengine |
| StopAIConversation API | https://trtc.io/document/64965?product=rtcengine |
| DescribeAIConversation API | https://trtc.io/document/64964?product=rtcengine |
| AI Conversation Callbacks (custom msg) | https://trtc.io/document/65317?product=rtcengine |
| Conversational AI Quick Run-Through | https://trtc.io/document/68337?product=rtcengine |
| LLMConfig / TTSConfig reference | https://trtc.io/document/65320?product=rtcengine |
| OpenClaw Docs | https://docs.openclaw.ai/ |
| OpenClaw OpenAI HTTP API | https://docs.openclaw.ai/gateway/openai-http-api |

## Key Implementation Notes

### Avoiding infinite message loops (Phase 1)

The IM callback handler MUST filter out messages sent by the bot itself. Check `From_Account !== IM_BOT_USERID` and only process messages where `To_Account === IM_BOT_USERID`.

### OpenClaw session management

OpenClaw HTTP API is stateless by default. To maintain conversation context across multiple messages, pass the `user` field with a consistent user identifier. OpenClaw derives a stable session key from this.

```json
{
  "model": "openclaw:main",
  "user": "user_12345",
  "messages": [{"role": "user", "content": "hello"}]
}
```

For voice mode, TRTC Conversational AI manages the full conversation context internally within a single task session — each `StartAIConversation` call creates a self-contained session.

### TRTC Custom Message format (voice subtitles)

TRTC Conversational AI sends status through `onCustomMessage` with `cmdID = 1`:

```json
// Type 10000: Subtitle
{
  "type": 10000,
  "sender": "openclaw_ai_bot",
  "payload": { "text": "Hello, how can I help?", "role": "assistant" }
}

// Type 10001: State change
{
  "type": 10001,
  "sender": "openclaw_ai_bot",
  "payload": {
    "roundid": "conversation_789012",
    "timestamp": 1629384755,
    "state": 2
  }
}
// States: 1=listening, 2=thinking, 3=speaking, 4=interrupted
```

### LLMConfig points to OpenClaw

The magic of Plan B: TRTC's `LLMConfig.LLMType = "openai"` accepts any OpenAI-compatible endpoint. OpenClaw's `/v1/chat/completions` fits perfectly. TRTC cloud server calls OpenClaw directly — no audio routing through your backend.

```json
{
  "LLMType": "openai",
  "Model": "openclaw:main",
  "APIKey": "your-openclaw-gateway-token",
  "APIUrl": "https://openclaw.your-domain.com/v1/chat/completions",
  "Streaming": true
}
```

Since OpenClaw is on Lighthouse (same Tencent Cloud network as TRTC), the LLM call from TRTC Conversational AI stays on the internal network when both are in the same region — no public internet hop, minimal added latency.

### Chat REST API domain

For international (non-China) apps, the Chat REST API base URL is:
`https://console.tim.qq.com/v4/`

The `sendmsg` endpoint: `v4/openim/sendmsg`

Full URL pattern: `https://console.tim.qq.com/v4/openim/sendmsg?sdkappid={SDKAppID}&identifier={admin}&usersig={adminUserSig}&contenttype=json`

## Deployment Topology

### Current Setup (Dev)

```
Your Mac (localhost)              Tencent Cloud Lighthouse (Singapore)
┌──────────────────────┐          ┌──────────────────────┐
│ Frontend :5173       │          │ Caddy :443 (HTTPS)   │
│ Backend  :3000       │───────── │   └→ OpenClaw :18789 │
│                      │  HTTPS   │                      │
└──────────────────────┘          └──────────┬───────────┘
       │                                     │
       │ ngrok (IM callback only)            │ Tencent internal network
       ▼                                     ▼
┌──────────────────────┐          ┌──────────────────────┐
│ Tencent IM Server    │          │ TRTC Conversational  │
│ (callback webhook)   │          │ AI (STT→LLM→TTS)    │
└──────────────────────┘          └──────────────────────┘
```

### Production Option: Colocate Backend on Lighthouse

For production or a clean demo setup, you can deploy the backend to the same Lighthouse instance (or a second one). This eliminates the ngrok dependency entirely:

```bash
# On Lighthouse, alongside OpenClaw:
cd /home/ubuntu/openclaw-trtc-demo/backend
npm install && npm run build
pm2 start dist/app.js --name demo-backend

# Update Caddy to also proxy the backend:
# /etc/caddy/Caddyfile
openclaw.your-domain.com {
    reverse_proxy localhost:18789
}
demo.your-domain.com {
    reverse_proxy localhost:3000
}
```

Then update IM Console callback URL to `https://demo.your-domain.com/api/im/callback` — no more ngrok.

### OpenClaw Lighthouse Maintenance

```bash
# Check status
sudo systemctl status openclaw

# View logs
sudo journalctl -u openclaw -f

# Update OpenClaw
npm update -g openclaw@latest
sudo systemctl restart openclaw

# Restart after config change
sudo systemctl restart openclaw
```

