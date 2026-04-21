# IMOpenClaw Demo

**English** · [简体中文](README.zh-CN.md)

Real-time **text chat + voice conversation** with an OpenClaw AI agent, powered by Tencent Cloud Chat (IM) + TRTC Conversational AI.

Currently ships three agent scenarios: **QuickCafé barista**, **medical clinic**, **airport concierge**. Agents are plugins — new scenarios are self-contained changes.

> For architecture depth and Tencent Cloud deployment details see [Claude.md](Claude.md). **This README is written to be fed to an AI coding assistant** (Claude Code, Cursor, etc.) along with copy-pasteable prompts below.

---

## Architecture at a Glance

```
Browser (Vue 3 + TUIKit + trtc-sdk-v5)
   │ text path                     │ voice path
   ▼                               ▼
Express backend (:3000)      TRTC Cloud (STT → LLM → TTS)
   │                               │
   │ /v1/chat/completions          │ /v1/chat/completions (direct call)
   ▼                               ▼
OpenClaw Gateway on Tencent Lighthouse (HTTPS via Caddy)
```

- **Text**: user msg → IM webhook (`C2C.CallbackAfterSendMsg`) → backend → OpenClaw → IM `sendmsg` REST → UIKit renders bot reply.
- **Voice**: `StartAIConversation` spins up a TRTC-managed bot doing STT + LLM (pointed at OpenClaw) + TTS server-side. Frontend joins the audio room and renders subtitles from `CUSTOM_MESSAGE` events.
- **Cards**: LLM replies naturally; backend agents detect intent (e.g. `"delivery or pickup?"` → Order card) and attach structured payload via IM `CloudCustomData`. Frontend renders the registered Vue component for each card type.
- **Link between backend and frontend agent**: shared `id` string (`'barista'`) and shared card type strings (`'menu_card'`).

---

## Directory Layout

```
IMOpenClaw/
├── backend/src/
│   ├── app.ts              # Express entry
│   ├── config.ts           # Env loading
│   ├── routes/             # auth, callback, voice, models, google-auth
│   ├── services/           # openclaw, chat-api, trtc-ai, usersig, google-calendar
│   ├── agents/             # ⭐ Agent plugins — barista/ medical/ airport/ + registry.ts + types.ts
│   ├── middleware/
│   ├── providers/          # TTS adapters
│   └── state/              # Per-user in-memory state
├── frontend/src/
│   ├── App.vue
│   ├── components/
│   │   ├── ChatPanel.vue   # Wraps TUIKit
│   │   ├── VoicePanel.vue  # TRTC audio + subtitles
│   │   ├── ModeSwitch.vue
│   │   └── cards/          # ⭐ Shared card components
│   ├── agents/             # ⭐ Frontend UI plugins + registry.ts + types.ts
│   ├── services/           # api, trtc, chat-sync
│   └── TUIKit/             # Vendored Tencent Chat UIKit
├── demoflow/               # Reference material: demo scripts, system prompts, KBs (not runtime-loaded)
├── api/index.ts            # Vercel serverless adapter
├── Claude.md               # Full design doc
└── .env.example            # Env template
```

**Reference implementations to model new work on:**
- Backend agent: [backend/src/agents/barista/index.ts](backend/src/agents/barista/index.ts)
- Frontend UI plugin: [frontend/src/agents/barista/index.ts](frontend/src/agents/barista/index.ts)
- Card component: [frontend/src/components/cards/MenuCard.vue](frontend/src/components/cards/MenuCard.vue)
- Plugin interfaces: [backend/src/agents/types.ts](backend/src/agents/types.ts), [frontend/src/agents/types.ts](frontend/src/agents/types.ts)
- Agent unit test: [backend/src/agents/registry.test.ts](backend/src/agents/registry.test.ts)

---

## Development Modes

### Mode A — Push and verify on Vercel (no local setup, no secrets needed)

Viable for **frontend-only** changes (card components, styling, UI interactions). Flow:
1. `git checkout -b feature/xyz`
2. Make changes, push branch
3. Vercel auto-builds a preview URL → open it, test
4. Open PR, merge to `main` → prod deploys automatically

**Gotcha — IM callback is global.** The TRTC Console's `C2C.CallbackAfterSendMsg` URL points at **one** deployment at a time (prod by default). So on branch preview URLs, text-chat bot replies won't reflect your backend changes — they go through prod's backend. Use Mode B, or coordinate a temporary callback URL swap, for backend testing.

### Mode B — Local dev (fast iteration, backend changes)

Requires secrets from Ricky (`backend/.env` + `frontend/.env`).

```bash
git clone git@github.com:rickyuan/IMOpenClaw.git
cd IMOpenClaw
npm install && (cd backend && npm install) && (cd frontend && npm install)
# Fill in backend/.env and frontend/.env (see .env.example)
npm run dev                 # backend :3000 + frontend :5173 concurrently
```

For IM callbacks to reach your local backend: `ngrok http 3000`, then update the TRTC Console callback URL. Voice mode doesn't need the tunnel (TRTC Cloud calls OpenClaw directly on Lighthouse).

Other root scripts: `npm run build`, `npm run test`, `npm run typecheck`.

### Zero-secret local verification (agent logic only)

Agent plugins are pure functions over conversation state. You can validate them with no secrets:

```bash
cd backend && npm run test     # vitest — agent registry + detection tests
cd backend && npx tsc --noEmit
cd frontend && npx vue-tsc --noEmit
```

---

## AI Prompts

Copy-paste these into Claude Code / Cursor / any AI assistant running in the repo. Each prompt is self-contained — the AI reads the reference files itself.

### Prompt 1 — Add a new agent scenario

```
I'm adding a new agent scenario to this repo.

Read these first for context:
- README.md (you're here)
- backend/src/agents/types.ts — AgentPlugin interface
- frontend/src/agents/types.ts — AgentUIPlugin interface
- backend/src/agents/barista/index.ts — reference backend implementation
- frontend/src/agents/barista/index.ts — reference frontend implementation
- backend/src/agents/registry.test.ts — test pattern

## Agent spec (fill in before running)

- id: <lowercase, no spaces — e.g. hotel>
- Display name: <e.g. LuxStay>
- Subtitle: <e.g. AI Concierge>
- Icon: <emoji or lucide name>
- Theme color primary / secondary: <hex> / <hex>
- Cards: <card_type_1>, <card_type_2>, ... (snake_case — e.g. room_card, booking_card, confirmation_card)
- Trigger rules:
  - <card_type_1>: when AI says <phrase / pattern — EN + ZH if bilingual>
  - <card_type_2>: when AI says <phrase>
  - ...
- Conversation flow (for textSystemPrompt):
  <describe steps: greet → collect A → collect B → confirm → done>
- Data the cards need (for detectCard to extract from conversation):
  <e.g. check-in date, room type, guest count>

## Tasks

1. Create backend/src/agents/<id>/index.ts exporting an AgentPlugin:
   - textSystemPrompt: full prompt with rules + data + flow (model length after barista)
   - voiceSystemPrompt: short, TTS-friendly version
   - voiceWelcomeMessage: one opening line spoken when voice starts
   - trackMessage: push `${role}: ${text}` into a per-user Map<string, string[]>, cap at 20
   - detectCard: inspect reply text, return CardTrigger or null; use a per-user Set<string> of shown card types to prevent duplicates within one flow; clear the Set when the flow restarts (e.g. new menu / new booking)
   - cleanDisplayText: start with `return text;` — expand only if LLM leaks markdown into IM bubbles
   - resetSession: delete all this agent's Map entries for the userId

2. Register in backend/src/agents/registry.ts (import + registerAgent()).

3. Create any new card components under frontend/src/components/cards/<Name>Card.vue. Copy MenuCard.vue for simple list cards, OrderCard.vue for summary cards. Use `defineProps<{ data: ... }>()`.

4. Create frontend/src/agents/<id>/index.ts exporting an AgentUIPlugin. cardComponents keys MUST match the CardTrigger.type strings from step 1.

5. Register in frontend/src/agents/registry.ts (import + registerAgentUI()).

6. Add tests in backend/src/agents/registry.test.ts: for each card type, construct a conversation that ends with a trigger phrase and assert detectCard returns the expected type; also assert it does NOT trigger on a phrase that shouldn't.

## Acceptance criteria — verify all before stopping

- [ ] `cd backend && npm test` passes
- [ ] `cd backend && npx tsc --noEmit` passes
- [ ] `cd frontend && npx vue-tsc --noEmit` passes
- [ ] Agent id is byte-identical on both sides
- [ ] Every CardTrigger.type your detectCard returns has a matching key in cardComponents
- [ ] resetSession clears every Map the agent uses (no leaks between sessions)
- [ ] Both textSystemPrompt and voiceSystemPrompt exist and are non-trivial

Report the files you changed + test output when done.
```

### Prompt 2 — Add a new card type to an existing agent

```
Add a new card type to the <agent_id> agent.

Read:
- backend/src/agents/<agent_id>/index.ts
- frontend/src/agents/<agent_id>/index.ts
- Any existing card under frontend/src/components/cards/ as a styling reference

## Card spec

- type string: <snake_case, e.g. receipt_card>
- Shown when: <trigger phrase or condition in AI reply>
- Data shape: <TS interface — fields the card renders>
- Extracted from: <conversation history / prior card data / constant>

## Tasks

1. Add a new branch in detectCard() for this card type, guarded by a shownCards.has(<key>) check.
2. If data needs extraction from conversation, add an extract<Name>Details(userId) helper like extractOrderDetails in barista.
3. Create frontend/src/components/cards/<Name>Card.vue. Use defineProps<{ data: <interface> }>() and match the styling of existing cards.
4. Register the card in frontend/src/agents/<agent_id>/index.ts cardComponents.
5. Extend the registry test with an assertion that this card triggers on the expected phrase.

## Acceptance criteria

- [ ] `cd backend && npm test` passes
- [ ] typecheck passes on both sides
- [ ] Card type string is identical in backend detectCard return and frontend cardComponents key
```

### Prompt 3 — Debug "card isn't showing up"

```
A card isn't appearing in the UI for agent <id> / card type <card_type>.

Read:
- backend/src/agents/<id>/index.ts detectCard() branch for this card
- frontend/src/agents/<id>/index.ts cardComponents
- backend/src/routes/callback.ts (where detectCard is called and the card is sent)

Run these checks and report findings:
1. Add a temporary console.log of (reply, cardType) at the top of detectCard — push to a branch, deploy to Vercel preview if needed, trigger the conversation, check logs. What phrase is the LLM actually generating? Do the trigger substrings match?
2. Is the card type returned from detectCard identical to a key in the frontend cardComponents (including underscores, case)?
3. Is shownCards blocking re-trigger? Is resetSession being called when expected?
4. Is the CloudCustomData actually being attached to the outgoing message in callback.ts? Check the Tencent IM Console message log for the bot's reply — does it contain the custom data payload?

Report the root cause and propose a fix. Do not change code until I confirm the diagnosis.
```

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Chat bubbles don't reply | IM callback URL reachable? `ngrok` up (local dev)? `openclaw_bot` user exists in Chat console? |
| Voice mode stuck on "connecting" | TRTC app has Conversational AI enabled + RTC-Engine package purchased? |
| Voice bot silent | `OPENCLAW_PUBLIC_URL` HTTPS and public-reachable? Lighthouse firewall 443 open? |
| Cards never show | `detectCard()` trigger phrases match actual LLM output? (Log `reply` to verify.) |
| Card shows but is empty | Backend card `type` string matches a key in frontend `cardComponents`? |
| Branch preview shows stale bot behavior | IM callback URL in TRTC Console points at prod, not your preview — this is expected (see Mode A gotcha). |

---

## Useful Links

- Tencent Cloud TRTC Console: https://console.trtc.io/app
- StartAIConversation API: https://trtc.io/document/64963
- Chat REST API (sendmsg): https://trtc.io/document/34620
- OpenClaw docs: https://docs.openclaw.ai/
- Full design doc: [Claude.md](Claude.md)
