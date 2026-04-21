# IMOpenClaw Demo

[English](README.md) · **简体中文**

基于 腾讯云 Chat（IM）+ TRTC 对话式 AI 的 OpenClaw 实时 **文字聊天 + 语音对话** Demo。

目前内置三个 agent 场景：**QuickCafé 咖啡师**、**医疗诊所**、**机场接待**。Agent 以插件形式组织 —— 新增一个场景是**自包含**的改动，不需要动路由或 SDK 集成代码。详见下方 [新增一个 Agent 场景](#新增一个-agent-场景) 指南。

> 完整的架构设计、腾讯云部署步骤、技术决策见 [Claude.md](Claude.md)。本文档是工程师上手文档。

---

## 快速开始

### 前置要求
- Node.js ≥ 18
- 腾讯云 TRTC app + Chat app + OpenClaw Lighthouse 实例的访问权限（找 Ricky 拿凭据）
- 本地调试 IM 回调需要 `ngrok`（或等价工具）

### 1. 克隆 & 安装

```bash
git clone git@github.com:rickyuan/IMOpenClaw.git
cd IMOpenClaw
npm install                    # 根目录并发运行器
cd backend  && npm install
cd ../frontend && npm install
```

### 2. 配置环境变量

参照根目录的 [.env.example](.env.example) 创建两个 env 文件：

```bash
# backend/.env  （凭据找 Ricky 拿）
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
VITE_SDK_APP_ID=<和 TRTC_SDK_APP_ID 相同>
```

### 3. 启动开发服务器

```bash
# 根目录执行 —— 后端 :3000 + 前端 :5173 并发启动
npm run dev
```

其他根命令：
```bash
npm run build       # 构建 backend + frontend
npm run test        # 两个包的 vitest
npm run typecheck   # tsc + vue-tsc noEmit
```

### 4.（可选）暴露后端用于 IM 回调

IM 服务器（腾讯云）会向后端推送 `C2C.CallbackAfterSendMsg` webhook（文字聊天用）。本地开发时：

```bash
ngrok http 3000
# 然后到 TRTC 控制台 → Chat → 回调配置
# 把回调 URL 设为 https://<ngrok>.ngrok-free.app/api/im/callback
```

语音模式**不需要**这个 tunnel —— TRTC 云直接调 Lighthouse 上的 OpenClaw。

---

## 架构速览

```
浏览器 (Vue 3 + TUIKit + trtc-sdk-v5)
   │ 文字路径                     │ 语音路径
   ▼                              ▼
Express 后端 (:3000)          TRTC 云 (STT → LLM → TTS)
   │                              │
   │ /v1/chat/completions         │ /v1/chat/completions (直接调用)
   ▼                              ▼
腾讯云 Lighthouse 上的 OpenClaw Gateway（Caddy 反向代理 HTTPS）
```

- **文字聊天**：用户消息 → IM 回调 → 后端 → OpenClaw → `sendmsg` REST → bot 回复显示在 UIKit。
- **语音聊天**：`StartAIConversation` 启动一个 TRTC 托管的 bot，它在**服务端**完成 STT + LLM（指向 OpenClaw）+ TTS。前端只是加入音频房间并通过 `CUSTOM_MESSAGE` 事件渲染字幕。
- **卡片**：LLM 用自然语言回复；后端 agent 检测意图（例如"外送还是自取？"→ 触发订单卡片）并通过 IM `CloudCustomData` 附带结构化 payload。前端根据 card type 渲染对应的 Vue 组件。

---

## 目录结构

```
IMOpenClaw/
├── backend/src/
│   ├── app.ts              # Express 入口
│   ├── config.ts           # env 加载 + 功能开关
│   ├── routes/             # auth, callback, voice, models, google-auth
│   ├── services/           # openclaw, chat-api, trtc-ai, usersig, google-calendar
│   ├── agents/             # ⭐ Agent 插件 —— barista/ medical/ airport/ + registry.ts
│   ├── middleware/
│   ├── providers/          # 外部 provider 适配器（TTS 等）
│   └── state/              # 进程内 per-user 状态
├── frontend/src/
│   ├── App.vue
│   ├── components/
│   │   ├── ChatPanel.vue   # 封装 TUIKit
│   │   ├── VoicePanel.vue  # TRTC 音频 + 字幕
│   │   ├── ModeSwitch.vue  # 文字 ⇄ 语音切换
│   │   └── cards/          # 共享卡片组件（MenuCard, OrderCard, …）
│   ├── agents/             # ⭐ 前端 agent UI 插件 + registry.ts
│   ├── services/           # api, trtc, chat-sync
│   └── TUIKit/             # 内置的腾讯 Chat UIKit
├── demoflow/               # 演示脚本、system prompts、知识库（参考资料，不会运行时加载）
├── api/                    # Vercel serverless adapter
├── Claude.md               # 完整设计文档 —— 看架构深度细节看这个
└── .env.example            # 环境变量模板
```

---

## 新增一个 Agent 场景

一个 "agent" = 一个完整的 demo 人设（咖啡师 / 医生 / 机场服务员 / …）。每个 agent 在 `backend/src/agents/` 和 `frontend/src/agents/` 里各有一个插件。**不需要改动** routing、TRTC、OpenClaw 的衔接代码。

### 思维模型

- **后端插件** ([AgentPlugin](backend/src/agents/types.ts)) —— 拥有 system prompt、根据 AI 回复决定触发哪个卡片、从对话历史里提取结构化数据（订单明细 / 预约信息 / 等等）、清理给 IM 显示的 markdown 残留、管理 per-user 会话状态。
- **前端插件** ([AgentUIPlugin](frontend/src/agents/types.ts)) —— 拥有主题色 + 图标 + 每种 card type 对应的 Vue 组件。
- 两端通过**相同的 agent id**（如 `'barista'`）和**相同的 card type 字符串**（如 `'menu_card'`）关联。

推荐用 [backend/src/agents/barista/index.ts](backend/src/agents/barista/index.ts) 和 [frontend/src/agents/barista/index.ts](frontend/src/agents/barista/index.ts) 作为参考实现 —— 它功能最完整（3 种卡片、中英双语检测、订单提取）。

### 分步骤操作

#### 1. 确定 id & 设计卡片

先想清楚：
- `id` —— 小写、无空格，例如 `'hotel'`、`'banking'`、`'travel'`。
- 你需要哪些 card type，例如 `'booking_card'`、`'payment_card'`、`'confirmation_card'`。
- 每张卡片的触发时机（AI 回复里出现什么话意味着"现在显示预订卡片"）。

#### 2. 创建后端插件

```
backend/src/agents/<your-id>/
  └── index.ts
```

导出一个 `AgentPlugin` 对象（完整接口见 [types.ts](backend/src/agents/types.ts)）：

```ts
import type { AgentPlugin, CardTrigger } from '../types';

const TEXT_SYSTEM_PROMPT = `You are ...`;           // 完整 prompt：数据、规则、流程
const VOICE_SYSTEM_PROMPT = `You are ... Keep ...`; // 更短、TTS 友好
const VOICE_WELCOME_MESSAGE = 'Hi! I am ...';

const userShownCards = new Map<string, Set<string>>();
const userConversations = new Map<string, string[]>();

export const myAgent: AgentPlugin = {
  id: 'myagent',
  name: 'MyAgent',
  subtitle: '做什么的',
  icon: 'sparkles',
  themeColor: '#1E88E5',
  textSystemPrompt: TEXT_SYSTEM_PROMPT,
  voiceSystemPrompt: VOICE_SYSTEM_PROMPT,
  voiceWelcomeMessage: VOICE_WELCOME_MESSAGE,

  trackMessage(userId, role, text) {
    // 追加到 per-user 对话日志；保留最近 ~20 轮
  },

  detectCard(userId, reply): CardTrigger | null {
    // 检查 AI 回复文本；若匹配某个卡片的触发短语，
    // 返回 { type, data, description }，否则返回 null。
    //
    // 用一个 per-user "shown cards" Set 防止同一张卡片在一个流程里
    // 触发两次。参考 barista/index.ts 的写法。
  },

  cleanDisplayText(text) {
    // IM 显示前去掉 markdown / 泄漏出来的内部指令。
    // 最小实现直接 `return text;` 即可。
  },

  resetSession(userId) {
    userShownCards.delete(userId);
    userConversations.delete(userId);
  },
};
```

然后在 [backend/src/agents/registry.ts](backend/src/agents/registry.ts) 里注册：

```ts
import { myAgent } from './myagent';
// ...
registerAgent(myAgent);
```

#### 3. 创建前端插件 & 卡片组件

卡片组件放在 [frontend/src/components/cards/](frontend/src/components/cards/)（如果可能被复用就放这里；agent 独有的可以放到 `frontend/src/agents/<id>/cards/`）。复制一个已有卡片如 [MenuCard.vue](frontend/src/components/cards/MenuCard.vue) 作为模板 —— 它展示了 `defineProps<{ data: ... }>()` 模式和样式约定。

然后创建：

```
frontend/src/agents/<your-id>/
  └── index.ts
```

```ts
import type { AgentUIPlugin } from '../types';
import BookingCard from '../../components/cards/BookingCard.vue';
import ConfirmationCard from '../../components/cards/ConfirmationCard.vue';

export const myAgentUI: AgentUIPlugin = {
  id: 'myagent',                       // 必须和后端 id 一致
  name: 'MyAgent',
  icon: 'sparkles',
  subtitle: '做什么的',
  themeColor: '#1E88E5',
  themeColorSecondary: '#1565C0',
  cardComponents: {
    booking_card: BookingCard,         // key 必须和后端 CardTrigger.type 一致
    confirmation_card: ConfirmationCard,
  },
};
```

在 [frontend/src/agents/registry.ts](frontend/src/agents/registry.ts) 里注册：

```ts
import { myAgentUI } from './myagent';
// ...
registerAgentUI(myAgentUI);
```

#### 4. 运行 & 调试

```bash
npm run dev
```

- 打开 http://localhost:5173，从顶部导航切到你的 agent。
- 跑一遍对话流程。观察后端日志 —— agent 会打印每次卡片触发。
- **卡片没触发**：检查 `detectCard()` 里的触发短语和 LLM 实际输出是否匹配（LLM 话多，用宽松的 `.includes()` 匹配）。
- **卡片触发两次**：确认你把卡片加到了 `shownCards` Set 里。
- **Markdown 渗漏到 IM 气泡**：扩展 `cleanDisplayText()`（参考 [barista/index.ts](backend/src/agents/barista/index.ts) 里的 `stripMarkdownSummary`，它已经覆盖了大部分正则模式）。
- 记得测语音模式 —— 语音 system prompt 要短一些，因为会走 TTS。

#### 5. 加单元测试（推荐）

[backend/src/agents/registry.test.ts](backend/src/agents/registry.test.ts) 是一个好起点。Agent 本质是对对话状态的纯函数，很容易单测 —— 断言某个回复字符串会触发预期的 card type 即可。

```bash
cd backend && npm test
```

### 提 PR 前的 checklist

- [ ] 后端 agent 已在 `backend/src/agents/registry.ts` 注册
- [ ] 前端 UI 已在 `frontend/src/agents/registry.ts` 注册
- [ ] 两端 agent `id` 一致
- [ ] 两端 card type 字符串一致
- [ ] 文字和语音 system prompt 都写了
- [ ] `resetSession()` 清理了所有 `Map` 状态
- [ ] `npm run typecheck` 通过
- [ ] `npm test` 通过
- [ ] 手动验证了文字模式 + 语音模式 + 卡片触发

---

## 部署

- **前端**：Vercel（见 [vercel.json](vercel.json)）
- **后端**：同 Vercel 项目，走 [api/index.ts](api/index.ts) serverless 适配器；或者长驻部署到腾讯云 Lighthouse 和 OpenClaw 放一起（见 [Claude.md](Claude.md#production-option-colocate-backend-on-lighthouse)）
- **OpenClaw**：Lighthouse 上用 systemd 托管，前面挂 Caddy（自动 HTTPS）。完整安装流程见 [Claude.md](Claude.md#openclaw-gateway-tencent-cloud-lighthouse)

---

## 常见问题排查

| 现象 | 检查点 |
|---|---|
| 聊天气泡没回复 | IM 回调 URL 是否可达？`ngrok` 开着吗？Chat 控制台里有没有 `openclaw_bot` 用户？ |
| 语音模式卡在"connecting" | TRTC app 是否开了对话式 AI 功能 + 购买了 RTC-Engine 套餐？ |
| 语音 bot 没声音 | `OPENCLAW_PUBLIC_URL` 是 HTTPS 吗？公网可达吗？Lighthouse 防火墙开了 443 吗？ |
| 卡片从来不显示 | `detectCard()` 的触发短语和实际 LLM 输出对得上吗？（加 `console.log(reply)` 调试。） |
| 卡片显示了但内容空 | 后端 card `type` 字符串和前端 `cardComponents` 的 key 一致吗？ |

---

## 相关链接

- 腾讯云 TRTC 控制台：https://console.trtc.io/app
- StartAIConversation API：https://trtc.io/document/64963
- OpenClaw 文档：https://docs.openclaw.ai/
- 完整设计文档：[Claude.md](Claude.md)
