import { toDateKey } from '@/lib/utils/date';

/**
 * Barva štítku úkolu podle termínu.
 *
 * Dřív byly všechny štítky stejně červené, takže úkol s termínem v roce 2027
 * vypadal stejně naléhavě jako ten, který je po termínu. Červená má znamenat
 * "tohle hoří", ne "tohle je úkol".
 */
export function taskChipStyle(dueDate: string): { backgroundColor: string; color: string } {
  const dnes = toDateKey(new Date());
  const den = dueDate.slice(0, 10);

  if (den < dnes) return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171' }; // po termínu
  if (den === dnes) return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' }; // dnes
  return { backgroundColor: 'rgba(129, 140, 248, 0.15)', color: '#A5B4FC' }; // později
}

/**
 * České skloňování pro "+N dalších". Pro jedničku a dvojku až čtyřku je tvar
 * "další", od pěti výš "dalších" — původní text psal "dalších" vždycky.
 */
export function dalsiLabel(pocet: number): string {
  return pocet >= 5 ? `+${pocet} dalších` : `+${pocet} další`;
}
