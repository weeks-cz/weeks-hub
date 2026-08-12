'use client';

import Link from 'next/link';
import { CalendarDays, CheckSquare } from 'lucide-react';
import { formatDateShort, formatTime } from '@/lib/utils/date';
import {
  NALEHAVOST_BARVA,
  NALEHAVOST_POPIS,
  urciNalehavost,
  type Nalehavost,
} from '@/lib/utils/urgency';
import type { CalendarEvent, Task } from '@/types/database';

interface FocusStreamProps {
  tasks: Task[];
  events: CalendarEvent[];
  currentUserId: string | undefined;
}

interface Radek {
  id: string;
  druh: 'ukol' | 'udalost';
  titul: string;
  popisek: string;
  datum: string;
  odkaz: string;
}

/** Pořadí, ve kterém se skupiny vykreslují. „Později" na dashboard nepatří. */
const SKUPINY: Nalehavost[] = ['po-terminu', 'dnes', 'tento-tyden'];

/**
 * Sloučený proud toho, co dnes potřebuje pozornost.
 *
 * Dashboard byl dřív rozdělený podle zdroje dat — karta na úkoly, karta na
 * události. Tak je postavená databáze, ne pozornost: člověk neuvažuje „mrknu
 * do tabulky událostí", ale „co je po termínu a co je dnes". Proto jsou tu
 * úkoly a události v jednom seznamu seřazeném podle naléhavosti.
 */
export function FocusStream({ tasks, events, currentUserId }: FocusStreamProps) {
  const mojeUkoly = tasks.filter((t) => t.assignee_id === currentUserId && t.status !== 'done');

  const radky: Radek[] = [];

  for (const t of mojeUkoly) {
    if (!t.due_date) continue;
    radky.push({
      id: `ukol-${t.id}`,
      druh: 'ukol',
      titul: t.title,
      popisek: formatDateShort(t.due_date),
      datum: t.due_date,
      odkaz: `/board?task=${t.id}`,
    });
  }

  for (const e of events) {
    radky.push({
      id: `udalost-${e.id}`,
      druh: 'udalost',
      titul: e.title,
      popisek: e.all_day ? 'Celý den' : formatTime(e.start_date),
      datum: e.start_date,
      odkaz: '/calendar',
    });
  }

  const bezTerminu = mojeUkoly.filter((t) => !t.due_date).length;

  const podleSkupin = new Map<Nalehavost, Radek[]>();
  for (const r of radky) {
    const skupina = urciNalehavost(r.datum);
    if (!SKUPINY.includes(skupina)) continue;
    const seznam = podleSkupin.get(skupina) ?? [];
    seznam.push(r);
    podleSkupin.set(skupina, seznam);
  }
  for (const seznam of podleSkupin.values()) {
    seznam.sort((a, b) => a.datum.localeCompare(b.datum));
  }

  const maObsah = podleSkupin.size > 0;

  return (
    <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Na tebe
        </h2>
        <Link
          href="/board"
          className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Board →
        </Link>
      </div>

      {!maObsah ? (
        <div className="py-8 text-center">
          <p className="text-sm text-[var(--text-primary)]">Tenhle týden tě nic netlačí.</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {bezTerminu > 0
              ? `Na boardu máš ${bezTerminu} ${bezTerminu === 1 ? 'úkol' : bezTerminu <= 4 ? 'úkoly' : 'úkolů'} bez termínu.`
              : 'Nic s termínem na tebe nečeká.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {SKUPINY.map((skupina) => {
            const seznam = podleSkupin.get(skupina);
            if (!seznam?.length) return null;
            const barva = NALEHAVOST_BARVA[skupina];

            return (
              <div key={skupina}>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-xs font-medium" style={{ color: barva }}>
                    {NALEHAVOST_POPIS[skupina]}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] tabular-nums">{seznam.length}</span>
                </div>

                <div className="space-y-1">
                  {seznam.map((r) => {
                    const Ikona = r.druh === 'ukol' ? CheckSquare : CalendarDays;
                    return (
                      <Link
                        key={r.id}
                        href={r.odkaz}
                        className="flex items-center gap-2.5 pl-2.5 pr-2 py-2 rounded-lg border-l-2 hover:bg-[var(--bg-surface-hover)] transition-colors"
                        style={{ borderLeftColor: barva }}
                      >
                        <Ikona className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-primary)] flex-1 min-w-0 truncate">
                          {r.titul}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] shrink-0 tabular-nums">
                          {r.popisek}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {bezTerminu > 0 && (
            <p className="text-xs text-[var(--text-muted)] pt-1">
              Bez termínu: {bezTerminu}{' '}
              <Link href="/board" className="text-[var(--color-primary)] hover:underline">
                na boardu
              </Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
