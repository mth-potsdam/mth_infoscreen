import { NextFunction, Request, Response } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    next();
    return;
  }
  res.status(401).json({ error: 'Nicht autorisiert' });
}
