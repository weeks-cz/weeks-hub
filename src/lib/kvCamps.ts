// Statická KV nabídka pro display labels + kapacitu (registrations ukládá jen ids).
// Zrcadlí KV config z weeks_web (src/lib/locations.ts). KV nabídka je malá a stabilní.

export interface KvProgramInfo {
  name: string;
  capacity: number;
  price: number;
}

export const KV_PROGRAMS: Record<string, KvProgramInfo> = {
  'letni-primestsky': { name: 'Letní příměstský tábor', capacity: 15, price: 4990 },
  'mix': { name: 'Víkendový tábor chytrých technologií', capacity: 15, price: 2990 },
  // Od léta 2027 web zapisuje do `program` id tábora (turnus.taborIds[0] ve weeks_web).
  'chytre-technologie': { name: 'Tábor chytrých technologií', capacity: 15, price: 5990 },
};

export const KV_LOCATIONS: Record<string, string> = {
  'karlovy-vary': 'Karlovy Vary',
};

export interface KvTurnus {
  termId: string;
  program: string;
  locationId: string;
  start: string;
  end: string;
}

/**
 * Turnusy, které jsou na weeks.cz v prodeji — Registrace je ukáže i bez
 * jediné přihlášky. Skupiny se jinak skládají jen z registrací, takže
 * otevřený turnus bez přihlášek v hubu nebyl vůbec vidět.
 * Zrcadlí `TURNUSY` ve weeks_web (src/lib/turnusy.ts), stav `otevreno`.
 */
export const KV_TURNUSY: KvTurnus[] = [
  { termId: 'kv-2027-cervenec', program: 'chytre-technologie', locationId: 'karlovy-vary', start: '2027-07-26', end: '2027-07-30' },
  { termId: 'kv-2027-srpen', program: 'chytre-technologie', locationId: 'karlovy-vary', start: '2027-08-02', end: '2027-08-06' },
];

export function programName(id: string): string {
  return KV_PROGRAMS[id]?.name ?? id;
}

export function programCapacity(id: string): number {
  return KV_PROGRAMS[id]?.capacity ?? 0;
}

export function locationName(id: string): string {
  return KV_LOCATIONS[id] ?? id;
}

/** Věk v letech k referenčnímu datu (default dnes). */
export function ageFromBirthdate(birthdateIso: string, ref: Date = new Date()): number {
  const b = new Date(birthdateIso);
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--;
  return age;
}

/** Lidský label termínu, např. "1.–2. 8. 2026". */
export function termLabel(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const d = (x: Date) => `${x.getDate()}. ${x.getMonth() + 1}.`;
  if (startIso === endIso) return `${d(s)} ${s.getFullYear()}`;
  return `${s.getDate()}.–${d(e)} ${e.getFullYear()}`;
}
