import { Router, Request, Response } from 'express';
import { callOpenClaw, getUserModel, getUserAgent } from '../services/openclaw';
import { sendBotMessage, sendBotCustomMessage } from '../services/chat-api';
import { trackMessage, detectCardTrigger, extractOrderDetails, buildConfirmationDetails } from '../services/card-detection';
import {
  trackMedicalMessage, detectMedicalCardTrigger,
  getServiceMenuData, getDoctorListData, extractAppointmentDetails,
} from '../services/medical-detection';
import { isUserConnected, createCalendarEvent } from '../services/google-calendar';

const router = Router();

const IM_OK = { ActionStatus: 'OK', ErrorCode: 0, ErrorInfo: '' };

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

  res.json(IM_OK);

  try {
    const modelId = getUserModel(From_Account);
    const agentId = getUserAgent(From_Account);
    const logLine = `[${new Date().toISOString()}] From: ${From_Account}, Agent: ${agentId}, Model: ${modelId}, Msg: ${userMessage}\n`;
    log(logLine);

    // Track message in agent-specific tracker
    if (agentId === 'medical') {
      trackMedicalMessage(From_Account, 'user', userMessage);
    } else {
      trackMessage(From_Account, 'user', userMessage);
    }

    const { raw: rawReply, display: displayReply } = await callOpenClaw(userMessage, From_Account);
    log(`  -> Raw: ${rawReply.substring(0, 200)}`);
    log(`  -> Display: ${displayReply.substring(0, 200)}`);

    // Track AI reply
    if (agentId === 'medical') {
      trackMedicalMessage(From_Account, 'assistant', rawReply);
    } else {
      trackMessage(From_Account, 'assistant', rawReply);
    }

    await sendBotMessage(From_Account, displayReply);

    // Agent-specific card detection
    if (agentId === 'medical') {
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
});

export default router;
