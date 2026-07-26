import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { buildMatchKey } from '@/lib/children/matching';
import type { Child, ChildVisit } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const service = createServiceClient();
  const { data, error } = await service
    .from('children')
    .select('*, visits:child_visits(*)')
    .order('full_name', { ascending: true });

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const children = (data ?? []).map((row) => {
    const child = row as Child & { visits: ChildVisit[] };
    const visits = [...(child.visits ?? [])].sort((a, b) =>
      (b.visit_date ?? '').localeCompare(a.visit_date ?? '')
    );

    return {
      ...child,
      visits,
      visit_count: visits.length,
      last_visit: visits.find((v) => v.visit_date)?.visit_date ?? null,
    };
  });

  return NextResponse.json({ children });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatný požadavek' }, { status: 400 });
  }

  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  if (!fullName) return NextResponse.json({ error: 'Jméno je povinné' }, { status: 400 });

  const birthdate = typeof body.birthdate === 'string' && body.birthdate ? body.birthdate : null;
  const text = (key: string) => {
    const value = body[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };

  const service = createServiceClient();
  const { data, error } = await service
    .from('children')
    .insert({
      full_name: fullName,
      birthdate,
      match_key: buildMatchKey(fullName, birthdate),
      parent_name: text('parent_name'),
      parent_email: text('parent_email'),
      parent_phone: text('parent_phone'),
      insurance: text('insurance'),
      health_notes: text('health_notes'),
      experience: text('experience'),
      notes: text('notes'),
      source: 'manual',
      created_by: gate.user.id,
    })
    .select()
    .single();

  if (error) {
    // Unique violation on match_key — same name and birthdate already exists.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Toto dítě už v databázi je' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Uložení selhalo' }, { status: 500 });
  }

  return NextResponse.json({ child: data });
}
