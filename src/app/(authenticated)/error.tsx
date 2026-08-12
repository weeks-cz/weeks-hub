'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Něco v sekci spadlo.
 *
 * Bez téhle hranice zmizela při chybě celá aplikace včetně menu a člověku
 * zbyla prázdná obrazovka, ze které vedlo jen tlačítko zpět v prohlížeči.
 * Takhle zůstane zbytek hubu použitelný a jde zkusit načtení znovu.
 */
export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Digest je jediné, podle čeho se chyba dohledá ve Vercel logu.
    console.error('Chyba v sekci:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F87171]/10">
          <AlertTriangle className="h-6 w-6 text-[#F87171]" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--text-primary)]">
            Tuhle sekci se nepodařilo načíst
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Zbytek hubu funguje dál. Zkus načtení znovu — pokud to bude padat pořád, pošli Lukášovi
            kód chyby níže.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Zkusit znovu
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
          >
            Na dashboard
          </Link>
        </div>

        {error.digest && (
          <p className="font-mono text-xs text-[var(--text-muted)]">Kód chyby: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
