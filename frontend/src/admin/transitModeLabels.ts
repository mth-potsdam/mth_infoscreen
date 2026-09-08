// German labels for transitous's Mode enum values, used to build the
// per-stop transport-mode picker in the admin panel.
export const MODE_LABELS: Record<string, string> = {
  TRAM: 'Straßenbahn',
  SUBWAY: 'U-Bahn',
  BUS: 'Bus',
  COACH: 'Fernbus',
  SUBURBAN: 'S-Bahn',
  RAIL: 'Zug',
  HIGHSPEED_RAIL: 'ICE / Hochgeschwindigkeit',
  LONG_DISTANCE: 'Fernverkehr',
  NIGHT_RAIL: 'Nachtzug',
  REGIONAL_RAIL: 'Regionalbahn (DB)',
  REGIONAL_FAST_RAIL: 'Regionalbahn (DB)',
  FERRY: 'Fähre',
  AIRPLANE: 'Flugzeug',
  FUNICULAR: 'Standseilbahn',
  AERIAL_LIFT: 'Seilbahn',
  ODM: 'Anruf-Sammeltaxi',
  RIDE_SHARING: 'Mitfahrgelegenheit',
};

export function modeLabel(mode: string): string {
  return MODE_LABELS[mode] ?? mode;
}
