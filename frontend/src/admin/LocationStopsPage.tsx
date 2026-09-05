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

  const facilityQuery = useFacilityLocation();
  const geocode = useGeocode();
  const saveLocation = useSaveLocation();
  const selectedStopsQuery = useSelectedStops();
  const nearbyStopsQuery = useNearbyStops(
    Boolean(facilityQuery.data?.lat) || saveLocation.isSuccess
  );
  const saveSelectedStops = useSaveSelectedStops();

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
      <h1>Facility Location</h1>
      <div className="admin-field-row">
        <input
          type="text"
          placeholder="Street, city, postcode"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button onClick={handleGeocode} disabled={geocode.isPending || !address}>
          {geocode.isPending ? 'Searching…' : 'Geocode'}
        </button>
      </div>
      {geocode.isError && <p className="admin-error">Address not found</p>}
      {resolved && (
        <div className="admin-resolved">
          <p>{resolved.displayName}</p>
          <p>
            Lat {resolved.lat.toFixed(5)}, Lon {resolved.lon.toFixed(5)}
          </p>
          <button onClick={handleSaveLocation} disabled={saveLocation.isPending}>
            {saveLocation.isPending ? 'Saving…' : 'Save location'}
          </button>
        </div>
      )}
      {saveLocation.isSuccess && <p className="admin-success">Location saved.</p>}

      <h1>Nearby Stops</h1>
      {nearbyStopsQuery.isLoading && <p>Loading nearby stops…</p>}
      {nearbyStopsQuery.isError && (
        <p className="admin-error">
          Could not load nearby stops: {(nearbyStopsQuery.error as Error)?.message}
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
        {saveSelectedStops.isPending ? 'Saving…' : 'Save selected stops'}
      </button>
      {saveSelectedStops.isSuccess && <p className="admin-success">Stop selection saved.</p>}
    </div>
  );
}
