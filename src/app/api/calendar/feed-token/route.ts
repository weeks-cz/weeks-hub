import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Returns the caller's feed token, or null if they never created one. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const { data } = await service.from('users').select('calendar_feed_token').eq('id', userId).single();

  return NextResponse.json({ token: data?.calendar_feed_token ?? null });
}

/**
 * Creates the token, or replaces it when `regenerate` is set — which is how a
 * leaked link gets cut off, since the old URL stops resolving immediately.
 */
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const regenerate = body?.regenerate === true;

  const service = createServiceClient();

  if (!regenerate) {
    const { data } = await service.from('users').select('calendar_feed_token').eq('id', userId).single();
    if (data?.calendar_feed_token) {
      return NextResponse.json({ token: data.calendar_feed_token });
    }
  }

  const token = crypto.randomUUID();
  const { error } = await service.from('users').update({ calendar_feed_token: token }).eq('id', userId);

  if (error) return NextResponse.json({ error: 'Vytvoření odkazu selhalo' }, { status: 500 });

  return NextResponse.json({ token });
}
