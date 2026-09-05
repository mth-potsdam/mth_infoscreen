import { useDepartures } from '../api/queries';
import DepartureRow from './DepartureRow';
import StaleBadge from './StaleBadge';

export default function DeparturesPanel() {
  const { data } = useDepartures();

  return (
    <section className="panel panel--departures">
      <header className="panel__header">
        <h2>Departures</h2>
        {data && <StaleBadge dataAsOf={data.dataAsOf} stale={data.stale} />}
      </header>
      <div className="panel__body">
        {!data && <p className="panel__empty">Loading departures…</p>}
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
