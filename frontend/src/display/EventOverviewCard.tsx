import type { CalendarEvent } from '../../../shared/types';
import { formatDateTime, isHappeningToday } from './eventFormatting';

interface EventOverviewCardProps {
  event: CalendarEvent;
  alternate: boolean;
}

export default function EventOverviewCard({ event, alternate }: EventOverviewCardProps) {
  const today = isHappeningToday(event);
  const classes = [
    'event-overview-card',
    alternate ? 'event-overview-card--alt' : '',
    today ? 'event-overview-card--today' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="event-overview-card__time">{formatDateTime(event.start)}</div>
      <div className="event-overview-card__title">{event.title}</div>
      {event.location && <div className="event-overview-card__location">{event.location}</div>}
    </div>
  );
}
