import { useRef } from 'react';
import { useDepartures } from '../api/queries';
import DepartureRow from './DepartureRow';
import StaleBadge from './StaleBadge';
import { useAutoScroll } from './useAutoScroll';

export default function DeparturesPanel() {
  const { data, isLoading, isError, error } = useDepartures();
  const bodyRef = useRef<HTMLDivElement>(null);
  useAutoScroll(bodyRef, data?.departures.length);

  return (
    <section className="panel panel--departures">
      <header className="panel__header">
        <h2>Abfahrten</h2>
        {data && <StaleBadge dataAsOf={data.dataAsOf} stale={data.stale} />}
      </header>
      <div className="panel__body" ref={bodyRef}>
        {isLoading && <p className="panel__empty">Abfahrten werden geladen…</p>}
        {!data && !isLoading && isError && (
          <p className="panel__empty">
            Abfahrten konnten nicht geladen werden: {(error as Error)?.message}
          </p>
        )}
        {data && data.departures.length === 0 && (
          <p className="panel__empty">Keine bevorstehenden Abfahrten</p>
        )}
        {data?.departures.map((departure, index) => (
          <DepartureRow
            key={`${departure.stopId}-${departure.line}-${departure.when}-${index}`}
            departure={departure}
          />
        ))}
      </div>
      <p className="panel__attribution">
        Fahrplandaten:{' '}
        <a href="https://transitous.org/sources/" target="_blank" rel="noreferrer">
          transitous.org
        </a>
        , ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap-Mitwirkende
        </a>
      </p>
    </section>
  );
}
