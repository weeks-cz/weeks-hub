'use client';

import { Printer } from 'lucide-react';
import type { Registration } from '@/types/database';
import { ageFromBirthdate, programName, termLabel, locationName } from '@/lib/kvCamps';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-1.5 border-b border-gray-300 flex gap-3">
      <span className="w-44 shrink-0 text-gray-500">{label}</span>
      <span className="text-black break-words">{value || '—'}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="text-base font-bold text-black border-b-2 border-black pb-1 mb-2">{title}</h2>
      <div className="text-sm">{children}</div>
    </section>
  );
}

export function ParticipantSheet({ registration: r }: { registration: Registration }) {
  const pickup =
    r.pickup_method === 'solo'
      ? `Dítě odejde samo${r.pickup_time ? ` v ${r.pickup_time}` : ''}`
      : r.pickup_method === 'named_persons'
        ? r.pickup_persons || '—'
        : '—';

  return (
    <div className="mx-auto max-w-[210mm] bg-white text-black p-8 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Účastnický list</h1>
          <p className="text-gray-600">
            {programName(r.program)} · {termLabel(r.term_start, r.term_end)} · {locationName(r.location_id)}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="print:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-indigo-600 text-white"
        >
          <Printer className="w-4 h-4" /> Tisk
        </button>
      </div>

      <Block title="Dítě">
        <Field label="Jméno a příjmení" value={r.child_name} />
        <Field label="Datum narození" value={`${fmtDate(r.child_birthdate)} (${ageFromBirthdate(r.child_birthdate)} let)`} />
        <Field label="Zdravotní pojišťovna" value={r.child_insurance} />
        <Field label="Zdravotní poznámky" value={<span className="whitespace-pre-line">{r.child_health_notes}</span>} />
        <Field label="Zkušenosti" value={<span className="whitespace-pre-line">{r.child_experience}</span>} />
      </Block>

      <Block title="Zákonný zástupce">
        <Field label="Jméno" value={r.parent_name} />
        <Field label="E-mail" value={r.parent_email} />
        <Field label="Telefon" value={r.parent_phone} />
        <Field label="Adresa" value={r.parent_address} />
      </Block>

      <Block title="Vyzvednutí">
        <Field label="Způsob" value={<span className="whitespace-pre-line">{pickup}</span>} />
      </Block>

      <Block title="Souhlasy">
        <Field label="VOP" value={r.vop_consent ? 'Ano' : 'Ne'} />
        <Field label="GDPR" value={r.gdpr_consent ? 'Ano' : 'Ne'} />
        <Field label="Fotografie" value={r.photo_consent ? 'Ano' : 'Ne'} />
      </Block>

      <p className="mt-8 text-xs text-gray-400">
        Vytištěno z Weeks Hub · {new Date().toLocaleDateString('cs-CZ')}
      </p>
    </div>
  );
}
