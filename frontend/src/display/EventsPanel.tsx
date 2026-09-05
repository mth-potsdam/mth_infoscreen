import { useEvents } from '../api/queries';
import EventRow from './EventRow';
import StaleBadge from './StaleBadge';

export default function EventsPanel() {
  const { data } = useEvents();

  return (
    <section className="panel panel--events">
      <header className="panel__header">
        <h2>Upcoming Events</h2>
        {data && <StaleBadge dataAsOf={data.dataAsOf} stale={data.stale} />}
      </header>
      <div className="panel__body">
        {!data && <p className="panel__empty">Loading events…</p>}
        {data && data.events.length === 0 && <p className="panel__empty">No upcoming events</p>}
        {data?.events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
