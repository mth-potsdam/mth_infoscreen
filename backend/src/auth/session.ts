import cookieSession from 'cookie-session';

export function sessionMiddleware() {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error('Die Umgebungsvariable APP_SECRET ist erforderlich');
  }
  return cookieSession({
    name: 'mth_infoscreen_session',
    keys: [secret],
    maxAge: 12 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
  });
}
