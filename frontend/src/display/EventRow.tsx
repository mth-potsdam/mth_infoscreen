import type { CalendarEvent } from '../../../shared/types';

const TIME_ZONE = 'Europe/Berlin';

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  // Always render in the facility's own timezone, not the viewing device's
  // (a kiosk screen's system clock/timezone can be misconfigured or just
  // different from where it physically sits).
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
function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

function isHappeningToday(event: CalendarEvent): boolean {
  if (!event.start) return false;
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
  const startKey = dateKey(event.start);
  const endKey = event.end ? dateKey(event.end) : startKey;
  return startKey <= todayKey && todayKey <= endKey;
}

export default function EventRow({ event }: { event: CalendarEvent }) {
  const today = isHappeningToday(event);
  return (
    <div className={`event-row ${today ? 'event-row--today' : ''}`}>
      <div className="event-row__time">{formatDateTime(event.start)}</div>
      <div className="event-row__body">
        <div className="event-row__title">{event.title}</div>
        {event.location && <div className="event-row__location">{event.location}</div>}
      </div>
    </div>
  );
}
