import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { IMPORT_FIELDS } from '@/lib/children/importFormat';

export const dynamic = 'force-dynamic';

/** Empty roster template with the headers the importer recognises. */
export async function GET() {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Účastníci');

  sheet.columns = IMPORT_FIELDS.map((field) => ({
    header: field.required ? `${field.label} *` : field.label,
    key: field.field,
    width: Math.max(16, field.label.length + 4),
  }));

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF0FF' } };

  // One filled row so the expected date format is obvious.
  sheet.addRow({
    fullName: 'Jan Novák',
    birthdate: '12. 5. 2014',
    campLabel: 'Tábor chytrých technologií',
    visitDate: '28. 3. 2026',
    location: 'Praha',
    parentName: 'Petra Nováková',
    parentEmail: 'petra@example.cz',
    parentPhone: '+420 700 000 000',
    insurance: 'VZP',
    notes: 'Ukázkový řádek — smažte před importem',
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="weeks-import-deti.xlsx"',
    },
  });
}
