import { rateLimit } from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.' },
});
