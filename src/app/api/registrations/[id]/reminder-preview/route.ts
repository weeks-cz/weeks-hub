import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { programName, locationName, termLabel } from '@/lib/kvCamps';
import { buildReminderPreviewHtml } from '@/lib/reminderEmail';

export const dynamic = 'force-dynamic';

// Admin-only preview of the payment-reminder email weeks_web sends to this parent.
// Returns rendered HTML (opened in a new tab from the registration detail panel).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id } = await params;
  const service = createServiceClient();
  const { data: reg } = await service
    .from('registrations')
    .select('child_name, program, location_id, term_start, term_end, payment_amount')
    .eq('id', id)
    .single();

  if (!reg) {
    return NextResponse.json({ error: 'Registrace nenalezena' }, { status: 404 });
  }

  const html = buildReminderPreviewHtml({
    childName: reg.child_name as string,
    programName: programName(reg.program as string),
    locationName: locationName(reg.location_id as string),
    termLabel: termLabel(reg.term_start as string, reg.term_end as string),
    priceKc: (reg.payment_amount as number | null) ?? 0,
    paymentUrl: `https://weeks.cz/platba/${id}?location=${reg.location_id}`,
  });

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
