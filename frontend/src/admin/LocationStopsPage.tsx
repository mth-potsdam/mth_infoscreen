import { useEffect, useState } from 'react';
import type { Stop } from '../../../shared/types';
import {
  useFacilityLocation,
  useGeocode,
  useNearbyStops,
  useSaveLocation,
  useSaveSelectedStops,
  useSelectedStops,
} from '../api/queries';

export default function LocationStopsPage() {
  const [address, setAddress] = useState('');
  const [resolved, setResolved] = useState<{
    lat: number;
    lon: number;
    displayName: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    if (selectedStopsQuery.data) {
      setSelectedIds(new Set(selectedStopsQuery.data.map((s) => s.id)));
    }
  }, [selectedStopsQuery.data]);

  async function handleGeocode() {
    const result = await geocode.mutateAsync(address);
    setResolved(result);
  }

  async function handleSaveLocation() {
    if (!resolved) return;
    await saveLocation.mutateAsync({ lat: resolved.lat, lon: resolved.lon, address });
  }

  function toggleStop(stop: Stop) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(stop.id)) {
        next.delete(stop.id);
      } else {
        next.add(stop.id);
      }
      return next;
    });
  }

  async function handleSaveStops() {
    const source = nearbyStopsQuery.data ?? [];
    const stops: Stop[] = source
      .filter((stop) => selectedIds.has(stop.id))
      .map(({ id, name, lat, lon }) => ({ id, name, lat, lon }));
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
      <ul className="admin-stop-list">
        {nearbyStopsQuery.data?.map((stop) => (
          <li key={stop.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.has(stop.id)}
                onChange={() => toggleStop(stop)}
              />
              {stop.name}
              <span className="admin-stop-distance">{Math.round(stop.distanceMeters)} m</span>
            </label>
          </li>
        ))}
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
