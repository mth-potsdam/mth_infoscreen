import { promises as fs } from 'fs';
import path from 'path';
import { log } from '../lib/log';
import { AppConfig, configSchema, defaultConfig } from './schema';

export const CONFIG_DIR = process.env.CONFIG_DIR || '/data';
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

let current: AppConfig = defaultConfig;

function mergeWithDefaults(partial: unknown): AppConfig {
  const merged = { ...defaultConfig, ...(partial as object) } as AppConfig;
  const result = configSchema.safeParse(merged);
  return result.success ? result.data : defaultConfig;
}

export async function loadConfig(): Promise<AppConfig> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf8');
    const parsed = configSchema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      current = parsed.data;
    } else {
      log.warn('config.json failed validation, merging with defaults', parsed.error.message);
      current = mergeWithDefaults(JSON.parse(raw));
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      log.info('No config.json found, starting with defaults');
      current = defaultConfig;
      await saveConfig(current);
    } else {
      throw err;
    }
  }
  return current;
}

export async function saveConfig(next: AppConfig): Promise<void> {
  current = next;
  const tmpPath = `${CONFIG_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), 'utf8');
  await fs.rename(tmpPath, CONFIG_PATH);
}

export function getConfig(): AppConfig {
  return current;
}

// Concurrent callers must not race: each call clones `current`, mutates it,
// and writes it back, so two calls overlapping would let the one that reads
// the older snapshot last clobber the other's change when it saves. Chaining
// onto this queue serializes calls so each mutator always sees the previous
// call's result.
let writeQueue: Promise<unknown> = Promise.resolve();

export async function updateConfig(
  mutator: (config: AppConfig) => AppConfig
): Promise<AppConfig> {
  let result!: AppConfig;
  const task = writeQueue.then(async () => {
    const next = mutator(structuredClone(current));
    await saveConfig(next);
    result = next;
  });
  writeQueue = task.catch(() => undefined);
  await task;
  return result;
}
