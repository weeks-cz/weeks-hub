import type React from 'react';
import type { Registration } from '@/types/database';
import { PAYMENT_STATUS_CONFIG } from '@/types/database';
import { FileText, Mail, ClipboardCheck, CreditCard, BellRing } from 'lucide-react';

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
}

function Badge({ icon: Icon, label, ok }: { icon: React.ElementType; label: string; ok: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
      style={{
        backgroundColor: ok ? '#10B98115' : '#64748B15',
        color: ok ? '#10B981' : '#64748B',
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export function StatusBadges({ r }: { r: Registration }) {
  // A cancelled registration keeps payment_status 'pending' (so a retry stays
  // possible), but it must NOT look like it's genuinely awaiting payment. Show it
  // as 'Stornováno' (grey) and drop the reminder badge — no reminder is sent for it.
  const isCancelled = r.status === 'cancelled';
  const pay = PAYMENT_STATUS_CONFIG[r.payment_status];
  const payLabel = isCancelled ? 'Stornováno' : pay.label;
  const payColor = isCancelled ? '#64748B' : pay.color;
  const confSent = fmt(r.confirmation_sent_at);
  const nastSent = fmt(r.nastupni_sent_at);
  const reminderSent = fmt(r.payment_reminder_sent_at);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
        style={{ backgroundColor: `${payColor}15`, color: payColor }}
      >
        <CreditCard className="w-3.5 h-3.5" />
        {payLabel}
      </span>
      <Badge icon={FileText} label={r.fakturoid_invoice_id ? 'Faktura' : 'Bez faktury'} ok={!!r.fakturoid_invoice_id} />
      <Badge icon={Mail} label={confSent ? `Mail ${confSent}` : 'Mail —'} ok={!!confSent} />
      <Badge icon={ClipboardCheck} label={nastSent ? `Nástupní ${nastSent}` : 'Nástupní —'} ok={!!nastSent} />
      {r.payment_status === 'pending' && !isCancelled && (
        <Badge icon={BellRing} label={reminderSent ? `Upomínka ${reminderSent}` : 'Upomínka —'} ok={!!reminderSent} />
      )}
    </div>
  );
}
