import type { CalendarEvent } from '../../../shared/types';

export const TIME_ZONE = 'Europe/Berlin';

// Always render in the facility's own timezone, not the viewing device's
// (a kiosk screen's system clock/timezone can be misconfigured or just
// different from where it physically sits).
export function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calendar-date key (YYYY-MM-DD) in the facility's timezone, so this
// compares actual days rather than exact 24h-from-now windows.
export function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

export function isHappeningToday(event: CalendarEvent): boolean {
  if (!event.start) return false;
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
  const startKey = dateKey(event.start);
  const endKey = event.end ? dateKey(event.end) : startKey;
  return startKey <= todayKey && todayKey <= endKey;
}

// "YYYY-MM" in the facility's timezone, for grouping events by month.
export function monthKey(iso: string): string {
  return dateKey(iso).slice(0, 7);
}

export function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    timeZone: TIME_ZONE,
    month: 'long',
    year: 'numeric',
  });
}
