import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { parseSheet, type ParsedImportRow } from '@/lib/children/importFormat';

export const dynamic = 'force-dynamic';

const MAX_ROWS = 5000;
const MAX_BYTES = 10 * 1024 * 1024;

export type ImportRowStatus = 'new' | 'existing' | 'duplicate' | 'error';

export interface ImportPreviewRow extends ParsedImportRow {
  status: ImportRowStatus;
  /** Matched on name alone because the sheet had no birthdate. */
  uncertain: boolean;
}

/** Same key the child_visits dedup index uses. */
function visitKey(childKey: string, campLabel: string, visitDate: string | null): string {
  return `${childKey}|${campLabel.trim().toLowerCase()}|${visitDate ?? ''}`;
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const commit = form?.get('mode') === 'commit';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Chybí soubor' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Soubor je příliš velký (max 10 MB)' }, { status: 400 });
  }

  // Imported at call time — exceljs is heavy and only this route needs it.
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Soubor se nepodařilo přečíst — je to opravdu .xlsx?' }, { status: 400 });
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return NextResponse.json({ error: 'Sešit neobsahuje žádný list' }, { status: 400 });

  const rows: unknown[][] = [];
  sheet.eachRow((row) => {
    if (rows.length > MAX_ROWS) return;
    // exceljs row.values is 1-based; index 0 is always empty.
    rows.push((row.values as unknown[]).slice(1));
  });

  const parsed = parseSheet(rows);

  if (parsed.missingRequired.length > 0) {
    return NextResponse.json(
      { error: `V souboru chybí povinné sloupce: ${parsed.missingRequired.join(', ')}` },
      { status: 400 }
    );
  }
  if (parsed.rows.length === 0) {
    return NextResponse.json({ error: 'Soubor neobsahuje žádné řádky s daty' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: childrenData, error: childrenError } = await service.from('children').select('id, match_key');
  if (childrenError) return NextResponse.json({ error: 'Načtení dětí selhalo' }, { status: 500 });

  const childIdByKey = new Map<string, string>(
    (childrenData ?? []).map((c) => [(c as { match_key: string }).match_key, (c as { id: string }).id])
  );

  const { data: visitsData } = await service.from('child_visits').select('child_id, camp_label, visit_date');

  const keyByChildId = new Map(Array.from(childIdByKey, ([key, id]) => [id, key]));
  const existingVisits = new Set(
    (visitsData ?? []).map((v) => {
      const visit = v as { child_id: string; camp_label: string; visit_date: string | null };
      return visitKey(keyByChildId.get(visit.child_id) ?? visit.child_id, visit.camp_label, visit.visit_date);
    })
  );

  // Rows are classified in order so that a child appearing twice in one file is
  // "new" on its first row and "existing" afterwards, rather than new twice.
  const seenChildren = new Set(childIdByKey.keys());
  const seenVisits = new Set(existingVisits);
  const preview: ImportPreviewRow[] = [];

  for (const row of parsed.rows) {
    if (row.error) {
      preview.push({ ...row, status: 'error', uncertain: false });
      continue;
    }

    const isDuplicate = seenVisits.has(visitKey(row.matchKey, row.campLabel, row.visitDate));
    const status: ImportRowStatus = isDuplicate ? 'duplicate' : seenChildren.has(row.matchKey) ? 'existing' : 'new';

    if (!isDuplicate) {
      seenChildren.add(row.matchKey);
      seenVisits.add(visitKey(row.matchKey, row.campLabel, row.visitDate));
    }

    preview.push({ ...row, status, uncertain: !row.birthdate });
  }

  const summary = {
    new: preview.filter((r) => r.status === 'new').length,
    existing: preview.filter((r) => r.status === 'existing').length,
    duplicate: preview.filter((r) => r.status === 'duplicate').length,
    error: preview.filter((r) => r.status === 'error').length,
  };

  if (!commit) {
    return NextResponse.json({ committed: false, summary, rows: preview });
  }

  // ---- Commit ----
  const importable = preview.filter((r) => r.status === 'new' || r.status === 'existing');

  const newChildren = new Map<string, Record<string, unknown>>();
  for (const row of importable) {
    if (childIdByKey.has(row.matchKey) || newChildren.has(row.matchKey)) continue;
    newChildren.set(row.matchKey, {
      full_name: row.fullName,
      birthdate: row.birthdate,
      match_key: row.matchKey,
      parent_name: row.parentName,
      parent_email: row.parentEmail,
      parent_phone: row.parentPhone,
      insurance: row.insurance,
      notes: row.notes,
      source: 'ddm',
      created_by: gate.user.id,
    });
  }

  if (newChildren.size > 0) {
    const { data, error } = await service
      .from('children')
      .upsert(Array.from(newChildren.values()), { onConflict: 'match_key', ignoreDuplicates: true })
      .select('id, match_key');

    if (error) return NextResponse.json({ error: 'Vytvoření dětí selhalo' }, { status: 500 });
    for (const child of data ?? []) {
      childIdByKey.set((child as { match_key: string }).match_key, (child as { id: string }).id);
    }
  }

  const visitRows = importable
    .map((row) => {
      const childId = childIdByKey.get(row.matchKey);
      if (!childId) return null;
      return {
        child_id: childId,
        camp_label: row.campLabel,
        location: row.location,
        visit_date: row.visitDate,
        source: 'ddm',
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  // Plain insert, not upsert: the dedup index is an expression index
  // (COALESCE on visit_date) and ON CONFLICT cannot infer those. Duplicates are
  // already filtered out above — the index is only a backstop.
  let visitsCreated = 0;
  if (visitRows.length > 0) {
    const { data, error } = await service.from('child_visits').insert(visitRows).select('id');

    if (error) {
      const message =
        error.code === '23505'
          ? 'Část návštěv už v databázi je — zkuste import spustit znovu'
          : 'Vytvoření návštěv selhalo';
      return NextResponse.json({ error: message }, { status: 500 });
    }
    visitsCreated = data?.length ?? 0;
  }

  return NextResponse.json({
    committed: true,
    summary,
    childrenCreated: newChildren.size,
    visitsCreated,
  });
}
