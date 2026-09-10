import { Router } from 'express';
import { getEventsResponse } from '../graph/eventsCache';
import { getSlideshowResponse } from '../media/slideshowResponse';
import { getDeparturesResponse } from '../transit/departuresCache';

const router = Router();

router.get('/display/departures', (_req, res) => {
  res.json(getDeparturesResponse());
});

router.get('/display/events', (_req, res) => {
  res.json(getEventsResponse());
});

router.get('/display/slideshow', (_req, res) => {
  res.json(getSlideshowResponse());
});

export default router;
