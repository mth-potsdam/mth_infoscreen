import type { CalendarEvent } from '../../../shared/types';

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  // Always render in the facility's own timezone, not the viewing device's
  // (a kiosk screen's system clock/timezone can be misconfigured or just
  // different from where it physically sits).
  return new Date(iso).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="event-row">
      <div className="event-row__time">{formatDateTime(event.start)}</div>
      <div className="event-row__body">
        <div className="event-row__title">{event.title}</div>
        {event.location && <div className="event-row__location">{event.location}</div>}
      </div>
    </div>
  );
}
