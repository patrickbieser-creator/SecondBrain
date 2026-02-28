const TIMEZONE = "America/Chicago";

/** Returns local date string YYYY-MM-DD in America/Chicago */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Days elapsed since the given date (fractional, floored) */
export function daysSince(date: Date): number {
  const now = Date.now();
  const ms = now - date.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

/** Days until the given date (negative if in the past) */
export function daysUntil(date: Date): number {
  const now = Date.now();
  const ms = date.getTime() - now;
  return ms / (1000 * 60 * 60 * 24);
}
