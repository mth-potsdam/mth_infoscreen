import { promises as fs } from 'fs';
import path from 'path';
import { CONFIG_DIR } from '../config/configStore';
import { log } from '../lib/log';

export const MEDIA_DIR = path.join(CONFIG_DIR, 'media');

export async function ensureMediaDir(): Promise<void> {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
}

export interface AcceptedFormat {
  exts: string[];
  type: 'image' | 'video';
  maxBytes: number;
}

const MB = 1024 * 1024;

export const ACCEPTED_FORMATS: Record<string, AcceptedFormat> = {
  'image/jpeg': { exts: ['.jpg', '.jpeg'], type: 'image', maxBytes: 20 * MB },
  'image/png': { exts: ['.png'], type: 'image', maxBytes: 20 * MB },
  'image/webp': { exts: ['.webp'], type: 'image', maxBytes: 20 * MB },
  'video/mp4': { exts: ['.mp4'], type: 'video', maxBytes: 200 * MB },
};

export async function deleteMediaFile(filename: string): Promise<void> {
  try {
    await fs.unlink(path.join(MEDIA_DIR, filename));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
    log.warn(`Media file already missing on disk, ignoring: ${filename}`);
  }
}
