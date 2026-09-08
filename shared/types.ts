interface StopLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface Stop extends StopLocation {
  // Which transit modes (e.g. "BUS", "SUBURBAN", "REGIONAL_RAIL") to show
  // departures for at this stop. Empty means unfiltered (show everything).
  selectedModes: string[];
}

export interface NearbyStop extends StopLocation {
  distanceMeters: number;
  // The modes actually served at this stop, as reported by the transit
  // API — used to build the mode picker in the admin panel.
  availableModes: string[];
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
  // Whether this event should appear in the detail-view rotation, driven
  // by an admin-mapped Yes/No column on the Microsoft List.
  showDetails: boolean;
}

export interface EventsResponse {
  generatedAt: string;
  dataAsOf: string | null;
  stale: boolean;
  refreshIntervalSeconds: number;
  // How long the display should show the events overview vs. each
  // showDetails event's own detail page, in seconds. Bundled here (rather
  // than a separate admin-only endpoint) since the public display needs
  // them without authenticating.
  overviewDurationSeconds: number;
  detailDurationSeconds: number;
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
  // Name of a Yes/No column controlling the detail-view rotation. Empty
  // means not configured (no events get a detail page).
  showDetails: string;
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
