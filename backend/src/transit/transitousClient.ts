import { fetchWithTimeout } from '../lib/httpFetch';
import { NearbyStop } from '../../../shared/types';

const BASE_URL = process.env.DEPARTURES_API_BASE || 'https://api.transitous.org';

function userAgentHeaders(): Record<string, string> {
  const userAgent = process.env.APP_USER_AGENT;
  if (!userAgent) {
    throw new Error('Die Umgebungsvariable APP_USER_AGENT ist erforderlich');
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

interface MapStopsPlace {
  name: string;
  stopId?: string;
  lat: number;
  lon: number;
  modes?: string[];
}

const METERS_PER_DEGREE_LAT = 111_320;
const MAX_RESULTS = 200;

// The map/stops endpoint's `min`/`max` params are, confusingly, the
// lower-right and upper-left corners respectively (not the more common
// lower-left/upper-right convention).
function boundingBox(lat: number, lon: number, radiusMeters: number): { min: string; max: string } {
  const latDelta = radiusMeters / METERS_PER_DEGREE_LAT;
  const lonDelta = radiusMeters / (METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));
  const south = lat - latDelta;
  const north = lat + latDelta;
  const west = lon - lonDelta;
  const east = lon + lonDelta;
  return { min: `${south},${east}`, max: `${north},${west}` };
}

// Multiple GTFS feeds (VBB, DELFI, long-distance coach operators, ...) often
// publish the same physical stop under slightly different IDs, sometimes
// each reporting only a subset of the modes actually served there. Collapse
// entries with the same name within ~10m of each other, keeping the closest
// and merging their modes so the admin sees the full picture for that stop.
function dedupeStops(stops: NearbyStop[]): NearbyStop[] {
  const kept = new Map<string, NearbyStop>();
  const order: string[] = [];
  for (const stop of stops) {
    const key = `${stop.name}|${Math.round(stop.lat * 10_000)}|${Math.round(stop.lon * 10_000)}`;
    const existing = kept.get(key);
    if (!existing) {
      kept.set(key, stop);
      order.push(key);
    } else {
      existing.availableModes = Array.from(
        new Set([...existing.availableModes, ...stop.availableModes])
      ).sort();
    }
  }
  return order.map((key) => kept.get(key) as NearbyStop);
}

export async function findNearbyStops(
  lat: number,
  lon: number,
  radiusMeters: number
): Promise<NearbyStop[]> {
  const { min, max } = boundingBox(lat, lon, radiusMeters);
  const url = new URL(`${BASE_URL}/api/v6/map/stops`);
  url.searchParams.set('min', min);
  url.searchParams.set('max', max);

  const res = await fetchWithTimeout(url.toString(), { headers: userAgentHeaders() });
  if (!res.ok) {
    throw new Error(`Suche nach Haltestellen fehlgeschlagen: ${res.status} ${res.statusText}`);
  }
  const places = (await res.json()) as MapStopsPlace[];
  const withDistance = places
    .filter((place) => place.stopId)
    .map((place) => ({
      id: place.stopId as string,
      name: place.name,
      lat: place.lat,
      lon: place.lon,
      distanceMeters: Math.round(distanceMeters(lat, lon, place.lat, place.lon)),
      availableModes: [...new Set(place.modes ?? [])].sort(),
    }))
    .filter((stop) => stop.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return dedupeStops(withDistance).slice(0, MAX_RESULTS);
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

export async function fetchDepartures(
  stopId: string,
  lookaheadMinutes: number,
  modes: string[] = [],
  n = 30
): Promise<StopDeparture[]> {
  const url = new URL(`${BASE_URL}/api/v6/stoptimes`);
  url.searchParams.set('stopId', stopId);
  url.searchParams.set('n', String(n));
  url.searchParams.set('window', String(lookaheadMinutes * 60));
  if (modes.length > 0) {
    url.searchParams.set('mode', modes.join(','));
  }

  const res = await fetchWithTimeout(url.toString(), { headers: userAgentHeaders() });
  if (!res.ok) {
    throw new Error(
      `Abfrage der Abfahrten für Haltestelle ${stopId} fehlgeschlagen: ${res.status} ${res.statusText}`
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
