
// Get today's date in UTC timezone in YYYY-MM-DD format
export function getTodayInIsrael(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Check if a date string is today in UTC timezone
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

// Get UTC date from any date
export function toIsraelDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
