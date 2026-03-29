import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// Per-user OAuth2 tokens (in-memory for demo)
const userTokens = new Map<string, any>();

function getOAuth2Client() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
  );
}

export function isGoogleCalendarConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleAuthUrl(userId: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: userId,
  });
}

export async function handleGoogleCallback(code: string, userId: string): Promise<void> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
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

/** Get a valid access token, refreshing if needed */
async function getAccessToken(userId: string): Promise<string> {
  const tokens = userTokens.get(userId);
  if (!tokens) throw new Error('Not connected');

  const client = getOAuth2Client();
  client.setCredentials(tokens);

  // Check if token needs refresh
  if (tokens.expiry_date && Date.now() >= tokens.expiry_date - 60000) {
    const { credentials } = await client.refreshAccessToken();
    userTokens.set(userId, credentials);
    return credentials.access_token!;
  }

  return tokens.access_token;
}

export async function createCalendarEvent(userId: string, appt: CalendarEventInput): Promise<string | null> {
  const accessToken = await getAccessToken(userId);

  const startDate = parseAppointmentDateTime(appt.date, appt.time);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const location = appt.consultType.includes('House Call')
    ? 'Home Visit'
    : appt.consultType.includes('Clinic')
      ? 'Doctor Anywhere Clinic'
      : 'Video Teleconsult (Doctor Anywhere App)';

  const eventBody = {
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
    start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Singapore' },
    end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Singapore' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'email', minutes: 120 },
      ],
    },
  };

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${res.status} ${err}`);
  }

  const data: any = await res.json();
  console.log(`[GoogleCal] Created event ${data.id} for user ${userId}`);
  return data.htmlLink || null;
}
