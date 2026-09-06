import bcrypt from 'bcryptjs';
import { log } from '../lib/log';
import { getConfig, updateConfig } from './configStore';

export async function bootstrapAdminPassword(): Promise<void> {
  const config = getConfig();
  if (config.admin.passwordHash) {
    return;
  }
  const initialPassword = process.env.ADMIN_PASSWORD;
  if (!initialPassword) {
    throw new Error(
      'Es wurde noch kein Admin-Passwort festgelegt. Setzen Sie beim ersten Start die Umgebungsvariable ADMIN_PASSWORD, um das Admin-Konto einzurichten.'
    );
  }
  const passwordHash = await bcrypt.hash(initialPassword, 12);
  await updateConfig((cfg) => {
    cfg.admin.passwordHash = passwordHash;
    return cfg;
  });
  log.info('Bootstrapped admin password from ADMIN_PASSWORD env var');
}
