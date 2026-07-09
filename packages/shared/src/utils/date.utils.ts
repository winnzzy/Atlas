/**
 * Date utility functions.
 */

/**
 * Format a date to ISO string.
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Get current timestamp as ISO string.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Check if a date string is valid.
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

/**
 * Format a date to a human-readable string.
 */
export function formatDate(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format a date to a short string.
 */
export function formatDateShort(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
