import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { buildMatchKey } from '@/lib/children/matching';
import { programName } from '@/lib/kvCamps';
import type { Registration } from '@/types/database';

export const dynamic = 'force-dynamic';

/** "27. 7. – 31. 7. 2026" — end year only, it is always the same year in practice. */
function formatTermRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';

  const day = (d: Date) => `${d.getUTCDate()}. ${d.getUTCMonth() + 1}.`;
  return `${day(s)} – ${day(e)} ${e.getUTCFullYear()}`;
}

/** Fields a registration can fill in on a child record. */
const FILLABLE = ['parent_name', 'parent_email', 'parent_phone', 'insurance', 'health_notes', 'experience'] as const;

/**
 * Pulls KV registrations into the children database.
 *
 * Idempotent by construction: children are keyed by match_key and visits by
 * registration_id, both unique in the schema. Running it twice changes nothing.
 * Existing children only get NULL fields filled in — anything the team typed by
 * hand is left alone.
 */
export async function POST() {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const service = createServiceClient();

  const { data: regsData, error: regsError } = await service
    .from('registrations')
    .select('*')
    .neq('status', 'cancelled');

  if (regsError) return NextResponse.json({ error: 'Načtení registrací selhalo' }, { status: 500 });

  const registrations = (regsData ?? []) as Registration[];

  const { data: existingData, error: childrenError } = await service
    .from('children')
    .select('id, match_key, parent_name, parent_email, parent_phone, insurance, health_notes, experience');

  if (childrenError) return NextResponse.json({ error: 'Načtení dětí selhalo' }, { status: 500 });

  type ExistingChild = { id: string; match_key: string } & Record<(typeof FILLABLE)[number], string | null>;
  const byKey = new Map<string, ExistingChild>(
    (existingData ?? []).map((c) => [(c as ExistingChild).match_key, c as ExistingChild])
  );

  // ---- 1. Create children we have never seen ----
  const newChildren = new Map<string, Record<string, unknown>>();

  for (const reg of registrations) {
    const key = buildMatchKey(reg.child_name, reg.child_birthdate);
    if (byKey.has(key) || newChildren.has(key)) continue;

    newChildren.set(key, {
      full_name: reg.child_name.trim(),
      birthdate: reg.child_birthdate,
      match_key: key,
      parent_name: reg.parent_name,
      parent_email: reg.parent_email,
      parent_phone: reg.parent_phone,
      insurance: reg.child_insurance,
      health_notes: reg.child_health_notes,
      experience: reg.child_experience,
      source: 'kv',
      created_by: gate.user.id,
    });
  }

  if (newChildren.size > 0) {
    const { data: inserted, error } = await service
      .from('children')
      .upsert(Array.from(newChildren.values()), { onConflict: 'match_key', ignoreDuplicates: true })
      .select('id, match_key, parent_name, parent_email, parent_phone, insurance, health_notes, experience');

    if (error) return NextResponse.json({ error: 'Vytvoření dětí selhalo' }, { status: 500 });
    for (const child of inserted ?? []) byKey.set((child as ExistingChild).match_key, child as ExistingChild);
  }

  // ---- 2. Fill in blanks on children we already had ----
  let childrenUpdated = 0;

  for (const reg of registrations) {
    const child = byKey.get(buildMatchKey(reg.child_name, reg.child_birthdate));
    if (!child) continue;

    const fromReg: Record<(typeof FILLABLE)[number], string | null> = {
      parent_name: reg.parent_name,
      parent_email: reg.parent_email,
      parent_phone: reg.parent_phone,
      insurance: reg.child_insurance,
      health_notes: reg.child_health_notes,
      experience: reg.child_experience,
    };

    const patch: Record<string, string> = {};
    for (const field of FILLABLE) {
      if (child[field] == null && fromReg[field]) patch[field] = fromReg[field] as string;
    }

    if (Object.keys(patch).length === 0) continue;

    const { error } = await service.from('children').update(patch).eq('id', child.id);
    if (!error) {
      childrenUpdated++;
      Object.assign(child, patch);
    }
  }

  // ---- 3. Create the visits ----
  const { data: existingVisits } = await service
    .from('child_visits')
    .select('child_id, registration_id, camp_label, visit_date');

  const linked = new Set<string>();
  const seenVisits = new Set<string>();
  const visitKey = (childId: string, label: string, date: string | null) =>
    `${childId}|${label.trim().toLowerCase()}|${date ?? ''}`;

  for (const row of existingVisits ?? []) {
    const visit = row as { child_id: string; registration_id: string | null; camp_label: string; visit_date: string | null };
    if (visit.registration_id) linked.add(visit.registration_id);
    seenVisits.add(visitKey(visit.child_id, visit.camp_label, visit.visit_date));
  }

  const newVisits: Record<string, unknown>[] = [];

  for (const reg of registrations) {
    if (linked.has(reg.id)) continue;

    const child = byKey.get(buildMatchKey(reg.child_name, reg.child_birthdate));
    if (!child) continue;

    const range = formatTermRange(reg.term_start, reg.term_end);
    const campLabel = range ? `${programName(reg.program)} ${range}` : programName(reg.program);

    // A child can hold two registrations for one term (duplicate sign-up); that
    // is still one visit. Filtering here rather than with ON CONFLICT because
    // both unique indexes are partial/expression based and cannot be inferred.
    const key = visitKey(child.id, campLabel, reg.term_start);
    if (seenVisits.has(key)) continue;
    seenVisits.add(key);

    newVisits.push({
      child_id: child.id,
      registration_id: reg.id,
      camp_label: campLabel,
      location: reg.location_id,
      program: reg.program,
      visit_date: reg.term_start,
      source: 'kv',
    });
  }

  let visitsCreated = 0;
  if (newVisits.length > 0) {
    const { data, error } = await service.from('child_visits').insert(newVisits).select('id');
    if (error) return NextResponse.json({ error: 'Vytvoření návštěv selhalo' }, { status: 500 });
    visitsCreated = data?.length ?? 0;
  }

  return NextResponse.json({
    childrenCreated: newChildren.size,
    childrenUpdated,
    visitsCreated,
    registrationsScanned: registrations.length,
  });
}
