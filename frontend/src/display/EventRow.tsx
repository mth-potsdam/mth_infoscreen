import type { CalendarEvent } from '../../../shared/types';

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE', {
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
