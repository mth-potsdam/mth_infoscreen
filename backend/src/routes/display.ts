import { Router } from 'express';
import { getEventsResponse } from '../graph/eventsCache';
import { getDeparturesResponse } from '../transit/departuresCache';

const router = Router();

router.get('/display/departures', (_req, res) => {
  res.json(getDeparturesResponse());
});

router.get('/display/events', (_req, res) => {
  res.json(getEventsResponse());
});

export default router;
