import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { getInvoicePublicUrl } from '@/lib/fakturoid';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id } = await params;
  const service = createServiceClient();
  const { data: reg } = await service
    .from('registrations')
    .select('fakturoid_invoice_id')
    .eq('id', id)
    .single();

  if (!reg?.fakturoid_invoice_id) {
    return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 });
  }

  const url = await getInvoicePublicUrl(reg.fakturoid_invoice_id as string);
  if (!url) return NextResponse.json({ error: 'Fakturu se nepodařilo načíst' }, { status: 502 });
  return NextResponse.json({ url });
}
