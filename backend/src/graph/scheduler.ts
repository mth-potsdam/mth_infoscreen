import { getConfig } from '../config/configStore';
import { log } from '../lib/log';
import { refreshEvents } from './eventsCache';

let timer: NodeJS.Timeout | null = null;

async function tick(): Promise<void> {
  try {
    await refreshEvents();
  } catch (err) {
    log.error('Events refresh failed', err);
  } finally {
    const seconds = getConfig().graph.refreshIntervalSeconds;
    timer = setTimeout(tick, seconds * 1000);
  }
}

export function startEventsScheduler(): void {
  if (timer) {
    return;
  }
  void tick();
}

export function stopEventsScheduler(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
