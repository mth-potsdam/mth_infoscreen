import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { requireAdmin } from '../auth/authMiddleware';
import { loginRateLimiter } from '../auth/loginRateLimiter';
import { getConfig, updateConfig } from '../config/configStore';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.post(
  '/admin/login',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const { password } = req.body as { password?: string };
    if (!password) {
      res.status(400).json({ error: 'Passwort ist erforderlich' });
      return;
    }
    const { passwordHash } = getConfig().admin;
    if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
      res.status(401).json({ error: 'Falsches Passwort' });
      return;
    }
    req.session = { authenticated: true };
    res.json({ ok: true });
  })
);

router.post('/admin/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get('/admin/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session?.authenticated) });
});

router.post(
  '/admin/change-password',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({
        error: 'Aktuelles und neues Passwort (mind. 8 Zeichen) sind erforderlich',
      });
      return;
    }
    const { passwordHash } = getConfig().admin;
    if (!passwordHash || !(await bcrypt.compare(currentPassword, passwordHash))) {
      res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
      return;
    }
    const nextHash = await bcrypt.hash(newPassword, 12);
    await updateConfig((cfg) => {
      cfg.admin.passwordHash = nextHash;
      return cfg;
    });
    res.json({ ok: true });
  })
);

export default router;
