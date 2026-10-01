/**
 * Study date keys are calendar days in the Brazilian (Brasília/São Paulo)
 * timezone, independent of the timezone configured on the device running the app.
 * Stored keys remain YYYY-MM-DD for compatibility with existing records.
 */
const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

const brazilDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BRAZIL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatUtcDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Get today's calendar key in Brazil, regardless of the device timezone. */
export const formatLocalDate = (date: Date = new Date()): string => {
  const parts: Record<string, string> = {};
  for (const part of brazilDateFormatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
};

/** Preserve the calendar components selected by a local date-picker control. */
export const formatCalendarDateFromParts = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Parse a YYYY-MM-DD calendar key into a timezone-neutral UTC date. */
export const parseLocalDate = (dateKey: string): Date => {
  const [year, month, day] = dateKey.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
};

/** Display a date-only key in Brazilian format without converting its day. */
export const formatDateOnlyBR = (
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {},
): string => new Intl.DateTimeFormat('pt-BR', {
  ...options,
  timeZone: 'UTC',
}).format(parseLocalDate(dateKey));

/** Parse a Brazilian DD/MM/YYYY entry into the app's YYYY-MM-DD date key. */
export const parseBrazilianDate = (value: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, day, month, year] = match;
  const dateKey = `${year}-${month}-${day}`;
  return formatUtcDateKey(parseLocalDate(dateKey)) === dateKey ? dateKey : null;
};

/** Return an integer day number so date-only differences are unaffected by DST. */
export const calendarDayNumber = (dateKey: string): number => {
  const [year, month, day] = dateKey.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
};

/** Add whole calendar days to a YYYY-MM-DD value without machine-zone arithmetic. */
export const addDaysToDateOnly = (dateKey: string, days: number): string => {
  const date = parseLocalDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDateKey(date);
};
