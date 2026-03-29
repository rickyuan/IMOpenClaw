import { Router, Request, Response } from 'express';
import { generateUserSig } from '../services/usersig';
import { sendBotMessage } from '../services/chat-api';

const router = Router();

// Track which users have already received a welcome message
const welcomedUsers = new Set<string>();

router.get('/api/auth/usersig', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const userSig = generateUserSig(userId);
  const sdkAppId = Number(process.env.TRTC_SDK_APP_ID);

  res.json({ userSig, sdkAppId });

  // Send welcome message from bot to create the conversation
  if (!welcomedUsers.has(userId)) {
    welcomedUsers.add(userId);
    try {
      await sendBotMessage(userId, 'Hi! I am your OpenClaw AI assistant. Send me a message to start chatting.');
    } catch (e) {
      console.warn('Failed to send welcome message:', e);
    }
  }
});

export default router;
