/**
 * Recognising the same child across sources (KV registrations, DDM xlsx rosters,
 * manual entry). Pure functions with no dependencies so the rules stay testable
 * and live in exactly one place — the database stores the result, it does not
 * compute it.
 */

/**
 * Lowercases, drops diacritics and collapses whitespace, then sorts the name
 * parts. Sorting is what makes "Jan Novák" and "Novák Jan" the same key: DDM
 * rosters are commonly exported surname-first while parents type name-first.
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

/**
 * Identity key stored in children.match_key and enforced by a unique index.
 * Birthdate is part of the key, so two children who share a name stay separate
 * as long as we know when they were born. Without a birthdate the key falls back
 * to the name alone — the import surfaces those matches as uncertain.
 */
export function buildMatchKey(fullName: string, birthdate: string | null): string {
  return `${normalizeName(fullName)}|${birthdate ?? ''}`;
}

/** True when a match was made on name alone, which the UI should flag. */
export function isUncertainMatch(birthdate: string | null): boolean {
  return !birthdate;
}

export function computeAge(birthdate: string | null, at: Date = new Date()): number | null {
  if (!birthdate) return null;

  const born = new Date(birthdate);
  if (Number.isNaN(born.getTime())) return null;

  let age = at.getFullYear() - born.getFullYear();
  const monthDiff = at.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < born.getDate())) age -= 1;

  return age >= 0 ? age : null;
}

/** Czech needs three plural forms: 1 rok, 2-4 roky, 5+ let. */
export function formatAge(birthdate: string | null, at: Date = new Date()): string {
  const age = computeAge(birthdate, at);
  if (age === null) return '—';
  if (age === 1) return '1 rok';
  if (age >= 2 && age <= 4) return `${age} roky`;
  return `${age} let`;
}
