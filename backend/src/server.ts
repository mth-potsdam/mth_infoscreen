import dotenv from 'dotenv';
import path from 'path';
import { createApp } from './app';
import { bootstrapAdminPassword } from './config/bootstrap';
import { loadConfig } from './config/configStore';
import { startEventsScheduler } from './graph/scheduler';
import { log } from './lib/log';
import { startDeparturesScheduler } from './transit/scheduler';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main(): Promise<void> {
  if (!process.env.APP_SECRET) {
    throw new Error('Die Umgebungsvariable APP_SECRET ist erforderlich');
  }

  await loadConfig();
  await bootstrapAdminPassword();

  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);

  app.listen(port, () => {
    log.info(`mth_infoscreen backend listening on port ${port}`);
  });

  startDeparturesScheduler();
  startEventsScheduler();
}

main().catch((err) => {
  log.error('Fatal startup error', err);
  process.exit(1);
});
