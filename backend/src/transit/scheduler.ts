import { getConfig } from '../config/configStore';
import { log } from '../lib/log';
import { refreshDepartures } from './departuresCache';

let timer: NodeJS.Timeout | null = null;

async function tick(): Promise<void> {
  try {
    await refreshDepartures();
  } catch (err) {
    log.error('Departures refresh failed', err);
  } finally {
    const seconds = getConfig().transit.refreshIntervalSeconds;
    timer = setTimeout(tick, seconds * 1000);
  }
}

export function startDeparturesScheduler(): void {
  if (timer) {
    return;
  }
  void tick();
}

export function stopDeparturesScheduler(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
