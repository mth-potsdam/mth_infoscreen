export interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface NearbyStop extends Stop {
  distanceMeters: number;
  products: string[];
}

export interface Departure {
  stopId: string;
  stopName: string;
  line: string;
  product: string;
  direction: string;
  plannedWhen: string | null;
  when: string | null;
  delaySeconds: number | null;
  platform: string | null;
  cancelled: boolean;
}

export interface DeparturesResponse {
  generatedAt: string;
  dataAsOf: string | null;
  stale: boolean;
  staleStops: string[];
  refreshIntervalSeconds: number;
  departures: Departure[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  location: string | null;
  description: string | null;
}

export interface EventsResponse {
  generatedAt: string;
  dataAsOf: string | null;
  stale: boolean;
  refreshIntervalSeconds: number;
  events: CalendarEvent[];
}

export interface FacilityLocation {
  address: string;
  lat: number | null;
  lon: number | null;
}

export interface GraphColumnMapping {
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
}

export interface GraphSettingsPublic {
  tenantId: string;
  clientId: string;
  hasClientSecret: boolean;
  siteId: string | null;
  siteName: string | null;
  listId: string | null;
  listName: string | null;
  columnMapping: GraphColumnMapping | null;
  refreshIntervalSeconds: number;
}

export interface GraphSite {
  id: string;
  name: string;
  webUrl: string;
}

export interface GraphList {
  id: string;
  name: string;
}

export interface GraphColumn {
  name: string;
  displayName: string;
}

export interface TestConnectionResult {
  ok: boolean;
  step?: 'token' | 'site' | 'list' | 'items';
  error?: string;
}
