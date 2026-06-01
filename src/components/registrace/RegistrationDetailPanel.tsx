'use client';

import type React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Registration } from '@/types/database';
import { PAYMENT_STATUS_CONFIG } from '@/types/database';
import { ageFromBirthdate, programName, termLabel } from '@/lib/kvCamps';
import { StatusBadges } from './StatusBadges';

async function openInvoice(id: string) {
  const res = await fetch(`/api/registrations/${id}/invoice`);
  if (!res.ok) {
    toast.error('Fakturu se nepodařilo načíst');
    return;
  }
  const { url } = (await res.json()) as { url: string };
  window.open(url, '_blank', 'noopener');
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('cs-CZ');
}

function bool(v: boolean | null): string {
  return v ? 'Ano' : 'Ne';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <div className="rounded-xl border border-[var(--border-default)] px-4 py-1">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm border-b border-[var(--border-default)] last:border-0">
      <span className="text-[var(--text-secondary)] shrink-0">{label}</span>
      <span className="text-[var(--text-primary)] text-right break-words">{value || '—'}</span>
    </div>
  );
}

export function RegistrationDetailPanel({
  registration: r,
  onClose,
}: {
  registration: Registration | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {r && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-full max-w-lg bg-[var(--bg-surface)] border-l border-[var(--border-default)] z-50 overflow-y-auto"
          >
            <header className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-6 py-4 flex items-center justify-between z-10">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">{r.child_name}</h2>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {programName(r.program)} · {termLabel(r.term_start, r.term_end)}
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] shrink-0">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-[var(--border-default)]">
              {r.fakturoid_invoice_id && (
                <button
                  onClick={() => openInvoice(r.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                >
                  <FileText className="w-4 h-4" /> Náhled faktury
                </button>
              )}
              <a
                href={`/registrace/${r.id}/tisk`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
              >
                <Printer className="w-4 h-4" /> Tisk listu
              </a>
            </div>

            <div className="px-6 py-4 space-y-5">
              <Section title="Stav odeslaného">
                <div className="py-2">
                  <StatusBadges r={r} />
                </div>
              </Section>

              <Section title="Dítě">
                <Row label="Jméno" value={r.child_name} />
                <Row label="Datum narození" value={`${fmtDate(r.child_birthdate)} (${ageFromBirthdate(r.child_birthdate)} let)`} />
                <Row label="Pojišťovna" value={r.child_insurance} />
                <Row label="Zdravotní poznámky" value={r.child_health_notes} />
                <Row label="Zkušenosti" value={r.child_experience} />
              </Section>

              <Section title="Rodič">
                <Row label="Jméno" value={r.parent_name} />
                <Row label="E-mail" value={<a className="text-[var(--color-primary)] underline" href={`mailto:${r.parent_email}`}>{r.parent_email}</a>} />
                <Row label="Telefon" value={<a className="text-[var(--color-primary)] underline" href={`tel:${r.parent_phone}`}>{r.parent_phone}</a>} />
                <Row label="Adresa" value={r.parent_address} />
              </Section>

              <Section title="Vyzvednutí">
                {r.pickup_method === 'solo' ? (
                  <Row label="Způsob" value={`Dítě odejde samo${r.pickup_time ? ` v ${r.pickup_time}` : ''}`} />
                ) : r.pickup_method === 'named_persons' ? (
                  <Row label="Vyzvedne" value={<span className="whitespace-pre-line">{r.pickup_persons}</span>} />
                ) : (
                  <Row label="Způsob" value="—" />
                )}
              </Section>

              <Section title="Souhlasy">
                <Row label="VOP" value={bool(r.vop_consent)} />
                <Row label="GDPR" value={bool(r.gdpr_consent)} />
                <Row label="Fotografie" value={bool(r.photo_consent)} />
                <Row label="Marketing" value={bool(r.marketing_consent)} />
              </Section>

              <Section title="Platba">
                <Row label="Stav" value={PAYMENT_STATUS_CONFIG[r.payment_status].label} />
                <Row label="Částka" value={r.payment_amount ? `${r.payment_amount.toLocaleString('cs-CZ')} Kč` : '—'} />
                <Row label="Metoda" value={r.payment_method} />
                <Row label="Comgate stav" value={r.comgate_status} />
                <Row label="Zaplaceno" value={fmtDateTime(r.payment_completed_at)} />
              </Section>

              <Section title="Audit">
                <Row label="Přihlášeno" value={fmtDateTime(r.created_at)} />
                <Row label="VOP odsouhlaseno" value={fmtDateTime(r.vop_accepted_at)} />
                <Row label="IP" value={r.vop_accepted_ip} />
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
