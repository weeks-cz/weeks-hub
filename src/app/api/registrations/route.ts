import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const service = createServiceClient();
  const { data, error } = await service
    .from('registrations')
    .select('*')
    .order('term_start', { ascending: true })
    .order('child_name', { ascending: true });

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });
  return NextResponse.json({ registrations: data ?? [] });
}
