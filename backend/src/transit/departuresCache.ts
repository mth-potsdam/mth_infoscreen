import { Departure, DeparturesResponse } from '../../../shared/types';
import { getConfig } from '../config/configStore';
import { log } from '../lib/log';
import { fetchDepartures } from './transitousClient';

interface StopCacheEntry {
  stopId: string;
  stopName: string;
  departures: Departure[];
  fetchedAt: string;
  stale: boolean;
}

const cache = new Map<string, StopCacheEntry>();

// transitous aggregates multiple overlapping GTFS feeds, so the same
// real-world trip is sometimes published more than once with a slightly
// different scheduled time — showing up as the same line/direction a
// minute or two apart. Collapse those into a single entry.
const DUPLICATE_WINDOW_MS = 3 * 60 * 1000;

const MIN_MINUTES_AHEAD = 10;

// Applied before dedup: if several duplicate-feed entries for the same
// trip straddle the 10-minute cutoff (e.g. one at 9 minutes, another at
// 11), we want the still-valid later one to survive, not have dedup collapse
// them down to the earliest one and then have the filter discard it.
function filterMinMinutesAhead(departures: Departure[]): Departure[] {
  const now = Date.now();
  return departures.filter((d) => {
    if (!d.when) return true;
    const minutesAhead = (new Date(d.when).getTime() - now) / 60_000;
    return minutesAhead >= MIN_MINUTES_AHEAD;
  });
}

function dedupeDepartures(departures: Departure[]): Departure[] {
  const sorted = [...departures].sort((a, b) => (a.when ?? '').localeCompare(b.when ?? ''));
  const lastKeptTime = new Map<string, number>();
  const result: Departure[] = [];

  for (const departure of sorted) {
    const key = `${departure.line}|${departure.direction}`;
    const time = departure.when ? new Date(departure.when).getTime() : null;
    const last = lastKeptTime.get(key);

    if (time !== null && last !== undefined && time - last < DUPLICATE_WINDOW_MS) {
      continue;
    }

    result.push(departure);
    if (time !== null) {
      lastKeptTime.set(key, time);
    }
  }

  return result;
}

export async function refreshDepartures(): Promise<void> {
  const { selectedStops } = getConfig().transit;
  const results = await Promise.allSettled(
    selectedStops.map((stop) => fetchDepartures(stop.id))
  );

  results.forEach((result, index) => {
    const stop = selectedStops[index];
    if (result.status === 'fulfilled') {
      cache.set(stop.id, {
        stopId: stop.id,
        stopName: stop.name,
        departures: result.value.map((d) => ({ ...d, stopId: stop.id, stopName: stop.name })),
        fetchedAt: new Date().toISOString(),
        stale: false,
      });
    } else {
      log.error(`Failed to fetch departures for stop ${stop.name}`, result.reason);
      const existing = cache.get(stop.id);
      cache.set(
        stop.id,
        existing
          ? { ...existing, stale: true }
          : {
              stopId: stop.id,
              stopName: stop.name,
              departures: [],
              fetchedAt: new Date().toISOString(),
              stale: true,
            }
      );
    }
  });

  const selectedIds = new Set(selectedStops.map((s) => s.id));
  for (const key of cache.keys()) {
    if (!selectedIds.has(key)) {
      cache.delete(key);
    }
  }
}

export function getDeparturesResponse(): DeparturesResponse {
  const { selectedStops, refreshIntervalSeconds } = getConfig().transit;
  const entries = selectedStops
    .map((stop) => cache.get(stop.id))
    .filter((e): e is StopCacheEntry => Boolean(e));

  const departures = dedupeDepartures(
    filterMinMinutesAhead(entries.flatMap((entry) => entry.departures))
  );

  const staleStops = entries.filter((e) => e.stale).map((e) => e.stopName);
  const fetchedTimestamps = entries.map((e) => e.fetchedAt).sort();
  const dataAsOf = fetchedTimestamps.length > 0 ? fetchedTimestamps[0] : null;

  return {
    generatedAt: new Date().toISOString(),
    dataAsOf,
    stale: staleStops.length > 0,
    staleStops,
    refreshIntervalSeconds,
    departures,
  };
}
