/**
 * Tým a testovací účty se do čísel učebny nepočítají — stejné pravidlo jako
 * `docs/metriky-brana-1.sql` ve weeks-iot (rozhodnutí 19. 10. 2026).
 */
/** Osobní adresy týmu, kterými se testuje učebna (ne @weeks.cz). */
const TYM_OSOBNI = new Set(['lukaskubik2005@gmail.com', 'lukoluko8@gmail.com']);

export function jeInterni(email: string | null | undefined) {
  const e = (email ?? '').toLowerCase();
  return (
    TYM_OSOBNI.has(e) ||
    e.endsWith('@weeks.cz') ||
    e.endsWith('@resend.dev') ||
    e.endsWith('@test.cz') ||
    e.startsWith('test+')
  );
}
