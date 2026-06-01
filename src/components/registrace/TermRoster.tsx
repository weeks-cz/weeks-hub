'use client';

import { Printer } from 'lucide-react';
import type { Registration } from '@/types/database';
import { ageFromBirthdate, programName, termLabel } from '@/lib/kvCamps';

export function TermRoster({
  registrations,
  program,
  termStart,
  termEnd,
}: {
  registrations: Registration[];
  program: string;
  termStart: string;
  termEnd: string;
}) {
  const rows = registrations
    .filter((r) => r.status !== 'cancelled')
    .sort((a, b) => a.child_name.localeCompare(b.child_name, 'cs'));

  return (
    <div className="mx-auto max-w-[277mm] bg-white text-black p-8 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Soupiska účastníků</h1>
          <p className="text-gray-600">
            {programName(program)} · {termLabel(termStart, termEnd)} · {rows.length} dětí
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="print:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-indigo-600 text-white"
        >
          <Printer className="w-4 h-4" /> Tisk
        </button>
      </div>

      <table className="w-full mt-5 text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-2 pr-2 w-8">✓</th>
            <th className="py-2 pr-2 w-6">#</th>
            <th className="py-2 pr-3">Jméno</th>
            <th className="py-2 pr-3 w-12">Věk</th>
            <th className="py-2 pr-3">Pojišťovna</th>
            <th className="py-2 pr-3">Kontakt rodiče</th>
            <th className="py-2 pr-3">Zdravotní poznámka</th>
            <th className="py-2">Vyzvednutí</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-gray-300 align-top">
              <td className="py-2 pr-2 text-lg leading-none">☐</td>
              <td className="py-2 pr-2 text-gray-500">{i + 1}</td>
              <td className="py-2 pr-3 font-medium">{r.child_name}</td>
              <td className="py-2 pr-3">{ageFromBirthdate(r.child_birthdate)}</td>
              <td className="py-2 pr-3">{r.child_insurance}</td>
              <td className="py-2 pr-3">{r.parent_phone}</td>
              <td className="py-2 pr-3 whitespace-pre-line">{r.child_health_notes || '—'}</td>
              <td className="py-2">
                {r.pickup_method === 'solo'
                  ? `Sám${r.pickup_time ? ` (${r.pickup_time})` : ''}`
                  : r.pickup_method === 'named_persons'
                    ? 'Jmenovaná osoba'
                    : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-8 text-xs text-gray-400">Vytištěno z Weeks Hub · {new Date().toLocaleDateString('cs-CZ')}</p>
    </div>
  );
}
