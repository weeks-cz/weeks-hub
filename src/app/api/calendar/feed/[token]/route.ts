import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { buildCalendar, type IcsEvent } from '@/lib/ics';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public ICS feed. Calendar clients cannot carry a session, so the token in the
 * URL is the credential — anyone holding the link sees the team calendar, which
 * is why it can be rotated from the calendar page.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Reject malformed tokens before touching the database.
  if (!UUID.test(token)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const service = createServiceClient();

  const { data: owner } = await service
    .from('users')
    .select('id')
    .eq('calendar_feed_token', token)
    .maybeSingle();

  if (!owner) return new NextResponse('Not found', { status: 404 });

  const { data, error } = await service
    .from('calendar_events')
    .select('id, title, description, start_date, end_date, all_day, updated_at')
    .order('start_date', { ascending: true });

  if (error) return new NextResponse('Calendar unavailable', { status: 502 });

  const body = buildCalendar((data ?? []) as IcsEvent[], 'Weeks — týmový kalendář');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="weeks.ics"',
      // The feed is the whole state; a deleted event must disappear, not linger.
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
