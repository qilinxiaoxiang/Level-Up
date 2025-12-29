const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_DAY_CUT_MINUTES = 0;
const DEFAULT_TIMEZONE_OFFSET_MINUTES = 8 * 60;

let dayCutOffsetMinutes = DEFAULT_DAY_CUT_MINUTES;
let timezoneOffsetMinutes = DEFAULT_TIMEZONE_OFFSET_MINUTES;

function clampDayCutMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_DAY_CUT_MINUTES;
  const normalized = Math.max(0, Math.min(minutes, MINUTES_PER_DAY - 1));
  return Math.floor(normalized);
}

function clampTimezoneOffsetMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_TIMEZONE_OFFSET_MINUTES;
  const normalized = Math.max(-12 * 60, Math.min(minutes, 14 * 60));
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

export function setTimezoneOffsetMinutes(minutes: number): void {
  timezoneOffsetMinutes = clampTimezoneOffsetMinutes(minutes);
}

function getShiftedDate(date: Date, cutMinutes = dayCutOffsetMinutes): Date {
  return new Date(date.getTime() + timezoneOffsetMinutes * 60 * 1000 - cutMinutes * 60 * 1000);
}

/**
 * Gets the current date in GMT+8 as YYYY-MM-DD string
 * Use this instead of new Date().toISOString().slice(0, 10) to avoid UTC timezone issues
 */
export function getLocalDateString(date: Date = new Date()): string {
  const shifted = getShiftedDate(date);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
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
  const shifted = getShiftedDate(date);
  const dayOfWeek = shifted.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(shifted.getTime() + diff * DAY_MS);
  const year = monday.getUTCFullYear();
  const month = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(monday.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the start of day (00:00:00) in GMT+8 as UTC ISO string
 * Use for database queries that need to filter by date range
 */
export function getStartOfDayUTC(date: Date = new Date()): string {
  const shifted = getShiftedDate(date);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const utcMidnight =
    Date.UTC(year, month, day) - timezoneOffsetMinutes * 60 * 1000 + dayCutOffsetMinutes * 60 * 1000;
  return new Date(utcMidnight).toISOString();
}

/**
 * Gets the end of day (23:59:59.999) in GMT+8 as UTC ISO string
 * Use for database queries that need to filter by date range
 */
export function getEndOfDayUTC(date: Date = new Date()): string {
  const shifted = getShiftedDate(date);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const utcEnd =
    Date.UTC(year, month, day + 1) - timezoneOffsetMinutes * 60 * 1000 + dayCutOffsetMinutes * 60 * 1000 - 1;
  return new Date(utcEnd).toISOString();
}

export function getStartOfDayUTCFromDateString(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return getStartOfDayUTC();
  const utcMidnight =
    Date.UTC(year, month - 1, day) - timezoneOffsetMinutes * 60 * 1000 + dayCutOffsetMinutes * 60 * 1000;
  return new Date(utcMidnight).toISOString();
}

export function getEndOfDayUTCFromDateString(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return getEndOfDayUTC();
  const utcEnd =
    Date.UTC(year, month - 1, day + 1) -
    timezoneOffsetMinutes * 60 * 1000 +
    dayCutOffsetMinutes * 60 * 1000 -
    1;
  return new Date(utcEnd).toISOString();
}
