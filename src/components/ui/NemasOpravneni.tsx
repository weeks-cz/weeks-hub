import Link from 'next/link';
import { Lock } from 'lucide-react';

/**
 * Sekce jen pro adminy.
 *
 * Čtyři stránky měly čtyři různě odbytá odmítnutí — někde holá věta uprostřed
 * prázdna, jinde vůbec nic a rovnou data. Tohle je jedno místo, kde se to říká,
 * a hlavně z něj vede cesta zpátky: slepá ulička je horší než zamčené dveře.
 */
export function NemasOpravneni({ sekce }: { sekce?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-sm space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-surface-hover)]">
          <Lock className="h-6 w-6 text-[var(--text-muted)]" />
        </div>
        <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--text-primary)]">
          Jen pro adminy
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {sekce ? `Sekce ${sekce} je` : 'Tato sekce je'} přístupná jen účtům s rolí admin nebo
          vývojář. Pokud ji potřebuješ, řekni si Lukášovi o změnu role.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Zpět na dashboard
        </Link>
      </div>
    </div>
  );
}
