import type { CalendarEvent } from '../../../shared/types';

const TIME_ZONE = 'Europe/Berlin';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameDay(a: string, b: string): boolean {
  const dayFormat: Intl.DateTimeFormatOptions = { timeZone: TIME_ZONE };
  return (
    new Date(a).toLocaleDateString('de-DE', dayFormat) ===
    new Date(b).toLocaleDateString('de-DE', dayFormat)
  );
}

function formatDateRange(event: CalendarEvent): string {
  if (event.start && event.end) {
    return isSameDay(event.start, event.end)
      ? `${formatDateTime(event.start)} – ${formatTimeOnly(event.end)} Uhr`
      : `${formatDateTime(event.start)} – ${formatDateTime(event.end)} Uhr`;
  }
  if (event.start) {
    return `${formatDateTime(event.start)} Uhr`;
  }
  return '';
}

interface EventDetailViewProps {
  event: CalendarEvent;
  position: string;
}

export default function EventDetailView({ event, position }: EventDetailViewProps) {
  const dateRange = formatDateRange(event);

  return (
    <div className="event-detail">
      <div className="event-detail__position">{position}</div>
      <h3 className="event-detail__title">{event.title}</h3>
      {dateRange && <p className="event-detail__date">{dateRange}</p>}
      {event.location && <p className="event-detail__location">{event.location}</p>}
      {event.description && <p className="event-detail__description">{event.description}</p>}
    </div>
  );
}
