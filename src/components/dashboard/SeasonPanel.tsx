'use client';

import Link from 'next/link';
import { formatDateShort } from '@/lib/utils/date';
import type { TermGroup } from '@/hooks/useRegistrations';
import type { Registration } from '@/types/database';

interface SeasonPanelProps {
  registrations: Registration[];
  byTerm: TermGroup[];
  error: string | null;
}

const czk = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

/**
 * Skutečná čísla sezóny — zaplacené děti, vybrané peníze, obsazenost.
 *
 * Dashboard dřív otevíral číslem „Celkem tasků", které umí jen růst a proto
 * nic neznamená. Tohle jsou čísla, podle kterých se firma řídí, a dosud
 * nebyla na hlavní obrazovce vůbec.
 */
export function SeasonPanel({ registrations, byTerm, error }: SeasonPanelProps) {
  // Bez oprávnění (403) nebo při chybě se panel prostě nezobrazí.
  if (error || registrations.length === 0) return null;

  const zaplacene = registrations.filter((r) => r.status === 'paid' || r.status === 'confirmed');
  const trzby = zaplacene.reduce((soucet, r) => soucet + (r.payment_amount ?? 0), 0);

  const dnes = new Date().toISOString().slice(0, 10);
  const nadchazejici = byTerm
    .filter((t) => t.termEnd >= dnes)
    .sort((a, b) => a.termStart.localeCompare(b.termStart));

  const mistCelkem = nadchazejici.reduce((s, t) => s + t.capacity, 0);
  const mistObsazeno = nadchazejici.reduce((s, t) => s + t.activeCount, 0);
  const naplneno = mistCelkem > 0 ? Math.round((mistObsazeno / mistCelkem) * 100) : 0;

  const dalsi = nadchazejici[0];

  return (
    <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Sezóna
        </h2>
        <Link
          href="/registrace"
          className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Registrace →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] tabular-nums leading-none">
            {zaplacene.length}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {zaplacene.length === 1 ? 'zaplacené dítě' : zaplacene.length <= 4 ? 'zaplacené děti' : 'zaplacených dětí'}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] tabular-nums leading-none">
            {czk.format(trzby)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">vybráno</p>
        </div>
      </div>

      {nadchazejici.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-default)]">
          Žádný nadcházející turnus — čísla výše jsou za celou sezónu.
        </p>
      ) : (
        <div className="pt-3 border-t border-[var(--border-default)] space-y-3">
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs text-[var(--text-muted)]">
                Obsazenost nadcházejících turnusů
              </span>
              <span className="text-xs text-[var(--text-primary)] tabular-nums">
                {mistObsazeno}/{mistCelkem}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${naplneno}%`,
                  backgroundColor: naplneno >= 90 ? '#34D399' : naplneno >= 50 ? '#FBBF24' : '#F87171',
                }}
              />
            </div>
          </div>

          {dalsi && (
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-[var(--text-muted)] min-w-0 truncate">
                Nejbližší: {dalsi.programName}, {formatDateShort(dalsi.termStart)}
              </span>
              <span className="text-xs text-[var(--text-primary)] shrink-0 tabular-nums">
                {dalsi.activeCount}/{dalsi.capacity}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
