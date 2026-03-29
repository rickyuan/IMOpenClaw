import { Router, Request, Response } from 'express';
import {
  isGoogleCalendarConfigured,
  getGoogleAuthUrl,
  handleGoogleCallback,
  isUserConnected,
  disconnectUser,
  createCalendarEvent,
  CalendarEventInput,
} from '../services/google-calendar';

const router = Router();

// Check if user has connected Google Calendar
router.get('/api/google-calendar/status', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  res.json({
    configured: isGoogleCalendarConfigured(),
    connected: isUserConnected(userId),
  });
});

// Start OAuth2 flow — redirect user to Google consent screen
router.get('/api/auth/google', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  if (!isGoogleCalendarConfigured()) {
    return res.status(503).json({ error: 'Google Calendar not configured' });
  }

  const authUrl = getGoogleAuthUrl(userId);
  res.json({ authUrl });
});

// OAuth2 callback — Google redirects here after user consents
router.get('/api/auth/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const userId = req.query.state as string; // passed via OAuth state param

  if (!code || !userId) {
    return res.status(400).send('Missing code or state');
  }

  try {
    await handleGoogleCallback(code, userId);
    // Close the popup and notify parent window
    res.send(`
      <html><body>
        <h2 style="font-family:system-ui;text-align:center;margin-top:40px;">
          Google Calendar connected successfully!
        </h2>
        <p style="font-family:system-ui;text-align:center;color:#666;">
          You can close this window.
        </p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'google-calendar-connected' }, '*');
          }
          setTimeout(() => window.close(), 1500);
        </script>
      </body></html>
    `);
  } catch (error: any) {
    console.error('[GoogleCal] OAuth callback error:', error);
    res.status(500).send(`
      <html><body>
        <h2 style="font-family:system-ui;text-align:center;margin-top:40px;color:#e74c3c;">
          Connection failed
        </h2>
        <p style="font-family:system-ui;text-align:center;color:#666;">
          ${error.message || 'Unknown error'}
        </p>
      </body></html>
    `);
  }
});

// Disconnect Google Calendar
router.post('/api/google-calendar/disconnect', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  disconnectUser(userId);
  res.json({ connected: false });
});

// Manually add an appointment to Google Calendar
router.post('/api/google-calendar/add-event', async (req: Request, res: Response) => {
  const { userId, appointment } = req.body as { userId: string; appointment: CalendarEventInput };
  if (!userId || !appointment) return res.status(400).json({ error: 'userId and appointment required' });

  if (!isUserConnected(userId)) {
    return res.status(401).json({ error: 'Google Calendar not connected' });
  }

  try {
    const eventLink = await createCalendarEvent(userId, appointment);
    res.json({ success: true, eventLink });
  } catch (error: any) {
    console.error('[GoogleCal] Create event error:', error);
    res.status(500).json({ error: error.message || 'Failed to create event' });
  }
});

export default router;
