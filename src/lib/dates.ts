const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parses an Airtable "YYYY-MM-DD" date string as a local calendar date (midnight
 * local time). `new Date("YYYY-MM-DD")` parses as UTC per spec, which renders one day
 * early in any timezone behind UTC — this avoids that.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** The day after the given date, at local midnight. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}
