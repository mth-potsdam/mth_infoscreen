import { fetchWithTimeout } from '../lib/httpFetch';
import { NearbyStop } from '../../../shared/types';

const BASE_URL = process.env.DEPARTURES_API_BASE || 'https://v6.db.transport.rest';

interface RawNearbyStop {
  id: string;
  name: string;
  location?: { latitude: number; longitude: number };
  distance?: number;
  products?: Record<string, boolean>;
}

interface RawDeparture {
  line?: { name?: string; product?: string };
  direction?: string;
  plannedWhen?: string;
  when?: string;
  delay?: number;
  platform?: string;
  cancelled?: boolean;
}

export async function findNearbyStops(
  lat: number,
  lon: number,
  results = 10,
  distance = 1000
): Promise<NearbyStop[]> {
  const url = new URL(`${BASE_URL}/locations/nearby`);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('results', String(results));
  url.searchParams.set('distance', String(distance));
  url.searchParams.set('stops', 'true');
  url.searchParams.set('poi', 'false');

  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) {
    throw new Error(`Nearby stops lookup failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as RawNearbyStop[];
  return data
    .filter((entry) => entry.id && entry.location)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      lat: entry.location!.latitude,
      lon: entry.location!.longitude,
      distanceMeters: entry.distance ?? 0,
      products: Object.entries(entry.products ?? {})
        .filter(([, enabled]) => enabled)
        .map(([product]) => product),
    }));
}

export interface StopDeparture {
  line: string;
  product: string;
  direction: string;
  plannedWhen: string | null;
  when: string | null;
  delaySeconds: number | null;
  platform: string | null;
  cancelled: boolean;
}

export async function fetchDepartures(
  stopId: string,
  duration = 60,
  results = 10
): Promise<StopDeparture[]> {
  const url = new URL(`${BASE_URL}/stops/${encodeURIComponent(stopId)}/departures`);
  url.searchParams.set('duration', String(duration));
  url.searchParams.set('results', String(results));

  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) {
    throw new Error(
      `Departures lookup failed for stop ${stopId}: ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as { departures?: RawDeparture[] };
  return (data.departures ?? []).map((entry) => ({
    line: entry.line?.name ?? '?',
    product: entry.line?.product ?? 'unknown',
    direction: entry.direction ?? '',
    plannedWhen: entry.plannedWhen ?? null,
    when: entry.when ?? entry.plannedWhen ?? null,
    delaySeconds: entry.delay ?? null,
    platform: entry.platform ?? null,
    cancelled: entry.cancelled ?? false,
  }));
}
