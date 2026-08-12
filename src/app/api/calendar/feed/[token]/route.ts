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

  // Termíny úkolů přihlášeného člověka. Události jsou týmové, úkoly schválně
  // ne — do vlastního kalendáře patří jen to, co má na starosti on.
  // ?ukoly=0 je vypne, kdyby si někdo chtěl nechat čistě týmový kalendář.
  const chceUkoly = new URL(_req.url).searchParams.get('ukoly') !== '0';

  let taskEvents: IcsEvent[] = [];
  if (chceUkoly) {
    const { data: tasks } = await service
      .from('tasks')
      .select('id, title, description, due_date, updated_at')
      .eq('assignee_id', owner.id)
      .neq('status', 'done')
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });

    taskEvents = (tasks ?? []).map((t) => ({
      id: `task-${t.id}`,
      title: `📋 ${t.title}`,
      description: t.description,
      // due_date je DATE, takže úkol je celodenní záležitost.
      start_date: t.due_date as string,
      end_date: null,
      all_day: true,
      updated_at: t.updated_at,
    }));
  }

  const body = buildCalendar([...((data ?? []) as IcsEvent[]), ...taskEvents], 'Weeks — týmový kalendář');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="weeks.ics"',
      // The feed is the whole state; a deleted event must disappear, not linger.
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
