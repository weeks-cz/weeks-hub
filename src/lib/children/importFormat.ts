/**
 * Parsing an uploaded roster into visit rows. Pure — it takes plain cell values,
 * not a workbook — so the format rules can be exercised without exceljs.
 *
 * One row = one attendance, not one child. DDM hands out a roster per turnus,
 * so importing roster after roster is what builds up a child's visit history.
 */

import { buildMatchKey } from './matching';

export type ImportField =
  | 'fullName'
  | 'birthdate'
  | 'campLabel'
  | 'visitDate'
  | 'location'
  | 'parentName'
  | 'parentEmail'
  | 'parentPhone'
  | 'insurance'
  | 'notes';

interface FieldSpec {
  field: ImportField;
  label: string;
  required: boolean;
  /** Normalised header spellings we accept. */
  aliases: string[];
}

export const IMPORT_FIELDS: FieldSpec[] = [
  { field: 'fullName', label: 'Jméno a příjmení', required: true, aliases: ['jmeno a prijmeni', 'jmeno prijmeni', 'prijmeni a jmeno', 'jmeno ditete', 'dite', 'ucastnik', 'jmeno', 'cele jmeno'] },
  { field: 'birthdate', label: 'Datum narození', required: false, aliases: ['datum narozeni', 'narozeni', 'datum nar', 'nar', 'rok narozeni'] },
  { field: 'campLabel', label: 'Tábor', required: true, aliases: ['tabor', 'nazev taboru', 'nazev tabora', 'akce', 'turnus', 'kemp', 'krouzek'] },
  { field: 'visitDate', label: 'Datum tábora', required: false, aliases: ['datum taboru', 'datum tabora', 'termin', 'datum', 'od'] },
  { field: 'location', label: 'Místo', required: false, aliases: ['misto', 'lokalita', 'mesto', 'pobocka'] },
  { field: 'parentName', label: 'Rodič', required: false, aliases: ['rodic', 'jmeno rodice', 'zakonny zastupce', 'zastupce'] },
  { field: 'parentEmail', label: 'E-mail', required: false, aliases: ['e mail', 'email', 'mail', 'e mail rodice', 'email rodice'] },
  { field: 'parentPhone', label: 'Telefon', required: false, aliases: ['telefon', 'tel', 'mobil', 'telefon rodice'] },
  { field: 'insurance', label: 'Pojišťovna', required: false, aliases: ['pojistovna', 'zdravotni pojistovna', 'zp'] },
  { field: 'notes', label: 'Poznámka', required: false, aliases: ['poznamka', 'poznamky', 'note'] },
];

/** Header matching ignores diacritics, case, punctuation and extra spaces. */
export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface ParsedImportRow {
  /** 1-based row number in the sheet, so errors point at something the user can find. */
  rowNumber: number;
  fullName: string;
  birthdate: string | null;
  campLabel: string;
  visitDate: string | null;
  location: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  insurance: string | null;
  notes: string | null;
  matchKey: string;
  error: string | null;
}

export interface ParsedSheet {
  /** Which sheet column index each recognised field came from. */
  columns: Partial<Record<ImportField, number>>;
  missingRequired: string[];
  rows: ParsedImportRow[];
}

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Accepts what spreadsheets actually produce: a real Date, an Excel serial
 * number, or text in Czech (12. 5. 2014), ISO (2014-05-12) or slashed form.
 */
export function parseDateCell(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // exceljs hands back UTC midnight; reading it back in local time can slip a day.
    return toIsoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    const d = new Date(EXCEL_EPOCH_UTC + Math.round(value) * MS_PER_DAY);
    return toIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  const text = String(value).trim();
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const czech = text.match(/^(\d{1,2})\s*[.\/]\s*(\d{1,2})\s*[.\/]\s*(\d{4})$/);
  if (czech) return toIsoDate(Number(czech[3]), Number(czech[2]), Number(czech[1]));

  return null;
}

function cellText(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  // exceljs returns objects for formulas, rich text and hyperlink cells.
  if (typeof value === 'object') {
    const obj = value as { text?: unknown; result?: unknown; richText?: Array<{ text?: string }> };
    if (Array.isArray(obj.richText)) return cellText(obj.richText.map((r) => r.text ?? '').join(''));
    if (obj.text !== undefined) return cellText(obj.text);
    if (obj.result !== undefined) return cellText(obj.result);
    return null;
  }

  const text = String(value).trim();
  return text === '' ? null : text;
}

export function matchColumns(headerRow: unknown[]): Pick<ParsedSheet, 'columns' | 'missingRequired'> {
  const columns: Partial<Record<ImportField, number>> = {};

  headerRow.forEach((raw, index) => {
    const header = normalizeHeader(cellText(raw) ?? '');
    if (!header) return;

    for (const spec of IMPORT_FIELDS) {
      if (columns[spec.field] !== undefined) continue;
      // Exact alias first, then prefix — "Jméno a příjmení dítěte" should still land.
      if (spec.aliases.includes(header) || spec.aliases.some((a) => header.startsWith(a))) {
        columns[spec.field] = index;
        return;
      }
    }
  });

  const missingRequired = IMPORT_FIELDS
    .filter((spec) => spec.required && columns[spec.field] === undefined)
    .map((spec) => spec.label);

  return { columns, missingRequired };
}

/**
 * @param rows every sheet row including the header, as arrays of raw cell values
 */
export function parseSheet(rows: unknown[][]): ParsedSheet {
  const [headerRow, ...dataRows] = rows;
  const { columns, missingRequired } = matchColumns(headerRow ?? []);

  if (missingRequired.length > 0) return { columns, missingRequired, rows: [] };

  const get = (row: unknown[], field: ImportField): string | null => {
    const index = columns[field];
    return index === undefined ? null : cellText(row[index]);
  };

  const parsed: ParsedImportRow[] = [];

  dataRows.forEach((row, i) => {
    // +2: one for the header, one because sheet rows are 1-based.
    const rowNumber = i + 2;
    const fullName = get(row, 'fullName');
    const campLabel = get(row, 'campLabel');

    // Trailing blank rows are normal in spreadsheets — skip rather than report.
    if (!fullName && !campLabel && row.every((c) => cellText(c) === null)) return;

    const birthdateRaw = columns.birthdate === undefined ? null : row[columns.birthdate];
    const birthdate = parseDateCell(birthdateRaw);
    const visitDateRaw = columns.visitDate === undefined ? null : row[columns.visitDate];

    let error: string | null = null;
    if (!fullName) error = 'Chybí jméno dítěte';
    else if (!campLabel) error = 'Chybí název tábora';
    else if (birthdateRaw != null && cellText(birthdateRaw) !== null && birthdate === null) {
      error = `Nerozpoznané datum narození: ${cellText(birthdateRaw)}`;
    }

    parsed.push({
      rowNumber,
      fullName: fullName ?? '',
      birthdate,
      campLabel: campLabel ?? '',
      visitDate: parseDateCell(visitDateRaw),
      location: get(row, 'location'),
      parentName: get(row, 'parentName'),
      parentEmail: get(row, 'parentEmail'),
      parentPhone: get(row, 'parentPhone'),
      insurance: get(row, 'insurance'),
      notes: get(row, 'notes'),
      matchKey: fullName ? buildMatchKey(fullName, birthdate) : '',
      error,
    });
  });

  return { columns, missingRequired, rows: parsed };
}
