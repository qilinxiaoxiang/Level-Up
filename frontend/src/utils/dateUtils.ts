/**
 * Gets the current date in local timezone as YYYY-MM-DD string
 * Use this instead of new Date().toISOString().slice(0, 10) to avoid UTC timezone issues
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the start of the current week (Monday) in local timezone as YYYY-MM-DD string
 */
export function getLocalWeekStart(date: Date = new Date()): string {
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return getLocalDateString(monday);
}
