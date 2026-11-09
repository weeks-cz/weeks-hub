/**
 * Tým a testovací účty se do čísel učebny nepočítají — stejné pravidlo jako
 * `docs/metriky-brana-1.sql` ve weeks-iot (rozhodnutí 19. 10. 2026).
 */
export function jeInterni(email: string | null | undefined) {
  const e = (email ?? '').toLowerCase();
  return (
    e.endsWith('@weeks.cz') ||
    e.endsWith('@resend.dev') ||
    e.endsWith('@test.cz') ||
    e.startsWith('test+')
  );
}
