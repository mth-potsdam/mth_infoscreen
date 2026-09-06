import { fetchWithTimeout } from '../lib/httpFetch';

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const userAgent = process.env.APP_USER_AGENT;
  if (!userAgent) {
    throw new Error('Die Umgebungsvariable APP_USER_AGENT ist erforderlich');
  }
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const res = await fetchWithTimeout(url.toString(), {
    headers: { 'User-Agent': userAgent },
  });
  if (!res.ok) {
    throw new Error(`Geokodierung fehlgeschlagen: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (data.length === 0) {
    return null;
  }
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}
