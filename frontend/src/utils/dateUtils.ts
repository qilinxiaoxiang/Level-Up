const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_DAY_CUT_MINUTES = 0;
const DEFAULT_TIMEZONE_NAME = 'Asia/Shanghai';

let dayCutOffsetMinutes = DEFAULT_DAY_CUT_MINUTES;
let timezoneName = DEFAULT_TIMEZONE_NAME;

function clampDayCutMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_DAY_CUT_MINUTES;
  const normalized = Math.max(0, Math.min(minutes, MINUTES_PER_DAY - 1));
  return Math.floor(normalized);
}

export function parseDailyResetTimeToMinutes(time?: string | null): number {
  if (!time) return DEFAULT_DAY_CUT_MINUTES;
  const parts = time.split(':').map((value) => Number(value));
  const [hours, minutes] = parts;
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return DEFAULT_DAY_CUT_MINUTES;
  }
  return clampDayCutMinutes(hours * 60 + minutes);
}

export function setDayCutOffsetMinutes(minutes: number): void {
  dayCutOffsetMinutes = clampDayCutMinutes(minutes);
}

export function setTimezoneName(name: string): void {
  timezoneName = name || DEFAULT_TIMEZONE_NAME;
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value;
    }
  });
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  );
  return (asUtc - date.getTime()) / 60000;
}

function getTimeZoneDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value;
    }
  });
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

function getUtcTimestampFromTimeZoneParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): number {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let offset = getTimeZoneOffsetMinutes(new Date(utcGuess), timeZone);
  let utcTime = utcGuess - offset * 60 * 1000;
  const offsetCheck = getTimeZoneOffsetMinutes(new Date(utcTime), timeZone);
  if (offsetCheck !== offset) {
    offset = offsetCheck;
    utcTime = utcGuess - offset * 60 * 1000;
  }
  return utcTime;
}

function getShiftedDate(date: Date, cutMinutes = dayCutOffsetMinutes): Date {
  return new Date(date.getTime() - cutMinutes * 60 * 1000);
}

/**
 * Gets the current date in GMT+8 as YYYY-MM-DD string
 * Use this instead of new Date().toISOString().slice(0, 10) to avoid UTC timezone issues
 */
export function getLocalDateString(date: Date = new Date()): string {
  const shifted = getShiftedDate(date);
  const parts = getTimeZoneDateParts(shifted, timezoneName);
  const year = parts.year;
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalDayIndex(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function getLocalDayIndexFromString(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return Number.NaN;
  return Date.UTC(year, month - 1, day);
}

export function getLocalDayDiff(fromDateString: string, toDateString: string): number {
  const fromIndex = getLocalDayIndexFromString(fromDateString);
  const toIndex = getLocalDayIndexFromString(toDateString);
  if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return 0;
  return Math.floor((toIndex - fromIndex) / (24 * 60 * 60 * 1000));
}

/**
 * Gets the start of the current week (Monday) in GMT+8 as YYYY-MM-DD string
 */
export function getLocalWeekStart(date: Date = new Date()): string {
  const dateString = getLocalDateString(date);
  const [year, month, day] = dateString.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const baseUtc = Date.UTC(year, month - 1, day);
  const monday = new Date(baseUtc + diff * DAY_MS);
  const mondayYear = monday.getUTCFullYear();
  const mondayMonth = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const mondayDay = String(monday.getUTCDate()).padStart(2, '0');
  return `${mondayYear}-${mondayMonth}-${mondayDay}`;
}

/**
 * Gets the start of day (00:00:00) in GMT+8 as UTC ISO string
 * Use for database queries that need to filter by date range
 */
export function getStartOfDayUTC(date: Date = new Date()): string {
  return getStartOfDayUTCFromDateString(getLocalDateString(date));
}

/**
 * Gets the end of day (23:59:59.999) in GMT+8 as UTC ISO string
 * Use for database queries that need to filter by date range
 */
export function getEndOfDayUTC(date: Date = new Date()): string {
  return getEndOfDayUTCFromDateString(getLocalDateString(date));
}

export function getStartOfDayUTCFromDateString(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return getStartOfDayUTC();
  const hour = Math.floor(dayCutOffsetMinutes / 60);
  const minute = dayCutOffsetMinutes % 60;
  const utcTime = getUtcTimestampFromTimeZoneParts(
    year,
    month,
    day,
    hour,
    minute,
    0,
    timezoneName
  );
  return new Date(utcTime).toISOString();
}

export function getEndOfDayUTCFromDateString(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return getEndOfDayUTC();
  const nextUtc = getUtcTimestampFromTimeZoneParts(
    year,
    month,
    day + 1,
    Math.floor(dayCutOffsetMinutes / 60),
    dayCutOffsetMinutes % 60,
    0,
    timezoneName
  );
  return new Date(nextUtc - 1).toISOString();
}
