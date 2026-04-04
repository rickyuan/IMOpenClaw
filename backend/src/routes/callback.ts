import { Router, Request, Response } from 'express';
import { callOpenClaw, getUserModel, getUserAgent } from '../services/openclaw';
import { sendBotMessage, sendBotCustomMessage } from '../services/chat-api';
import { trackMessage, detectCardTrigger, extractOrderDetails, buildConfirmationDetails } from '../services/card-detection';
import {
  trackMedicalMessage, detectMedicalCardTrigger,
  getServiceMenuData, getDoctorListData, extractAppointmentDetails,
} from '../services/medical-detection';
import {
  trackAirportMessage, detectAirportCardTrigger,
  extractFlightData, extractDiningTerminal,
  TRANSPORT_DATA, JEWEL_DATA,
} from '../services/airport-detection';
import { isUserConnected, createCalendarEvent } from '../services/google-calendar';

const router = Router();

const IM_OK = { ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: '' };

// Dedup: IM server may retry callbacks. Track processed MsgKey to avoid duplicate LLM calls.
const processedMsgs = new Set<string>();
const MAX_DEDUP_SIZE = 500;

function markProcessed(key: string): boolean {
  if (processedMsgs.has(key)) return false; // already processed
  processedMsgs.add(key);
  // Evict oldest entries to prevent unbounded growth
  if (processedMsgs.size > MAX_DEDUP_SIZE) {
    const first = processedMsgs.values().next().value;
    if (first) processedMsgs.delete(first);
  }
  return true; // first time seeing this
}

function log(msg: string): void {
  console.log(msg);
  // Also write to /tmp for local debugging (safe on Vercel too)
  try { require('fs').appendFileSync('/tmp/im-callback.log', msg + '\n'); } catch {}
}

// Menu data (static, matches MenuCard.vue)
const MENU_DATA = {
  items: [
    { name: 'Espresso', desc: 'Bold & classic', priceR: 4.50, priceL: 5.80 },
    { name: 'Americano', desc: 'Smooth & balanced', priceR: 5.00, priceL: 6.30 },
    { name: 'Latte', desc: 'Creamy favorite', priceR: 6.50, priceL: 7.80 },
    { name: 'Cappuccino', desc: 'Frothy & rich', priceR: 6.50, priceL: 7.80 },
    { name: 'Mocha', desc: 'Chocolate bliss', priceR: 7.00, priceL: 8.30 },
  ],
};

router.post('/api/im/callback', async (req: Request, res: Response) => {
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

  // Dedup: skip if this callback was already processed (IM server retry)
  const msgKey = req.body.MsgKey || req.body.MsgSeq || `${From_Account}_${Date.now()}`;
  if (!markProcessed(String(msgKey))) {
    log(`[Dedup] Skipping duplicate callback MsgKey=${msgKey}`);
    res.json(IM_OK);
    return;
  }

  // IMPORTANT: On Vercel serverless, the function freezes after res is sent.
  // Must complete ALL async work (LLM call, bot reply, card detection) BEFORE responding.
  try {
    const modelId = getUserModel(From_Account);
    const agentId = getUserAgent(From_Account);
    log(`[${new Date().toISOString()}] From: ${From_Account}, Agent: ${agentId}, Model: ${modelId}, Msg: ${userMessage}`);

    // Track message in agent-specific tracker
    if (agentId === 'medical') {
      trackMedicalMessage(From_Account, 'user', userMessage);
    } else if (agentId === 'airport') {
      trackAirportMessage(From_Account, 'user', userMessage);
    } else {
      trackMessage(From_Account, 'user', userMessage);
    }

    const { raw: rawReply, display: displayReply } = await callOpenClaw(userMessage, From_Account);
    log(`  -> Raw: ${rawReply.substring(0, 200)}`);
    log(`  -> Display: ${displayReply.substring(0, 200)}`);

    // Track AI reply
    if (agentId === 'medical') {
      trackMedicalMessage(From_Account, 'assistant', rawReply);
    } else if (agentId === 'airport') {
      trackAirportMessage(From_Account, 'assistant', rawReply);
    } else {
      trackMessage(From_Account, 'assistant', rawReply);
    }

    await sendBotMessage(From_Account, displayReply);

    // Agent-specific card detection
    if (agentId === 'airport') {
      const cardType = detectAirportCardTrigger(From_Account, rawReply);
      if (cardType) {
        await new Promise(r => setTimeout(r, 500));
        if (cardType === 'flight_status_card') {
          const flight = extractFlightData(From_Account);
          await sendBotCustomMessage(From_Account, 'flight_status_card', flight, `Flight ${flight.flightNo}`);
        } else if (cardType === 'transport_card') {
          await sendBotCustomMessage(From_Account, 'transport_card', TRANSPORT_DATA, 'Transport Options');
        } else if (cardType === 'jewel_card') {
          await sendBotCustomMessage(From_Account, 'jewel_card', JEWEL_DATA, 'Jewel Changi');
        } else if (cardType === 'dining_card') {
          const dining = extractDiningTerminal(From_Account);
          await sendBotCustomMessage(From_Account, 'dining_card', dining, 'Dining Recommendations');
        }
        log(`  -> Card: ${cardType}`);
      }
    } else if (agentId === 'medical') {
      const cardType = detectMedicalCardTrigger(From_Account, displayReply);
      if (cardType) {
        await new Promise(r => setTimeout(r, 500));

        if (cardType === 'service_menu_card') {
          await sendBotCustomMessage(From_Account, 'service_menu_card', getServiceMenuData(), 'Our Services');
        } else if (cardType === 'doctor_list_card') {
          await sendBotCustomMessage(From_Account, 'doctor_list_card', getDoctorListData(), 'Available Doctors');
        } else if (cardType === 'appointment_card') {
          const appt = extractAppointmentDetails(From_Account);
          await sendBotCustomMessage(From_Account, 'appointment_card', appt, 'Appointment Confirmed');

          // Auto-sync to Google Calendar if connected
          if (isUserConnected(From_Account)) {
            try {
              const eventLink = await createCalendarEvent(From_Account, appt);
              if (eventLink) {
                await sendBotMessage(From_Account, 'Your appointment has been added to your Google Calendar automatically.');
                log(`  -> Google Calendar: event created`);
              }
            } catch (err) {
              console.error('[GoogleCal] Auto-sync failed:', err);
            }
          }
        }
        log(`  -> Card: ${cardType}`);
      }
    } else {
      const cardType = detectCardTrigger(From_Account, displayReply);
      if (cardType) {
        await new Promise(r => setTimeout(r, 500));

        if (cardType === 'menu_card') {
          await sendBotCustomMessage(From_Account, 'menu_card', MENU_DATA, 'QuickCafé Menu');
        } else if (cardType === 'order_card') {
          const order = extractOrderDetails(From_Account);
          await sendBotCustomMessage(From_Account, 'order_card', order, 'Order Summary');
        } else if (cardType === 'confirmation_card') {
          const order = extractOrderDetails(From_Account);
          const confirmation = buildConfirmationDetails(From_Account, order);
          await sendBotCustomMessage(From_Account, 'confirmation_card', confirmation, 'Order Confirmed');
        }
        log(`  -> Card: ${cardType}`);
      }
    }
  } catch (error) {
    console.error('Error processing IM callback:', error);
  }

  res.json(IM_OK);
});

export default router;
