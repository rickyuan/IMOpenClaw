import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// Per-user OAuth2 tokens (in-memory for demo)
const userTokens = new Map<string, any>();

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
  );
}

export function isGoogleCalendarConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: userId, // pass userId through OAuth flow
  });
}

export async function handleGoogleCallback(code: string, userId: string): Promise<void> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  userTokens.set(userId, tokens);
  console.log(`[GoogleCal] Stored OAuth tokens for user ${userId}`);
}

export function isUserConnected(userId: string): boolean {
  return userTokens.has(userId);
}

export function disconnectUser(userId: string): void {
  userTokens.delete(userId);
}

export interface CalendarEventInput {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  patientName: string;
  consultType: string;
  fee: number;
  confirmationNo: string;
}

/**
 * Parse loose date/time strings from AI conversation into a Date.
 * Mirrors the frontend calendar.ts logic.
 */
function parseAppointmentDateTime(dateStr: string, timeStr: string): Date {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const lowerDate = dateStr.toLowerCase().replace('next ', '');
  const dayIdx = dayNames.indexOf(lowerDate);

  let date: Date;

  if (lowerDate === 'tomorrow') {
    date = new Date(now);
    date.setDate(date.getDate() + 1);
  } else if (lowerDate === 'today') {
    date = new Date(now);
  } else if (dayIdx >= 0) {
    date = new Date(now);
    const currentDay = date.getDay();
    let daysAhead = dayIdx - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    date.setDate(date.getDate() + daysAhead);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
      if (date.getFullYear() < 2020) date.setFullYear(now.getFullYear());
    } else {
      date = new Date(now);
      date.setDate(date.getDate() + 1);
    }
  }

  let hours = 10, minutes = 0;
  if (timeStr && timeStr !== 'TBD') {
    const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3]?.toLowerCase();
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function createCalendarEvent(userId: string, appt: CalendarEventInput): Promise<string | null> {
  const tokens = userTokens.get(userId);
  if (!tokens) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Refresh token if needed
  oauth2Client.on('tokens', (newTokens) => {
    const existing = userTokens.get(userId);
    userTokens.set(userId, { ...existing, ...newTokens });
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const startDate = parseAppointmentDateTime(appt.date, appt.time);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min

  const location = appt.consultType.includes('House Call')
    ? 'Home Visit'
    : appt.consultType.includes('Clinic')
      ? 'Doctor Anywhere Clinic'
      : 'Video Teleconsult (Doctor Anywhere App)';

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Doctor Anywhere - ${appt.consultType} with ${appt.doctor}`,
      description: [
        `Booking Ref: ${appt.confirmationNo}`,
        `Doctor: ${appt.doctor} (${appt.specialty})`,
        `Patient: ${appt.patientName}`,
        `Type: ${appt.consultType}`,
        `Fee: $${Number(appt.fee).toFixed(2)}`,
        '',
        'Medication can be delivered within 3 hours after consultation.',
      ].join('\n'),
      location,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Singapore',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Singapore',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 120 },
        ],
      },
    },
  });

  console.log(`[GoogleCal] Created event ${event.data.id} for user ${userId}`);
  return event.data.htmlLink || null;
}
