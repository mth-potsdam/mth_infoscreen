import { Router } from 'express';

const router = Router();
const startedAt = Date.now();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000) });
});

export default router;
