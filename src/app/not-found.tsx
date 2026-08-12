import Link from 'next/link';
import { Compass } from 'lucide-react';

/**
 * Stránka neexistuje.
 *
 * Do teď se na překlep v adrese ukázala výchozí černobílá stránka Nextu — bez
 * loga, bez menu a hlavně bez odkazu kamkoli dál. Tohle vypadá jako zbytek
 * hubu a vede zpátky dovnitř.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg-primary)] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-surface)]">
        <Compass className="h-7 w-7 text-[var(--text-muted)]" />
      </div>

      <div className="space-y-2">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--text-primary)]">
          Taková stránka tu není
        </h1>
        <p className="max-w-sm text-sm text-[var(--text-muted)]">
          Zkontroluj adresu — nebo se vrať na dashboard a najdi to odtamtud.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Zpět na dashboard
      </Link>
    </main>
  );
}
