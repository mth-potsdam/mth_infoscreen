import type { CalendarEvent } from '../../../shared/types';
import { formatDateTime, isHappeningToday } from './eventFormatting';

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
