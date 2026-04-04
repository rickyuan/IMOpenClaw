import { Router, Request, Response } from 'express';
import { generateUserSig } from '../services/usersig';
import { startVoiceAI, stopVoiceAI, describeVoiceAI } from '../services/trtc-ai';
import { sendBotMessage, sendBotCustomMessage } from '../services/chat-api';
import { getUserAgent } from '../state/user-preferences';
import { voiceStartLimiter } from '../middleware/rate-limit';

const router = Router();

router.post('/api/voice/start', voiceStartLimiter, async (req: Request, res: Response) => {
  try {
    const { roomId, userId } = req.body;

    if (!roomId || !userId) {
      res.status(400).json({ error: 'roomId and userId are required' });
      return;
    }

    const userSig = generateUserSig(userId);
    const agentId = getUserAgent(userId, 'barista');
    const taskId = await startVoiceAI(roomId, userId);

    res.json({
      taskId,
      roomId,
      userSig,
      sdkAppId: Number(process.env.TRTC_SDK_APP_ID),
      agentId,
    });
  } catch (error: any) {
    console.error('Failed to start voice AI:', error);
    res.status(500).json({ error: error.message || 'Failed to start voice AI' });
  }
});

router.post('/api/voice/stop', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      res.status(400).json({ error: 'taskId is required' });
      return;
    }

    await stopVoiceAI(taskId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to stop voice AI:', error);
    res.status(500).json({ error: error.message || 'Failed to stop voice AI' });
  }
});

router.get('/api/voice/status/:taskId', async (req: Request, res: Response) => {
  try {
    const status = await describeVoiceAI(req.params.taskId as string);
    res.json({ status });
  } catch (error: any) {
    console.error('Failed to get voice AI status:', error);
    res.status(500).json({ error: error.message || 'Failed to get status' });
  }
});

// Sync voice transcript to Chat IM — AI messages sent as bot, user messages as custom
router.post('/api/voice/sync', async (req: Request, res: Response) => {
  try {
    const { userId, text, role } = req.body;

    if (!userId || !text || !role) {
      res.status(400).json({ error: 'userId, text, and role are required' });
      return;
    }

    if (role === 'assistant') {
      // Send as bot → appears on left side in chat
      await sendBotCustomMessage(userId, 'voice_transcript', {
        source: 'voice_conversation',
        role: 'assistant',
        text,
        timestamp: Date.now(),
      }, `🎙 ${text}`);
    }
    // User messages are sent directly from the frontend Chat SDK (appear on right side)

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to sync voice transcript:', error);
    res.status(500).json({ error: error.message || 'Failed to sync' });
  }
});

export default router;
