import { useEffect, useMemo, useState } from 'react';
import type { NearbyStop, Stop } from '../../../shared/types';
import {
  useFacilityLocation,
  useGeocode,
  useNearbyStops,
  useSaveLocation,
  useSaveSelectedStops,
  useSelectedStops,
} from '../api/queries';
import { modeLabel } from './transitModeLabels';

// transitous's stop search returns individual platforms, not aggregated
// stations — a station with S-Bahn, U-Bahn and bus service shows up as
// several same-named entries, each usually serving just one mode. Group
// them by name so the admin sees one overview per station with all its
// modes, while each underlying platform ID is still tracked separately
// (departures are fetched per platform ID, filtered by mode).
interface StopGroup {
  name: string;
  distanceMeters: number;
  platforms: NearbyStop[];
  availableModes: string[];
}

function groupStopsByName(stops: NearbyStop[]): StopGroup[] {
  const groups = new Map<string, StopGroup>();
  for (const stop of stops) {
    const existing = groups.get(stop.name);
    if (existing) {
      existing.platforms.push(stop);
      existing.distanceMeters = Math.min(existing.distanceMeters, stop.distanceMeters);
      existing.availableModes = Array.from(
        new Set([...existing.availableModes, ...stop.availableModes])
      ).sort();
    } else {
      groups.set(stop.name, {
        name: stop.name,
        distanceMeters: stop.distanceMeters,
        platforms: [stop],
        availableModes: [...stop.availableModes].sort(),
      });
    }
  }
  return Array.from(groups.values()).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export default function LocationStopsPage() {
  const [address, setAddress] = useState('');
  const [resolved, setResolved] = useState<{
    lat: number;
    lon: number;
    displayName: string;
  } | null>(null);
  // station name -> set of selected mode strings for that station
  const [selection, setSelection] = useState<Map<string, Set<string>>>(new Map());
  const [radiusDisplay, setRadiusDisplay] = useState(1000);
  const [radiusMeters, setRadiusMeters] = useState(1000);

  const facilityQuery = useFacilityLocation();
  const geocode = useGeocode();
  const saveLocation = useSaveLocation();
  const selectedStopsQuery = useSelectedStops();
  const nearbyStopsQuery = useNearbyStops(
    Boolean(facilityQuery.data?.lat) || saveLocation.isSuccess,
    radiusMeters
  );
  const saveSelectedStops = useSaveSelectedStops();

  const groups = useMemo(
    () => groupStopsByName(nearbyStopsQuery.data ?? []),
    [nearbyStopsQuery.data]
  );

  function commitRadius(value: number) {
    setRadiusDisplay(value);
    setRadiusMeters(value);
  }

  function formatRadius(meters: number): string {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  }

  useEffect(() => {
    if (facilityQuery.data && facilityQuery.data.lat !== null && facilityQuery.data.lon !== null) {
      setAddress(facilityQuery.data.address);
      setResolved({
        lat: facilityQuery.data.lat,
        lon: facilityQuery.data.lon,
        displayName: facilityQuery.data.address,
      });
    }
  }, [facilityQuery.data]);

  useEffect(() => {
    if (!selectedStopsQuery.data) return;
    const map = new Map<string, Set<string>>();
    for (const stop of selectedStopsQuery.data) {
      const modes = map.get(stop.name) ?? new Set<string>();
      if (stop.selectedModes.length > 0) {
        for (const mode of stop.selectedModes) modes.add(mode);
      } else {
        // Saved before per-mode filtering existed, or explicitly left
        // unfiltered: treat as "every mode this platform currently
        // offers" rather than "nothing", so it doesn't render as
        // unchecked and get silently dropped on the next save.
        const match = nearbyStopsQuery.data?.find((s) => s.id === stop.id);
        if (match) {
          for (const mode of match.availableModes) modes.add(mode);
        }
      }
      map.set(stop.name, modes);
    }
    setSelection(map);
  }, [selectedStopsQuery.data, nearbyStopsQuery.data]);

  async function handleGeocode() {
    const result = await geocode.mutateAsync(address);
    setResolved(result);
  }

  async function handleSaveLocation() {
    if (!resolved) return;
    await saveLocation.mutateAsync({ lat: resolved.lat, lon: resolved.lon, address });
  }

  function toggleMode(stationName: string, mode: string) {
    setSelection((prev) => {
      const next = new Map(prev);
      const modes = new Set(next.get(stationName) ?? []);
      if (modes.has(mode)) {
        modes.delete(mode);
      } else {
        modes.add(mode);
      }
      next.set(stationName, modes);
      return next;
    });
  }

  function selectAllModes(stationName: string, availableModes: string[]) {
    setSelection((prev) => {
      const next = new Map(prev);
      next.set(stationName, new Set(availableModes));
      return next;
    });
  }

  function deselectAllModes(stationName: string) {
    setSelection((prev) => {
      const next = new Map(prev);
      next.set(stationName, new Set());
      return next;
    });
  }

  async function handleSaveStops() {
    const stops: Stop[] = [];
    for (const group of groups) {
      const groupModes = selection.get(group.name);
      if (!groupModes || groupModes.size === 0) continue;
      for (const platform of group.platforms) {
        const platformModes = platform.availableModes.filter((mode) => groupModes.has(mode));
        if (platformModes.length === 0) continue;
        stops.push({
          id: platform.id,
          name: platform.name,
          lat: platform.lat,
          lon: platform.lon,
          selectedModes: platformModes,
        });
      }
    }
    await saveSelectedStops.mutateAsync(stops);
  }

  return (
    <div className="admin-page">
      <h1>Standort der Einrichtung</h1>
      <div className="admin-field-row">
        <input
          type="text"
          placeholder="Straße, Ort, PLZ"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button onClick={handleGeocode} disabled={geocode.isPending || !address}>
          {geocode.isPending ? 'Suche läuft…' : 'Adresse suchen'}
        </button>
      </div>
      {geocode.isError && <p className="admin-error">Adresse nicht gefunden</p>}
      {resolved && (
        <div className="admin-resolved">
          <p>{resolved.displayName}</p>
          <p>
            Breitengrad {resolved.lat.toFixed(5)}, Längengrad {resolved.lon.toFixed(5)}
          </p>
          <button onClick={handleSaveLocation} disabled={saveLocation.isPending}>
            {saveLocation.isPending ? 'Wird gespeichert…' : 'Standort speichern'}
          </button>
        </div>
      )}
      {saveLocation.isSuccess && <p className="admin-success">Standort gespeichert.</p>}

      <h1>Haltestellen in der Nähe</h1>
      <p className="admin-attribution">
        Haltestellendaten:{' '}
        <a href="https://transitous.org/sources/" target="_blank" rel="noreferrer">
          transitous.org
        </a>
        , ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap-Mitwirkende
        </a>
      </p>
      <p className="admin-attribution">
        Für jede Haltestelle können die gewünschten Verkehrsmittel einzeln ausgewählt werden — z. B.
        nur S-Bahn und Regionalbahn, aber keine Busse.
      </p>
      <label>
        Suchradius: {formatRadius(radiusDisplay)}
        <input
          type="range"
          min={200}
          max={5000}
          step={100}
          value={radiusDisplay}
          onChange={(e) => setRadiusDisplay(Number(e.target.value))}
          onMouseUp={(e) => commitRadius(Number(e.currentTarget.value))}
          onTouchEnd={(e) => commitRadius(Number(e.currentTarget.value))}
          onKeyUp={(e) => commitRadius(Number(e.currentTarget.value))}
        />
      </label>
      {nearbyStopsQuery.isLoading && <p>Haltestellen werden geladen…</p>}
      {nearbyStopsQuery.isError && (
        <p className="admin-error">
          Haltestellen konnten nicht geladen werden: {(nearbyStopsQuery.error as Error)?.message}
        </p>
      )}
      <ul className="admin-stop-list admin-stop-list--modes">
        {groups.map((group) => {
          const selectedModes = selection.get(group.name) ?? new Set<string>();
          const isSelected = selectedModes.size > 0;
          return (
            <li key={group.name} className={isSelected ? 'admin-stop-item--selected' : ''}>
              <div className="admin-stop-item__header">
                <span className="admin-stop-item__name">{group.name}</span>
                <span className="admin-stop-distance">{Math.round(group.distanceMeters)} m</span>
              </div>
              <div className="admin-stop-item__modes">
                {group.availableModes.map((mode) => (
                  <label key={mode} className="admin-mode-chip">
                    <input
                      type="checkbox"
                      checked={selectedModes.has(mode)}
                      onChange={() => toggleMode(group.name, mode)}
                    />
                    {modeLabel(mode)}
                  </label>
                ))}
                <button
                  type="button"
                  className="admin-link-button"
                  onClick={() => selectAllModes(group.name, group.availableModes)}
                >
                  Alle auswählen
                </button>
                <button
                  type="button"
                  className="admin-link-button"
                  onClick={() => deselectAllModes(group.name)}
                >
                  Keine
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <button onClick={handleSaveStops} disabled={saveSelectedStops.isPending}>
        {saveSelectedStops.isPending ? 'Wird gespeichert…' : 'Ausgewählte Haltestellen speichern'}
      </button>
      {saveSelectedStops.isSuccess && (
        <p className="admin-success">Haltestellenauswahl gespeichert.</p>
      )}
    </div>
  );
}
