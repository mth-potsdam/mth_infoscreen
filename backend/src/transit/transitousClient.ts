import { fetchWithTimeout } from '../lib/httpFetch';
import { NearbyStop } from '../../../shared/types';

const BASE_URL = process.env.DEPARTURES_API_BASE || 'https://api.transitous.org';

function userAgentHeaders(): Record<string, string> {
  const userAgent = process.env.APP_USER_AGENT;
  if (!userAgent) {
    throw new Error('APP_USER_AGENT environment variable is required');
  }
  return { 'User-Agent': userAgent };
}

// Haversine distance in meters — transitous's reverse-geocode doesn't return
// a distance field, only coordinates, so we compute it ourselves.
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Match {
  type: 'ADDRESS' | 'PLACE' | 'STOP';
  name: string;
  id: string;
  lat: number;
  lon: number;
}

export async function findNearbyStops(
  lat: number,
  lon: number,
  numResults = 15
): Promise<NearbyStop[]> {
  const url = new URL(`${BASE_URL}/api/v1/reverse-geocode`);
  url.searchParams.set('place', `${lat},${lon}`);
  url.searchParams.set('type', 'STOP');
  url.searchParams.set('numResults', String(numResults));

  const res = await fetchWithTimeout(url.toString(), { headers: userAgentHeaders() });
  if (!res.ok) {
    throw new Error(`Nearby stops lookup failed: ${res.status} ${res.statusText}`);
  }
  const matches = (await res.json()) as Match[];
  return matches
    .filter((match) => match.type === 'STOP')
    .map((match) => ({
      id: match.id,
      name: match.name,
      lat: match.lat,
      lon: match.lon,
      distanceMeters: Math.round(distanceMeters(lat, lon, match.lat, match.lon)),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

interface Place {
  name: string;
  lat: number;
  lon: number;
  arrival?: string;
  departure?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  scheduledTrack?: string;
  track?: string;
  cancelled?: boolean;
}

interface StopTime {
  place: Place;
  mode: string;
  headsign?: string;
  routeShortName?: string;
  displayName?: string;
  cancelled: boolean;
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

function delaySecondsBetween(scheduled?: string, actual?: string): number | null {
  if (!scheduled || !actual) return null;
  const diffMs = new Date(actual).getTime() - new Date(scheduled).getTime();
  return Number.isNaN(diffMs) ? null : Math.round(diffMs / 1000);
}

export async function fetchDepartures(stopId: string, n = 10): Promise<StopDeparture[]> {
  const url = new URL(`${BASE_URL}/api/v6/stoptimes`);
  url.searchParams.set('stopId', stopId);
  url.searchParams.set('n', String(n));

  const res = await fetchWithTimeout(url.toString(), { headers: userAgentHeaders() });
  if (!res.ok) {
    throw new Error(
      `Departures lookup failed for stop ${stopId}: ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as { stopTimes: StopTime[] };
  return data.stopTimes.map((entry) => ({
    line: entry.routeShortName || entry.displayName || '?',
    product: entry.mode,
    direction: entry.headsign ?? '',
    plannedWhen: entry.place.scheduledDeparture ?? null,
    when: entry.place.departure ?? entry.place.scheduledDeparture ?? null,
    delaySeconds: delaySecondsBetween(entry.place.scheduledDeparture, entry.place.departure),
    platform: entry.place.track ?? entry.place.scheduledTrack ?? null,
    cancelled: entry.cancelled ?? entry.place.cancelled ?? false,
  }));
}
