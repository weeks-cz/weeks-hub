import type { Registration } from '@/types/database';
import { toDateKey } from './date';

/** Kolik dní před začátkem turnusu má smysl řešit nástupní list. */
const NASTUPNI_PREDSTIH = 14;

/**
 * Co u registrace chybí a čeká na člověka.
 *
 * Řádek nesl čtyři podobně vypadající štítky a z pohledu na soupisku nešlo
 * poznat, se kterým z nich je něco potřeba udělat. Tohle vrací konkrétní
 * důvody, takže jde filtrovat i vypsat, co přesně chybí.
 *
 * @param dnesRef injektovatelné „dnes" kvůli testovatelnosti
 */
export function duvodyPozornosti(r: Registration, dnesRef: Date = new Date()): string[] {
  // Zrušená registrace už nic nepotřebuje, i když jí zůstal payment_status
  // 'pending' kvůli případnému opakování platby.
  if (r.status === 'cancelled') return [];

  const duvody: string[] = [];

  if (r.payment_status === 'pending') duvody.push('Čeká na platbu');

  if (r.payment_status === 'completed') {
    if (!r.fakturoid_invoice_id) duvody.push('Chybí faktura');
    if (!r.confirmation_sent_at) duvody.push('Neodeslané potvrzení');
  }

  // Nástupní list se posílá až těsně před turnusem — u termínu za půl roku
  // by jeho absence byla falešný poplach.
  if (!r.nastupni_sent_at && r.term_start) {
    const hranice = new Date(dnesRef);
    hranice.setDate(hranice.getDate() + NASTUPNI_PREDSTIH);
    const zacatek = r.term_start.slice(0, 10);
    if (zacatek <= toDateKey(hranice) && zacatek >= toDateKey(dnesRef)) {
      duvody.push('Chybí nástupní list');
    }
  }

  return duvody;
}

export function vyzadujePozornost(r: Registration, dnesRef: Date = new Date()): boolean {
  return duvodyPozornosti(r, dnesRef).length > 0;
}
