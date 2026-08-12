import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, subWeeks, isSameDay, isSameMonth, isWithinInterval, parseISO, addDays } from 'date-fns';
import { cs } from 'date-fns/locale';

const locale = cs;

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd. MMMM yyyy', { locale });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd. MMM', { locale });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd. MMMM yyyy, HH:mm', { locale });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Dnes';
  if (isTomorrow(d)) return 'Zítra';
  if (isYesterday(d)) return 'Včera';
  return formatDistanceToNow(d, { addSuffix: true, locale });
}

export function formatMonthYear(date: Date): string {
  return format(date, 'LLLL yyyy', { locale });
}

export function getDaysInMonthGrid(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export const WEEKDAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

export function isDueThisWeek(dueDate: string): boolean {
  const d = parseISO(dueDate);
  const now = new Date();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  return isWithinInterval(d, { start: now, end: weekEnd });
}

export function getUpcomingDays(days: number): { start: Date; end: Date } {
  const now = new Date();
  return { start: now, end: addDays(now, days) };
}

/**
 * YYYY-MM-DD podle lokálního času.
 *
 * Schválně ne toISOString(): mřížka dnů se staví z lokálních půlnocí a při
 * kladném posunu vůči UTC (v Praze vždy) by se ISO řetězec překlopil na
 * předchozí den — kliknutí na 15. by založilo událost na 14.
 */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export { addMonths, subMonths, addWeeks, subWeeks, isSameDay, isSameMonth, isToday, parseISO, format, isWithinInterval, startOfMonth, endOfMonth, addDays };

/**
 * Rozsah týdne pro hlavičku, např. "10. – 16. srpna 2026".
 * Týdenní pohled dosud zobrazoval jen název měsíce, což u týdne přes
 * přelom měsíce vůbec neodpovídalo tomu, co bylo v mřížce.
 */
export function formatWeekRange(date: Date): string {
  const zacatek = startOfWeek(date, { weekStartsOn: 1 });
  const konec = endOfWeek(date, { weekStartsOn: 1 });
  const stejnyMesic = zacatek.getMonth() === konec.getMonth() && zacatek.getFullYear() === konec.getFullYear();
  return stejnyMesic
    ? `${format(zacatek, 'd.', { locale })} – ${format(konec, 'd. MMMM yyyy', { locale })}`
    : `${format(zacatek, 'd. MMM', { locale })} – ${format(konec, 'd. MMM yyyy', { locale })}`;
}
