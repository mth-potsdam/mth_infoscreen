import { useEffect, useRef, useState } from 'react';
import { useEvents } from '../api/queries';
import EventDetailView from './EventDetailView';
import EventRow from './EventRow';
import StaleBadge from './StaleBadge';
import { useAutoScroll } from './useAutoScroll';

const DEFAULT_OVERVIEW_SECONDS = 60;
const DEFAULT_DETAIL_SECONDS = 15;

export default function EventsPanel() {
  const { data, isLoading, isError, error } = useEvents();
  const bodyRef = useRef<HTMLDivElement>(null);
  useAutoScroll(bodyRef, data?.events.length);

  const detailEvents = data?.events.filter((event) => event.showDetails) ?? [];
  const overviewSeconds = data?.overviewDurationSeconds ?? DEFAULT_OVERVIEW_SECONDS;
  const detailSeconds = data?.detailDurationSeconds ?? DEFAULT_DETAIL_SECONDS;
  // +1 for the overview page itself, at index 0.
  const totalPages = 1 + detailEvents.length;

  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const currentIsOverview = pageIndex % totalPages === 0;
    const duration = currentIsOverview ? overviewSeconds : detailSeconds;
    const timer = setTimeout(() => {
      setPageIndex((i) => (i + 1) % totalPages);
    }, duration * 1000);
    return () => clearTimeout(timer);
  }, [pageIndex, totalPages, overviewSeconds, detailSeconds]);

  const safeIndex = pageIndex % totalPages;
  const isOverview = safeIndex === 0;
  const currentDetailEvent = isOverview ? null : detailEvents[safeIndex - 1];

  return (
    <section className="panel panel--events">
      <header className="panel__header">
        <h2>Veranstaltungen</h2>
        {data && <StaleBadge dataAsOf={data.dataAsOf} stale={data.stale} />}
      </header>
      {isOverview || !currentDetailEvent ? (
        <div className="panel__body" ref={bodyRef}>
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
      ) : (
        <EventDetailView
          event={currentDetailEvent}
          position={`${safeIndex} von ${detailEvents.length}`}
        />
      )}
    </section>
  );
}
