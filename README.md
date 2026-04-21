# IMOpenClaw Demo

**English** · [简体中文](README.zh-CN.md)

Real-time **text chat + voice conversation** with an OpenClaw AI agent, powered by Tencent Cloud Chat (IM) + TRTC Conversational AI.

Currently ships three agent scenarios: **QuickCafé barista**, **medical clinic**, and **airport concierge**. Agents are plugins — adding a new scenario is a self-contained change (no need to touch routing / SDK integration code). See the [Add a New Agent Scenario](#add-a-new-agent-scenario) guide below.

> For the full architecture rationale, Tencent Cloud deployment steps, and design decisions, see [Claude.md](Claude.md). This README is the engineer onboarding doc.

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Access to the Tencent Cloud TRTC app + Chat app + OpenClaw Lighthouse instance (ask Ricky for credentials)
- `ngrok` (or equivalent) if you need the IM callback reachable during local dev

### 1. Clone & install

```bash
git clone git@github.com:rickyuan/IMOpenClaw.git
cd IMOpenClaw
npm install                    # root concurrency runner
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Configure environment

Create two env files from the root [.env.example](.env.example):

```bash
# backend/.env  (credentials — ask Ricky)
TRTC_SDK_APP_ID=...
TRTC_SDK_SECRET_KEY=...
TENCENT_SECRET_ID=...
TENCENT_SECRET_KEY=...
TCLOUD_APP_ID=...
OPENCLAW_API_URL=https://openclaw.<domain>/v1/chat/completions
OPENCLAW_PUBLIC_URL=https://openclaw.<domain>/v1/chat/completions
OPENCLAW_GATEWAY_TOKEN=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
IM_ADMIN_USERID=administrator
IM_BOT_USERID=openclaw_bot
PORT=3000

# frontend/.env
VITE_BACKEND_URL=http://localhost:3000
VITE_SDK_APP_ID=<same as TRTC_SDK_APP_ID>
```

### 3. Run dev servers

```bash
# From repo root — starts backend on :3000 and frontend on :5173 concurrently
npm run dev
```

Other root scripts:
```bash
npm run build       # build backend + frontend
npm run test        # vitest in both packages
npm run typecheck   # tsc + vue-tsc noEmit
```

### 4. (Optional) Expose backend for IM callbacks

The IM server (Tencent Cloud) pushes `C2C.CallbackAfterSendMsg` webhooks to the backend for text chat. During local dev:

```bash
ngrok http 3000
# Then go to TRTC Console → Chat → Callback Configuration
# and set callback URL to https://<ngrok>.ngrok-free.app/api/im/callback
```

Voice mode does **not** need the tunnel — TRTC Cloud calls OpenClaw directly on Lighthouse.

---

## Architecture at a Glance

```
Browser (Vue 3 + TUIKit + trtc-sdk-v5)
   │ text path                    │ voice path
   ▼                              ▼
Express backend (:3000)      TRTC Cloud (STT → LLM → TTS)
   │                              │
   │ /v1/chat/completions         │ /v1/chat/completions (direct)
   ▼                              ▼
OpenClaw Gateway on Tencent Cloud Lighthouse (HTTPS via Caddy)
```

- **Text chat**: user message → IM callback → backend → OpenClaw → `sendmsg` REST → bot reply appears in UIKit.
- **Voice chat**: `StartAIConversation` spins up a TRTC-managed bot that handles STT + LLM (pointed at OpenClaw) + TTS entirely server-side. Frontend only joins the audio room and renders subtitles from `CUSTOM_MESSAGE` events.
- **Cards**: The LLM replies with natural language; backend agents detect intent (e.g. "delivery or pickup?" → show Order card) and attach a structured card payload via IM `CloudCustomData`. Frontend renders the right Vue component for the card type.

---

## Directory Layout

```
IMOpenClaw/
├── backend/src/
│   ├── app.ts              # Express entry
│   ├── config.ts           # Env loading + feature flags
│   ├── routes/             # auth, callback, voice, models, google-auth
│   ├── services/           # openclaw, chat-api, trtc-ai, usersig, google-calendar
│   ├── agents/             # ⭐ Agent plugins — barista/ medical/ airport/ + registry.ts
│   ├── middleware/
│   ├── providers/          # External provider adapters (TTS etc.)
│   └── state/              # In-memory per-user state helpers
├── frontend/src/
│   ├── App.vue
│   ├── components/
│   │   ├── ChatPanel.vue   # Wraps TUIKit
│   │   ├── VoicePanel.vue  # TRTC audio + subtitles
│   │   ├── ModeSwitch.vue  # Text ⇄ Voice toggle
│   │   └── cards/          # Shared card components (MenuCard, OrderCard, …)
│   ├── agents/             # ⭐ Frontend agent UI plugins + registry.ts
│   ├── services/           # api, trtc, chat-sync
│   └── TUIKit/             # Vendored Tencent Chat UIKit
├── demoflow/               # Demo scripts, system prompts, knowledge bases (reference material, not loaded at runtime)
├── api/                    # Vercel serverless adapter
├── Claude.md               # Full design doc — read this for architecture depth
└── .env.example            # Env var template
```

---

## Add a New Agent Scenario

An "agent" = a full demo persona (barista, doctor, flight concierge, …). Each agent is a plugin in both `backend/src/agents/` and `frontend/src/agents/`. No changes to routing, TRTC, or OpenClaw glue code are required.

### Mental model

- **Backend plugin** ([AgentPlugin](backend/src/agents/types.ts)) — owns the system prompts, decides which card to trigger based on AI replies, extracts structured data (order details / appointment info / etc.) from conversation history, cleans up markdown leakage for IM display, and manages per-user session state.
- **Frontend plugin** ([AgentUIPlugin](frontend/src/agents/types.ts)) — owns the theme color + icon + the Vue components used to render each card type.
- The two sides are linked by a shared **agent id** (e.g. `'barista'`) and matching **card type strings** (e.g. `'menu_card'`).

Use [backend/src/agents/barista/index.ts](backend/src/agents/barista/index.ts) and [frontend/src/agents/barista/index.ts](frontend/src/agents/barista/index.ts) as your reference implementation — it's the most feature-complete example (3 cards, bilingual detection, order extraction).

### Step-by-step

#### 1. Pick an id & design the cards

Decide:
- `id` — lowercase, no spaces, e.g. `'hotel'`, `'banking'`, `'travel'`.
- Which card types you need, e.g. `'booking_card'`, `'payment_card'`, `'confirmation_card'`.
- When each card should trigger (what phrase in the AI reply means "show the booking card now").

#### 2. Create the backend plugin

```
backend/src/agents/<your-id>/
  └── index.ts
```

Export an `AgentPlugin` object (see [types.ts](backend/src/agents/types.ts) for the full interface):

```ts
import type { AgentPlugin, CardTrigger } from '../types';

const TEXT_SYSTEM_PROMPT = `You are ...`;           // Full prompt with data, rules, flow
const VOICE_SYSTEM_PROMPT = `You are ... Keep ...`; // Shorter, TTS-friendly
const VOICE_WELCOME_MESSAGE = 'Hi! I am ...';

const userShownCards = new Map<string, Set<string>>();
const userConversations = new Map<string, string[]>();

export const myAgent: AgentPlugin = {
  id: 'myagent',
  name: 'MyAgent',
  subtitle: 'What it does',
  icon: 'sparkles',
  themeColor: '#1E88E5',
  textSystemPrompt: TEXT_SYSTEM_PROMPT,
  voiceSystemPrompt: VOICE_SYSTEM_PROMPT,
  voiceWelcomeMessage: VOICE_WELCOME_MESSAGE,

  trackMessage(userId, role, text) {
    // Append to per-user conversation log; keep last ~20 turns
  },

  detectCard(userId, reply): CardTrigger | null {
    // Inspect the AI reply text; if it matches a card trigger phrase,
    // return { type, data, description }. Otherwise return null.
    //
    // Use a per-user "shown cards" Set so the same card doesn't fire twice
    // in one flow. See barista/index.ts for the pattern.
  },

  cleanDisplayText(text) {
    // Strip markdown / leaked instructions before showing in IM.
    // For a minimal agent, `return text;` is fine.
  },

  resetSession(userId) {
    userShownCards.delete(userId);
    userConversations.delete(userId);
  },
};
```

Then register it in [backend/src/agents/registry.ts](backend/src/agents/registry.ts):

```ts
import { myAgent } from './myagent';
// ...
registerAgent(myAgent);
```

#### 3. Create the frontend plugin & cards

Card components go in [frontend/src/components/cards/](frontend/src/components/cards/) (keep them there if they might be reused; agent-specific ones can live under `frontend/src/agents/<id>/cards/`). Copy an existing card like [MenuCard.vue](frontend/src/components/cards/MenuCard.vue) as a template — it shows the `defineProps<{ data: ... }>()` pattern and the styling conventions.

Then create:

```
frontend/src/agents/<your-id>/
  └── index.ts
```

```ts
import type { AgentUIPlugin } from '../types';
import BookingCard from '../../components/cards/BookingCard.vue';
import ConfirmationCard from '../../components/cards/ConfirmationCard.vue';

export const myAgentUI: AgentUIPlugin = {
  id: 'myagent',                       // MUST match backend id
  name: 'MyAgent',
  icon: 'sparkles',
  subtitle: 'What it does',
  themeColor: '#1E88E5',
  themeColorSecondary: '#1565C0',
  cardComponents: {
    booking_card: BookingCard,         // keys MUST match CardTrigger.type from backend
    confirmation_card: ConfirmationCard,
  },
};
```

Register in [frontend/src/agents/registry.ts](frontend/src/agents/registry.ts):

```ts
import { myAgentUI } from './myagent';
// ...
registerAgentUI(myAgentUI);
```

#### 4. Run & iterate

```bash
npm run dev
```

- Open http://localhost:5173, switch to your agent from the top nav.
- Type the conversation flow. Watch the backend logs — the agent logs each card trigger.
- If a card isn't firing: check your trigger phrases in `detectCard()` actually match what the LLM says (LLMs are chatty; use broad `.includes()` matches).
- If a card is firing twice: make sure you added it to the `shownCards` Set.
- If markdown is leaking into the IM bubble: extend `cleanDisplayText()` (see [barista/index.ts](backend/src/agents/barista/index.ts) `stripMarkdownSummary` for regex patterns that already handle most cases).
- Test voice mode too — the voice system prompt should be shorter since it goes through TTS.

#### 5. Add unit tests (recommended)

[backend/src/agents/registry.test.ts](backend/src/agents/registry.test.ts) is a good starting point. Agents are pure functions over conversation state, so they're easy to unit-test — assert that a given reply string triggers the expected card type.

```bash
cd backend && npm test
```

### Checklist before opening a PR

- [ ] Backend agent registered in `backend/src/agents/registry.ts`
- [ ] Frontend UI registered in `frontend/src/agents/registry.ts`
- [ ] Agent `id` matches on both sides
- [ ] Card type strings match on both sides
- [ ] Text + voice system prompts both present
- [ ] `resetSession()` clears all `Map` state for the user
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] Manually verified text mode + voice mode + card triggers

---

## Deployment

- **Frontend**: Vercel (see [vercel.json](vercel.json))
- **Backend**: Same Vercel project via [api/index.ts](api/index.ts) serverless adapter, OR run long-lived on Tencent Cloud Lighthouse alongside OpenClaw (see [Claude.md](Claude.md#production-option-colocate-backend-on-lighthouse))
- **OpenClaw**: systemd-managed on Lighthouse, fronted by Caddy (auto HTTPS). See [Claude.md](Claude.md#openclaw-gateway-tencent-cloud-lighthouse) for the full install flow

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Chat bubbles don't reply | IM callback URL reachable? `ngrok` up? `openclaw_bot` user exists in Chat console? |
| Voice mode stuck on "connecting" | TRTC app has Conversational AI enabled + RTC-Engine package purchased? |
| Voice bot silent | `OPENCLAW_PUBLIC_URL` is HTTPS and reachable from the public internet? Check Lighthouse firewall. |
| Cards never show | `detectCard()` trigger phrases match the actual LLM output? (Add `console.log(reply)` to debug.) |
| Card shows but is empty | Backend card `type` string matches a key in frontend `cardComponents`? |

---

## Useful links

- Tencent Cloud TRTC Console: https://console.trtc.io/app
- StartAIConversation API: https://trtc.io/document/64963
- OpenClaw docs: https://docs.openclaw.ai/
- Full design doc: [Claude.md](Claude.md)
