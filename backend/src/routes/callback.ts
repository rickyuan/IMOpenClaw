import { Router, Request, Response } from 'express';
import { callOpenClaw } from '../services/openclaw';
import { sendBotMessage, sendBotCustomMessage } from '../services/chat-api';
import { getAgent } from '../agents/registry';
import { getUserAgent, getUserModel, setUserAgent, setUserModel } from '../state/user-preferences';
import { isUserConnected, createCalendarEvent } from '../services/google-calendar';
import { callbackLimiter } from '../middleware/rate-limit';

const router = Router();

const IM_OK = { ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: '' };

// Dedup: IM server may retry callbacks. Track processed MsgKey to avoid duplicate LLM calls.
const processedMsgs = new Set<string>();
const MAX_DEDUP_SIZE = 500;

function markProcessed(key: string): boolean {
  if (processedMsgs.has(key)) return false;
  processedMsgs.add(key);
  if (processedMsgs.size > MAX_DEDUP_SIZE) {
    const first = processedMsgs.values().next().value;
    if (first) processedMsgs.delete(first);
  }
  return true;
}

function log(msg: string): void {
  console.log(msg);
  try { require('fs').appendFileSync('/tmp/im-callback.log', msg + '\n'); } catch {}
}

router.post('/api/im/callback', callbackLimiter, async (req: Request, res: Response) => {
  const { CallbackCommand, From_Account, To_Account, MsgBody } = req.body;

  if (CallbackCommand === 'Bot.OnC2CMessage') {
    res.json(IM_OK);
    return;
  }
  if (CallbackCommand !== 'C2C.CallbackAfterSendMsg') {
    res.json(IM_OK);
    return;
  }
  if (From_Account === process.env.IM_BOT_USERID) {
    res.json(IM_OK);
    return;
  }
  if (To_Account !== process.env.IM_BOT_USERID) {
    res.json(IM_OK);
    return;
  }

  const textElem = MsgBody?.find((m: any) => m.MsgType === 'TIMTextElem');
  const userMessage = textElem?.MsgContent?.Text;
  if (!userMessage) {
    res.json(IM_OK);
    return;
  }

  // Dedup
  const msgKey = req.body.MsgKey || req.body.MsgSeq || `${From_Account}_${Date.now()}`;
  if (!markProcessed(String(msgKey))) {
    log(`[Dedup] Skipping duplicate callback MsgKey=${msgKey}`);
    res.json(IM_OK);
    return;
  }

  // IMPORTANT: On Vercel serverless, the function freezes after res is sent.
  // Must complete ALL async work BEFORE responding.
  try {
    // On Vercel serverless, in-memory state is lost between invocations.
    // Read agentId/modelId from CloudCustomData attached by the frontend.
    let agentId = getUserAgent(From_Account, 'barista');
    let modelId = getUserModel(From_Account, '1');
    try {
      const cloudData = req.body.CloudCustomData;
      log(`[CloudCustomData] raw=${cloudData || '(empty)'}`);
      if (cloudData) {
        const parsed = JSON.parse(cloudData);
        if (parsed.agentId) agentId = parsed.agentId;
        if (parsed.modelId) modelId = parsed.modelId;
        // Sync to in-memory state (helps within same warm instance)
        setUserAgent(From_Account, agentId);
        if (parsed.modelId) setUserModel(From_Account, modelId);
      }
    } catch {}
    const agent = getAgent(agentId);

    log(`[${new Date().toISOString()}] From: ${From_Account}, Agent: ${agentId}, Model: ${modelId}, Msg: ${userMessage}`);

    // Track user message
    agent.trackMessage(From_Account, 'user', userMessage);

    // Call LLM
    const { raw: rawReply, display: displayReply } = await callOpenClaw(userMessage, From_Account);
    log(`  -> Raw: ${rawReply.substring(0, 200)}`);
    log(`  -> Display: ${displayReply.substring(0, 200)}`);

    // Track AI reply
    agent.trackMessage(From_Account, 'assistant', rawReply);

    // Send text reply
    await sendBotMessage(From_Account, displayReply);

    // Card detection (unified via agent plugin)
    const card = agent.detectCard(From_Account, rawReply);
    if (card) {
      await new Promise(r => setTimeout(r, 500));
      await sendBotCustomMessage(From_Account, card.type, card.data, card.description);
      log(`  -> Card: ${card.type}`);

      // Medical agent: auto-sync appointment to Google Calendar
      if (card.type === 'appointment_card' && isUserConnected(From_Account)) {
        try {
          const eventLink = await createCalendarEvent(From_Account, card.data as any);
          if (eventLink) {
            await sendBotMessage(From_Account, 'Your appointment has been added to your Google Calendar automatically.');
            log(`  -> Google Calendar: event created`);
          }
        } catch (err) {
          console.error('[GoogleCal] Auto-sync failed:', err);
        }
      }
    }
  } catch (error) {
    console.error('Error processing IM callback:', error);
  }

  res.json(IM_OK);
});

export default router;
