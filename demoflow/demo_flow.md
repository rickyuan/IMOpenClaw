# QuickCafé AI Barista — Demo Flow
# 咖啡点单场景 · 完整对话流程

---

## 演示概览

| 项目 | 内容 |
|------|------|
| 场景 | 用户语音点一杯咖啡 |
| 角色 | AI Barista "Bella" |
| 对话轮次 | 5轮（约60秒） |
| 技术栈 | TRTC (语音) + Chat/IM (卡片) + OpenClaw (AI) |
| 核心看点 | 语音对话 + IM卡片实时联动 |

---

## 完整对话脚本

### Round 1 — 打招呼 + 推菜单

```
👤 User (语音): "Hi, I'd like to order a coffee"

🤖 Bella (语音): "Hey! Welcome to QuickCafé! 
                   I've sent our menu to your chat — what catches your eye?"

📱 IM动作: → 推送 menu_card (咖啡菜单，5款饮品带图片和价格)
```

**技术流转**: User Voice → TRTC → OpenClaw (STT→LLM→TTS) → TRTC Voice Back
             同时 OpenClaw → Chat SDK → 推送 menu_card

---

### Round 2 — 选咖啡 + 问规格

```
👤 User (语音): "I'll have a Latte"

🤖 Bella (语音): "Great choice! Would you like Regular or Large? 
                   And hot or iced?"
```

**技术流转**: 纯语音轮次，OpenClaw识别意图并追问

---

### Round 3 — 确认定制选项

```
👤 User (语音): "Large, iced please"

🤖 Bella (语音): "Nice! What milk — regular, oat, or soy?"
```

```
👤 User (语音): "Oat milk, less sugar"

🤖 Bella (语音): "Perfect!"
```

**说明**: 这里可以合并为1轮或2轮，取决于现场节奏

---

### Round 4 — 确认订单 + 推订单卡片

```
🤖 Bella (语音): "So that's a Large Iced Latte with oat milk, less sugar.
                   Oh — I've applied the DEVDAY promo, free upsize! 🎉
                   Your total is $7.80. I've sent the details to your chat!"

📱 IM动作: → 推送 order_card (订单摘要，含价格明细和DEVDAY优惠)
```

**技术流转**: OpenClaw组装订单 → 语音播报摘要 → 同时推送order_card到IM
**现场亮点**: DEVDAY promo是给开发者活动的彩蛋，观众会心一笑

---

### Round 5 — 下单确认 + 配送提示

```
👤 User (语音): "Confirm!"

🤖 Bella (语音): "You're all set! Your Latte will be ready in about 
                   10 minutes. Order details are in your chat. Enjoy! ☕"

📱 IM动作: → 推送 confirmation_card (订单号、制作进度、配送ETA)
```

**技术流转**: 订单确认 → 推送confirmation_card → 对话结束

---

## 技术架构流转图 (每一步)

```
User Voice ──→ TRTC Audio Stream ──→ OpenClaw
                                        │
                                   ┌────┴────┐
                                   │  STT    │ (语音转文字)
                                   │  LLM    │ (意图理解+回复生成)
                                   │  TTS    │ (文字转语音)
                                   └────┬────┘
                                        │
                          ┌─────────────┼─────────────┐
                          ▼                           ▼
                   TRTC Voice Back              Chat/IM SDK
                   (Bella语音回复)             (推送结构化卡片)
                          │                           │
                          ▼                           ▼
                    🔊 用户听到回复            📱 用户看到IM卡片
```

---

## 演示前检查清单

- [ ] OpenClaw服务正常，LLM响应 < 2秒
- [ ] TRTC房间创建正常，语音通道稳定
- [ ] Chat/IM SDK初始化，卡片渲染正常
- [ ] System Prompt已配置
- [ ] 知识库JSON已加载
- [ ] 3张IM卡片模板渲染正确 (menu / order / confirmation)
- [ ] 麦克风测试通过
- [ ] 备用方案：如果语音卡顿，可切到文字输入模式

---

## 备用演示路径 (如果现场出状况)

| 问题 | 应对方案 |
|------|---------|
| 语音识别不准 | 切到文字输入，说"让我用打字试试" |
| LLM响应慢 | 预设一个录屏视频兜底 |
| IM卡片没推出来 | 手动点发送，说"刚才网络小延迟" |
| 全部挂了 | 播放录屏 + 讲架构图 |
