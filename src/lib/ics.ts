/**
 * iCalendar (RFC 5545) feed generation. No dependency — the format is small and
 * the rules that matter here are escaping, line folding and all-day handling.
 */

export interface IcsEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  updated_at: string;
  location?: string | null;
}

/** The team's timezone. All-day dates are resolved here, not in UTC. */
const TIMEZONE = 'Europe/Prague';

const DATE_IN_TZ = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** RFC 5545 §3.3.11 — backslash, semicolon, comma and newlines are special. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Content lines are limited to 75 octets, continued with a leading space.
 * Folding counts bytes, not characters — Czech text is multi-byte in UTF-8 and
 * splitting mid-character produces a file Apple silently refuses.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  // Continuation lines carry a leading space, so they fit one byte less.
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }

  if (current) parts.push(current);
  return parts.join('\r\n ');
}

/** YYYYMMDD in the team timezone, for VALUE=DATE properties. */
function toIcsDate(iso: string): string {
  return DATE_IN_TZ.format(new Date(iso)).replace(/-/g, '');
}

/** YYYYMMDDTHHMMSSZ — UTC, unambiguous for every client. */
function toIcsDateTime(iso: string): string {
  return `${new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

function addDay(iso: string): string {
  return new Date(new Date(iso).getTime() + 86_400_000).toISOString();
}

function buildEvent(event: IcsEvent, stamp: string): string[] {
  const lines = ['BEGIN:VEVENT', `UID:${event.id}@weeks.cz`, `DTSTAMP:${stamp}`];

  if (event.all_day) {
    // DTEND is exclusive for date values: a one-day event ends the next morning.
    const endSource = event.end_date ?? event.start_date;
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(event.start_date)}`);
    lines.push(`DTEND;VALUE=DATE:${toIcsDate(addDay(endSource))}`);
  } else {
    lines.push(`DTSTART:${toIcsDateTime(event.start_date)}`);
    if (event.end_date) lines.push(`DTEND:${toIcsDateTime(event.end_date)}`);
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);

  // Bumping SEQUENCE on edit is what makes clients replace rather than ignore.
  const sequence = Math.floor(new Date(event.updated_at).getTime() / 1000);
  if (Number.isFinite(sequence)) lines.push(`SEQUENCE:${sequence}`);

  lines.push('END:VEVENT');
  return lines;
}

/**
 * @param now injected so output is deterministic in tests
 */
export function buildCalendar(events: IcsEvent[], calendarName: string, now: Date = new Date()): string {
  const stamp = toIcsDateTime(now.toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Weeks//Weeks Hub//CS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    `X-WR-TIMEZONE:${TIMEZONE}`,
    // Hints only — Google honours neither and polls on its own schedule.
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  for (const event of events) {
    // A row with an unparseable start would produce a file clients reject wholesale.
    if (Number.isNaN(new Date(event.start_date).getTime())) continue;
    lines.push(...buildEvent(event, stamp));
  }

  lines.push('END:VCALENDAR');

  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
