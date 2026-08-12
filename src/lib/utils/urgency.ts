import { toDateKey } from './date';

/**
 * Naléhavost podle termínu.
 *
 * Stejná škála se používá v kalendáři i na dashboardu, aby obě obrazovky
 * mluvily jedním jazykem: co je červené v kalendáři, je červené i tady.
 */
export type Nalehavost = 'po-terminu' | 'dnes' | 'tento-tyden' | 'pozdeji';

export const NALEHAVOST_BARVA: Record<Nalehavost, string> = {
  'po-terminu': '#F87171',
  dnes: '#FBBF24',
  'tento-tyden': '#A5B4FC',
  pozdeji: '#6B7280',
};

export const NALEHAVOST_POPIS: Record<Nalehavost, string> = {
  'po-terminu': 'Po termínu',
  dnes: 'Dnes',
  'tento-tyden': 'Tento týden',
  pozdeji: 'Později',
};

/**
 * @param datum ISO řetězec nebo YYYY-MM-DD
 * @param dnesRef injektovatelné „dnes" kvůli testovatelnosti
 */
export function urciNalehavost(datum: string, dnesRef: Date = new Date()): Nalehavost {
  const dnes = toDateKey(dnesRef);
  const den = datum.slice(0, 10);

  if (den < dnes) return 'po-terminu';
  if (den === dnes) return 'dnes';

  // Konec týdne = neděle. Pondělní start je v celém hubu (kalendář, date utils),
  // takže „tento týden" znamená do nejbližší neděle včetně, ne příštích 7 dní.
  const konecTydne = new Date(dnesRef);
  const doNedele = (7 - konecTydne.getDay()) % 7; // neděle = 0
  konecTydne.setDate(konecTydne.getDate() + doNedele);

  return den <= toDateKey(konecTydne) ? 'tento-tyden' : 'pozdeji';
}

/** Kolik celých dní uplynulo od data. Záporné číslo = datum je v budoucnu. */
export function dnuOd(datum: string, dnesRef: Date = new Date()): number {
  const a = new Date(datum.slice(0, 10));
  const b = new Date(toDateKey(dnesRef));
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** „3 dny", „1 den", „14 dní" — české skloňování. */
export function dnyText(pocet: number): string {
  if (pocet === 1) return '1 den';
  if (pocet >= 2 && pocet <= 4) return `${pocet} dny`;
  return `${pocet} dní`;
}
