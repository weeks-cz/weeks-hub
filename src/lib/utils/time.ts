/**
 * Převede ručně napsaný čas na HH:MM (24h), nebo vrátí null.
 *
 * Existuje kvůli tomu, že `<input type="time">` se zobrazuje podle jazyka
 * prohlížeče, ne podle `lang` stránky. V anglickém Chrome ukázal `09:00 AM`,
 * člověk přepsal hodinu na „3“ a AM zůstalo — událost na 15:00 se uložila
 * na 3:00 ráno. Textové pole s tímhle parserem je 24h u každého.
 *
 * Bere „15“, „15:30“, „15.30“, „15,30“, „15 30“, „1530“ i „930“ (→ 09:30).
 */
export function parseTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})(?:[:., ]?(\d{2}))?$/);
  if (!m) return null;

  const hodiny = Number(m[1]);
  const minuty = m[2] === undefined ? 0 : Number(m[2]);
  if (hodiny > 23 || minuty > 59) return null;

  return `${String(hodiny).padStart(2, '0')}:${String(minuty).padStart(2, '0')}`;
}
