import { useMemo } from 'react';
import { useEvents } from '../api/queries';
import EventOverviewCard from './EventOverviewCard';
import './eventOverviewPage.css';
import { monthKey, monthLabel } from './eventFormatting';

interface MonthGroup {
  key: string;
  label: string;
  events: NonNullable<ReturnType<typeof useEvents>['data']>['events'];
}

function groupByMonth(
  events: NonNullable<ReturnType<typeof useEvents>['data']>['events']
): MonthGroup[] {
  const currentMonthKey = monthKey(new Date().toISOString());
  const groups = new Map<string, MonthGroup>();

  for (const event of events) {
    if (!event.start) continue;
    const key = monthKey(event.start);
    // Belt-and-braces: the backend already excludes events whose effective
    // end has passed, but explicitly dropping anything keyed to an earlier
    // month here guarantees past months never render, regardless of
    // individual-event edge cases.
    if (key < currentMonthKey) continue;
    let group = groups.get(key);
    if (!group) {
      group = { key, label: monthLabel(event.start), events: [] };
      groups.set(key, group);
    }
    group.events.push(event);
  }

  return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export default function EventOverviewPage() {
  const { data, isLoading, isError, error } = useEvents();
  const groups = useMemo(() => groupByMonth(data?.events ?? []), [data]);

  return (
    <div className="event-overview-page">
      <h1 className="event-overview-page__title">Veranstaltungsübersicht</h1>

      {isLoading && <p className="event-overview-page__empty">Veranstaltungen werden geladen…</p>}
      {!data && !isLoading && isError && (
        <p className="event-overview-page__empty">
          Veranstaltungen konnten nicht geladen werden: {(error as Error)?.message}
        </p>
      )}
      {data && groups.length === 0 && (
        <p className="event-overview-page__empty">Keine bevorstehenden Veranstaltungen</p>
      )}

      <div className="event-overview-months">
        {groups.map((group) => (
          <section key={group.key} className="event-overview-month">
            <h2 className="event-overview-month__label">{group.label}</h2>
            <div className="event-overview-month__boxes">
              {group.events.map((event, index) => (
                <EventOverviewCard key={event.id} event={event} alternate={index % 2 === 1} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
