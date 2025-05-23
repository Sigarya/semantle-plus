
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

// Get today's date in Israel timezone in YYYY-MM-DD format
export function getTodayInIsrael(): string {
  const now = new Date();
  const israelDate = toZonedTime(now, ISRAEL_TIMEZONE);
  return formatInTimeZone(israelDate, ISRAEL_TIMEZONE, 'yyyy-MM-dd');
}

// Check if a date string is today in Israel timezone
export function isToday(dateString: string): boolean {
  return dateString === getTodayInIsrael();
}

// Format date for display in Hebrew
export function formatHebrewDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00'); // Add time to avoid timezone issues
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Get Israel timezone date from any date
export function toIsraelDate(date: Date): string {
  return formatInTimeZone(date, ISRAEL_TIMEZONE, 'yyyy-MM-dd');
}
