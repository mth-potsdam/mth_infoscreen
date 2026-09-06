import { Router } from 'express';
import { requireAdmin } from '../auth/authMiddleware';
import { getConfig, updateConfig } from '../config/configStore';
import { geocodeAddress } from '../geocode/nominatimClient';
import { asyncHandler } from '../lib/asyncHandler';
import { findNearbyStops } from '../transit/transitousClient';

const router = Router();
router.use(requireAdmin);

router.post(
  '/admin/geocode',
  asyncHandler(async (req, res) => {
    const { address } = req.body as { address?: string };
    if (!address) {
      res.status(400).json({ error: 'Adresse ist erforderlich' });
      return;
    }
    const result = await geocodeAddress(address);
    if (!result) {
      res.status(404).json({ error: 'Adresse nicht gefunden' });
      return;
    }
    res.json(result);
  })
);

router.get('/admin/location', (_req, res) => {
  res.json(getConfig().facility);
});

router.put(
  '/admin/location',
  asyncHandler(async (req, res) => {
    const { lat, lon, address } = req.body as { lat?: number; lon?: number; address?: string };
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      res.status(400).json({ error: 'lat und lon müssen Zahlen sein' });
      return;
    }
    const next = await updateConfig((cfg) => {
      cfg.facility = { lat, lon, address: address ?? cfg.facility.address };
      return cfg;
    });
    res.json(next.facility);
  })
);

router.get(
  '/admin/stops/nearby',
  asyncHandler(async (req, res) => {
    const { facility } = getConfig();
    if (facility.lat === null || facility.lon === null) {
      res.status(400).json({ error: 'Bitte zuerst den Standort der Einrichtung festlegen' });
      return;
    }
    const radius = Number(req.query.radius ?? 1000);
    const stops = await findNearbyStops(facility.lat, facility.lon, radius);
    res.json(stops);
  })
);

router.get('/admin/stops/selected', (_req, res) => {
  res.json(getConfig().transit.selectedStops);
});

router.put(
  '/admin/stops/selected',
  asyncHandler(async (req, res) => {
    const { stops } = req.body as {
      stops?: Array<{ id: string; name: string; lat: number; lon: number }>;
    };
    if (!Array.isArray(stops)) {
      res.status(400).json({ error: 'stops muss ein Array sein' });
      return;
    }
    const next = await updateConfig((cfg) => {
      cfg.transit.selectedStops = stops;
      return cfg;
    });
    res.json(next.transit.selectedStops);
  })
);

router.get('/admin/settings/departures-interval', (_req, res) => {
  res.json({ refreshIntervalSeconds: getConfig().transit.refreshIntervalSeconds });
});

router.put(
  '/admin/settings/departures-interval',
  asyncHandler(async (req, res) => {
    const { seconds } = req.body as { seconds?: number };
    if (!Number.isInteger(seconds) || (seconds as number) < 10) {
      res.status(400).json({ error: 'seconds muss eine ganze Zahl ≥ 10 sein' });
      return;
    }
    const next = await updateConfig((cfg) => {
      cfg.transit.refreshIntervalSeconds = seconds as number;
      return cfg;
    });
    res.json({ refreshIntervalSeconds: next.transit.refreshIntervalSeconds });
  })
);

export default router;
