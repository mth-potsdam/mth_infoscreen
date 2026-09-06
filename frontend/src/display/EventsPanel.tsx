import { useEvents } from '../api/queries';
import EventRow from './EventRow';
import StaleBadge from './StaleBadge';

export default function EventsPanel() {
  const { data, isLoading, isError, error } = useEvents();

  return (
    <section className="panel panel--events">
      <header className="panel__header">
        <h2>Veranstaltungen</h2>
        {data && <StaleBadge dataAsOf={data.dataAsOf} stale={data.stale} />}
      </header>
      <div className="panel__body">
        {isLoading && <p className="panel__empty">Veranstaltungen werden geladen…</p>}
        {!data && !isLoading && isError && (
          <p className="panel__empty">
            Veranstaltungen konnten nicht geladen werden: {(error as Error)?.message}
          </p>
        )}
        {data && data.events.length === 0 && (
          <p className="panel__empty">Keine bevorstehenden Veranstaltungen</p>
        )}
        {data?.events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
