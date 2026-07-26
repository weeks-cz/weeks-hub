import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { buildMatchKey } from '@/lib/children/matching';

export const dynamic = 'force-dynamic';

const EDITABLE = [
  'full_name',
  'birthdate',
  'parent_name',
  'parent_email',
  'parent_phone',
  'insurance',
  'health_notes',
  'experience',
  'notes',
] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatný požadavek' }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  for (const key of EDITABLE) {
    if (!(key in body)) continue;
    const value = body[key];
    updates[key] = typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nic k uložení' }, { status: 400 });
  }

  if (updates.full_name === null) {
    return NextResponse.json({ error: 'Jméno je povinné' }, { status: 400 });
  }

  const service = createServiceClient();

  // match_key is derived from name + birthdate, so it has to be rebuilt whenever
  // either changes — otherwise the child stops matching future imports.
  if ('full_name' in updates || 'birthdate' in updates) {
    const { data: current } = await service
      .from('children')
      .select('full_name, birthdate')
      .eq('id', id)
      .single();

    if (!current) return NextResponse.json({ error: 'Dítě nenalezeno' }, { status: 404 });

    const fullName = updates.full_name ?? (current.full_name as string);
    const birthdate = 'birthdate' in updates ? updates.birthdate : (current.birthdate as string | null);
    updates.match_key = buildMatchKey(fullName, birthdate);
  }

  const { data, error } = await service
    .from('children')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Dítě se stejným jménem a datem narození už existuje' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Uložení selhalo' }, { status: 500 });
  }

  return NextResponse.json({ child: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id } = await params;
  const service = createServiceClient();

  // child_visits cascade on delete.
  const { error } = await service.from('children').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Smazání selhalo' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
