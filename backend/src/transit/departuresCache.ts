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

  const departures = entries
    .flatMap((entry) => entry.departures)
    .sort((a, b) => (a.when ?? '').localeCompare(b.when ?? ''));

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
