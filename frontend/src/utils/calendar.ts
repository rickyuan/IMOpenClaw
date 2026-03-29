// Generate calendar event links from appointment data

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Parse loose date/time strings from AI conversation into a Date object.
 * Falls back to tomorrow 10am if parsing fails.
 */
function parseAppointmentDateTime(dateStr: string, timeStr: string): Date {
  const now = new Date();

  // Try to resolve day-of-week references (e.g. "Tuesday", "next Monday")
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
    // Find next occurrence of that weekday
    date = new Date(now);
    const currentDay = date.getDay();
    let daysAhead = dayIdx - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    date.setDate(date.getDate() + daysAhead);
  } else {
    // Try parsing "Mar 15", "3/15", "March 15" etc.
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
      // If parsed year is 2001 (from "Mar 15" without year), use current year
      if (date.getFullYear() < 2020) {
        date.setFullYear(now.getFullYear());
      }
    } else {
      // Fallback: tomorrow
      date = new Date(now);
      date.setDate(date.getDate() + 1);
    }
  }

  // Parse time (e.g. "2pm", "10:00am", "14:00", "3:00 PM")
  let hours = 10, minutes = 0; // default 10am
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

function toICSDateString(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

export function buildCalendarEvent(appointment: {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  patientName: string;
  consultType: string;
  fee: number;
  confirmationNo: string;
}): CalendarEvent {
  const startDate = parseAppointmentDateTime(appointment.date, appointment.time);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min default

  return {
    title: `Doctor Anywhere - ${appointment.consultType} with ${appointment.doctor}`,
    description: [
      `Booking Ref: ${appointment.confirmationNo}`,
      `Doctor: ${appointment.doctor} (${appointment.specialty})`,
      `Patient: ${appointment.patientName}`,
      `Type: ${appointment.consultType}`,
      `Fee: $${Number(appointment.fee).toFixed(2)}`,
      '',
      'Medication can be delivered within 3 hours after consultation.',
    ].join('\n'),
    location: appointment.consultType.includes('House Call')
      ? 'Home Visit'
      : appointment.consultType.includes('Clinic')
        ? 'Doctor Anywhere Clinic'
        : 'Video Teleconsult (Doctor Anywhere App)',
    startDate,
    endDate,
  };
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toICSDateString(event.startDate)}/${toICSDateString(event.endDate)}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadICSFile(event: CalendarEvent): void {
  const uid = `da-${Date.now()}@doctoranywhere.com`;
  const now = new Date();

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Doctor Anywhere//Appointment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDateString(now)}`,
    `DTSTART:${toICSDateString(event.startDate)}`,
    `DTEND:${toICSDateString(event.endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Appointment reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `appointment-${event.startDate.toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
