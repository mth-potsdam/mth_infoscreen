import { useMemo, useRef } from 'react';
import type { Departure } from '../../../shared/types';
import { useDepartures } from '../api/queries';
import DepartureRow from './DepartureRow';
import StaleBadge from './StaleBadge';
import { useAutoScroll } from './useAutoScroll';

function groupByStation(departures: Departure[]): { stopName: string; departures: Departure[] }[] {
  const groups: { stopName: string; departures: Departure[] }[] = [];
  const groupByName = new Map<string, Departure[]>();

  for (const departure of departures) {
    let group = groupByName.get(departure.stopName);
    if (!group) {
      group = [];
      groupByName.set(departure.stopName, group);
      groups.push({ stopName: departure.stopName, departures: group });
    }
    group.push(departure);
  }

  return groups;
}

export default function DeparturesPanel() {
  const { data, isLoading, isError, error } = useDepartures();
  const bodyRef = useRef<HTMLDivElement>(null);
  useAutoScroll(bodyRef, data?.departures.length);
  const groups = useMemo(
    () => (data ? groupByStation(data.departures) : []),
    [data]
  );

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
        {groups.map((group) => (
          <div key={group.stopName} className="departure-group">
            <h3 className="departure-group__header">{group.stopName}</h3>
            {group.departures.map((departure, index) => (
              <DepartureRow
                key={`${departure.stopId}-${departure.line}-${departure.when}-${index}`}
                departure={departure}
              />
            ))}
          </div>
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
