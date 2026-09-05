import express, { Express, NextFunction, Request, Response } from 'express';
import path from 'path';
import { sessionMiddleware } from './auth/session';
import { log } from './lib/log';
import adminAuthRouter from './routes/adminAuth';
import adminGraphRouter from './routes/adminGraph';
import adminLocationStopsRouter from './routes/adminLocationStops';
import displayRouter from './routes/display';
import healthRouter from './routes/health';

export function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(sessionMiddleware());

  app.use('/api', healthRouter);
  app.use('/api', displayRouter);
  app.use('/api', adminAuthRouter);
  app.use('/api', adminLocationStopsRouter);
  app.use('/api', adminGraphRouter);

  if (process.env.NODE_ENV === 'production') {
    const publicDir = path.join(__dirname, '..', 'public');
    app.use(express.static(publicDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    log.error('Unhandled route error', err);
    // This is an internal, LAN-only admin tool with no untrusted callers,
    // so surfacing the real (non-stack-trace) error message is worth more
    // for diagnosing upstream API failures than hiding it would protect.
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
