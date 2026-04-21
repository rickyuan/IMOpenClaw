# IMOpenClaw Demo

[English](README.md) · **简体中文**

基于 腾讯云 Chat（IM）+ TRTC 对话式 AI 的 OpenClaw 实时 **文字聊天 + 语音对话** Demo。

目前内置三个 agent 场景：**QuickCafé 咖啡师**、**医疗诊所**、**机场接待**。Agent 以插件形式组织，新增场景是自包含改动。

> 完整架构与腾讯云部署细节见 [Claude.md](Claude.md)。**本文档专门为"喂给 AI 编码助手"设计**（Claude Code、Cursor 等），下方提供可直接复制的 Prompt。

---

## 架构速览

```
浏览器 (Vue 3 + TUIKit + trtc-sdk-v5)
   │ 文字路径                      │ 语音路径
   ▼                               ▼
Express 后端 (:3000)            TRTC 云 (STT → LLM → TTS)
   │                               │
   │ /v1/chat/completions          │ /v1/chat/completions (直接调)
   ▼                               ▼
腾讯云 Lighthouse 上的 OpenClaw Gateway（Caddy 反向代理 HTTPS）
```

- **文字**：用户消息 → IM webhook (`C2C.CallbackAfterSendMsg`) → 后端 → OpenClaw → IM `sendmsg` REST → UIKit 渲染 bot 回复。
- **语音**：`StartAIConversation` 启动一个 TRTC 托管 bot，服务端完成 STT + LLM（指向 OpenClaw）+ TTS。前端只加入音频房间，通过 `CUSTOM_MESSAGE` 事件渲染字幕。
- **卡片**：LLM 自然语言回复；后端 agent 检测意图（例如 `"外送还是自取？"` → 触发订单卡片）并通过 IM `CloudCustomData` 附带结构化 payload。前端根据 card type 渲染已注册的 Vue 组件。
- **两端关联**：共享 `id` 字符串（如 `'barista'`）+ 共享 card type 字符串（如 `'menu_card'`）。

---

## 目录结构

```
IMOpenClaw/
├── backend/src/
│   ├── app.ts              # Express 入口
│   ├── config.ts           # env 加载
│   ├── routes/             # auth, callback, voice, models, google-auth
│   ├── services/           # openclaw, chat-api, trtc-ai, usersig, google-calendar
│   ├── agents/             # ⭐ Agent 插件 — barista/ medical/ airport/ + registry.ts + types.ts
│   ├── middleware/
│   ├── providers/          # TTS 适配器
│   └── state/              # 进程内 per-user 状态
├── frontend/src/
│   ├── App.vue
│   ├── components/
│   │   ├── ChatPanel.vue   # 封装 TUIKit
│   │   ├── VoicePanel.vue  # TRTC 音频 + 字幕
│   │   ├── ModeSwitch.vue
│   │   └── cards/          # ⭐ 共享卡片组件
│   ├── agents/             # ⭐ 前端 UI 插件 + registry.ts + types.ts
│   ├── services/           # api, trtc, chat-sync
│   └── TUIKit/             # 内置的腾讯 Chat UIKit
├── demoflow/               # 参考资料：demo 脚本、system prompts、知识库（不会运行时加载）
├── api/index.ts            # Vercel serverless adapter
├── Claude.md               # 完整设计文档
└── .env.example            # 环境变量模板
```

**新改动的参考实现**：
- 后端 agent：[backend/src/agents/barista/index.ts](backend/src/agents/barista/index.ts)
- 前端 UI 插件：[frontend/src/agents/barista/index.ts](frontend/src/agents/barista/index.ts)
- 卡片组件：[frontend/src/components/cards/MenuCard.vue](frontend/src/components/cards/MenuCard.vue)
- 插件接口：[backend/src/agents/types.ts](backend/src/agents/types.ts)、[frontend/src/agents/types.ts](frontend/src/agents/types.ts)
- 单元测试：[backend/src/agents/registry.test.ts](backend/src/agents/registry.test.ts)

---

## 开发模式

### 模式 A — 直接 push 到 Vercel 验证（无需本地环境、无需密钥）

适用于**纯前端改动**（卡片组件、样式、UI 交互）。流程：
1. `git checkout -b feature/xyz`
2. 改代码，push 分支
3. Vercel 自动构建 preview URL → 打开测试
4. 提 PR、合到 `main` → prod 自动部署

**⚠️ 坑：IM 回调是全局的。** TRTC 控制台里 `C2C.CallbackAfterSendMsg` 的 URL 同一时间只能指向**一个**部署（默认是 prod）。所以分支 preview URL 上虽然能打开前端，但文字聊天的 bot 回复仍然走 prod 后端，**看不到你后端代码的变化**。后端改动请用模式 B，或协调临时切换回调 URL。

### 模式 B — 本地 dev（快速迭代、后端改动）

需要 Ricky 给密钥（`backend/.env` + `frontend/.env`）。

```bash
git clone git@github.com:rickyuan/IMOpenClaw.git
cd IMOpenClaw
npm install && (cd backend && npm install) && (cd frontend && npm install)
# 照着 .env.example 填 backend/.env 和 frontend/.env
npm run dev                 # 后端 :3000 + 前端 :5173 并发
```

让 IM 回调能打到你本地后端：`ngrok http 3000`，然后去 TRTC 控制台更新回调 URL。语音模式不需要 tunnel（TRTC 云直接调 Lighthouse 上的 OpenClaw）。

其他根命令：`npm run build`、`npm run test`、`npm run typecheck`。

### 零密钥本地验证（只校验 agent 逻辑）

Agent 插件本质是对对话状态的纯函数，不需要任何密钥就能验证：

```bash
cd backend && npm run test     # vitest — agent 注册 + 卡片检测测试
cd backend && npx tsc --noEmit
cd frontend && npx vue-tsc --noEmit
```

---

## AI Prompts

直接复制粘贴给 Claude Code / Cursor / 任何在仓库里运行的 AI 助手。每个 Prompt 都是自包含的 —— AI 会自己读参考文件。

### Prompt 1 — 新增一个 agent 场景

```
我要给这个仓库加一个新的 agent 场景。

先读以下文件作为上下文：
- README.md（本文档）
- backend/src/agents/types.ts — AgentPlugin 接口
- frontend/src/agents/types.ts — AgentUIPlugin 接口
- backend/src/agents/barista/index.ts — 后端参考实现
- frontend/src/agents/barista/index.ts — 前端参考实现
- backend/src/agents/registry.test.ts — 测试写法

## Agent 规格（运行前填好）

- id：<小写、无空格 —— 例如 hotel>
- 显示名：<例如 LuxStay>
- 副标题：<例如 AI 礼宾>
- 图标：<emoji 或 lucide 图标名>
- 主题色 primary / secondary：<hex> / <hex>
- 卡片：<card_type_1>、<card_type_2>、…（snake_case —— 例如 room_card、booking_card、confirmation_card）
- 触发规则：
  - <card_type_1>：AI 回复包含 <短语 / 模式 —— 中英双语时两种都列>
  - <card_type_2>：AI 回复包含 <短语>
  - ...
- 对话流程（写进 textSystemPrompt）：
  <描述步骤：打招呼 → 收集 A → 收集 B → 确认 → 结束>
- 卡片需要的数据（detectCard 要从对话历史里提取）：
  <例如 入住日期、房型、人数>

## 任务

1. 创建 backend/src/agents/<id>/index.ts，导出一个 AgentPlugin：
   - textSystemPrompt：完整 prompt，包含规则 + 数据 + 流程（长度参考 barista）
   - voiceSystemPrompt：更短、TTS 友好的版本
   - voiceWelcomeMessage：语音启动时说的一句开场白
   - trackMessage：往 per-user Map<string, string[]> 里 push `${role}: ${text}`，保留最近 20 条
   - detectCard：检查 reply 文本，返回 CardTrigger 或 null；用 per-user Set<string> 记录已显示的 card type 防止重复；流程重启（例如新菜单 / 新预订）时清空 Set
   - cleanDisplayText：先写 `return text;` —— 只有 LLM 把 markdown 泄漏到 IM 气泡时才扩展
   - resetSession：删除该 agent 在 Map 里关于这个 userId 的所有 entry

2. 在 backend/src/agents/registry.ts 注册（import + registerAgent()）。

3. 在 frontend/src/components/cards/<Name>Card.vue 创建需要的新卡片组件。简单列表用 MenuCard.vue 做模板，摘要卡用 OrderCard.vue。使用 `defineProps<{ data: ... }>()`。

4. 创建 frontend/src/agents/<id>/index.ts，导出 AgentUIPlugin。cardComponents 的 key 必须和步骤 1 里 CardTrigger.type 字符串完全一致。

5. 在 frontend/src/agents/registry.ts 注册（import + registerAgentUI()）。

6. 在 backend/src/agents/registry.test.ts 加测试：每种 card type 构造一段以触发短语结尾的对话，断言 detectCard 返回预期 type；同时断言**不该**触发的短语不会触发。

## 验收标准 —— 全部通过才能停

- [ ] `cd backend && npm test` 通过
- [ ] `cd backend && npx tsc --noEmit` 通过
- [ ] `cd frontend && npx vue-tsc --noEmit` 通过
- [ ] Agent id 在两端字节完全一致
- [ ] detectCard 返回的每个 CardTrigger.type 都能在 cardComponents 里找到对应 key
- [ ] resetSession 清空了该 agent 用到的每一个 Map（不泄漏到下一个 session）
- [ ] textSystemPrompt 和 voiceSystemPrompt 都存在且非空

做完汇报：改动的文件列表 + 测试输出。
```

### Prompt 2 — 给已有 agent 加一种新卡片

```
给 <agent_id> agent 加一种新卡片。

先读：
- backend/src/agents/<agent_id>/index.ts
- frontend/src/agents/<agent_id>/index.ts
- frontend/src/components/cards/ 下任何一个已有卡片（作为样式参考）

## 卡片规格

- type 字符串：<snake_case，例如 receipt_card>
- 触发时机：<AI 回复里的短语或条件>
- 数据结构：<TS interface —— 卡片要渲染的字段>
- 数据来源：<从对话历史提取 / 从之前的卡片数据来 / 常量>

## 任务

1. 在 detectCard() 里加一个分支处理这个 card type，用 shownCards.has(<key>) 防重复。
2. 如果需要从对话里提取数据，仿照 barista 的 extractOrderDetails 写一个 extract<Name>Details(userId)。
3. 创建 frontend/src/components/cards/<Name>Card.vue。使用 defineProps<{ data: <interface> }>()，样式对齐已有卡片。
4. 在 frontend/src/agents/<agent_id>/index.ts 的 cardComponents 里注册。
5. 扩展 registry.test.ts，加一条断言这个卡片会在预期短语上触发。

## 验收标准

- [ ] `cd backend && npm test` 通过
- [ ] 两端 typecheck 通过
- [ ] 后端 detectCard 返回的 card type 字符串和前端 cardComponents key 完全一致
```

### Prompt 3 — 排查"卡片没显示"

```
<id> agent 的 <card_type> 卡片在 UI 上不出现。

先读：
- backend/src/agents/<id>/index.ts 里这张卡的 detectCard() 分支
- frontend/src/agents/<id>/index.ts 的 cardComponents
- backend/src/routes/callback.ts（detectCard 被调用、卡片被下发的位置）

执行以下检查并汇报结论：
1. 在 detectCard 顶部加一条临时的 console.log(reply, cardType) —— push 到分支，需要的话部署到 Vercel preview，触发那段对话，看日志。LLM 实际输出什么？触发子串匹配上了吗？
2. detectCard 返回的 card type 字符串和前端 cardComponents 里的 key 是否完全一致（包括下划线、大小写）？
3. 是 shownCards 在阻止重新触发吗？resetSession 该调的时候调了吗？
4. CloudCustomData 真的挂到发出去的消息上了吗？看腾讯 IM 控制台的消息记录 —— bot 回复里有 custom data payload 吗？

汇报根因并提出修复方案。**在我确认诊断前不要改代码。**
```

---

## 常见问题排查

| 现象 | 检查点 |
|---|---|
| 聊天气泡没回复 | IM 回调 URL 可达？`ngrok` 开着（本地 dev）？Chat 控制台有 `openclaw_bot` 用户吗？ |
| 语音模式卡在 "connecting" | TRTC app 开了对话式 AI + 购买了 RTC-Engine 套餐？ |
| 语音 bot 没声音 | `OPENCLAW_PUBLIC_URL` 是 HTTPS 且公网可达？Lighthouse 防火墙开 443？ |
| 卡片从来不显示 | `detectCard()` 触发短语和 LLM 实际输出对得上？（log `reply` 验证。） |
| 卡片显示但内容空 | 后端 card `type` 字符串和前端 `cardComponents` key 一致？ |
| 分支 preview 上 bot 行为是旧的 | TRTC 控制台回调 URL 指向 prod 而不是你的 preview —— 这是预期的（见模式 A 的坑）。 |

---

## 相关链接

- 腾讯云 TRTC 控制台：https://console.trtc.io/app
- StartAIConversation API：https://trtc.io/document/64963
- Chat REST API (sendmsg)：https://trtc.io/document/34620
- OpenClaw 文档：https://docs.openclaw.ai/
- 完整设计文档：[Claude.md](Claude.md)
