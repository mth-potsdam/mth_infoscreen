import { useDepartures } from '../api/queries';
import DepartureRow from './DepartureRow';
import StaleBadge from './StaleBadge';

export default function DeparturesPanel() {
  const { data, isLoading, isError, error } = useDepartures();

  return (
    <section className="panel panel--departures">
      <header className="panel__header">
        <h2>Departures</h2>
        {data && <StaleBadge dataAsOf={data.dataAsOf} stale={data.stale} />}
      </header>
      <div className="panel__body">
        {isLoading && <p className="panel__empty">Loading departures…</p>}
        {!data && !isLoading && isError && (
          <p className="panel__empty">Unable to load departures: {(error as Error)?.message}</p>
        )}
        {data && data.departures.length === 0 && (
          <p className="panel__empty">No upcoming departures</p>
        )}
        {data?.departures.map((departure, index) => (
          <DepartureRow
            key={`${departure.stopId}-${departure.line}-${departure.when}-${index}`}
            departure={departure}
          />
        ))}
      </div>
    </section>
  );
}
