import { randomUUID } from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { MediaItem } from '../../../shared/types';
import { requireAdmin } from '../auth/authMiddleware';
import { getConfig, updateConfig } from '../config/configStore';
import { asyncHandler } from '../lib/asyncHandler';
import { ACCEPTED_FORMATS, deleteMediaFile, MEDIA_DIR } from '../media/mediaStore';

const router = Router();
router.use(requireAdmin);

// The largest format-specific cap (video) — the tighter, per-type image cap
// is checked after upload, once the actual file size is known (multer's
// fileFilter runs before the file is read, so it can't see final size, and
// multer only supports a single global fileSize limit).
const UPLOAD_CEILING_BYTES = Math.max(...Object.values(ACCEPTED_FORMATS).map((f) => f.maxBytes));

const upload = multer({
  storage: multer.diskStorage({
    destination: MEDIA_DIR,
    filename: (_req, file, cb) => {
      const format = ACCEPTED_FORMATS[file.mimetype];
      const ext = format ? format.exts[0] : path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: UPLOAD_CEILING_BYTES },
  fileFilter: (_req, file, cb) => {
    const format = ACCEPTED_FORMATS[file.mimetype];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!format || !format.exts.includes(ext)) {
      cb(new Error('Nicht unterstütztes Dateiformat'));
      return;
    }
    cb(null, true);
  },
});

function uploadErrorMessage(err: unknown): string {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return `Datei zu groß (max. ${Math.round(UPLOAD_CEILING_BYTES / 1024 / 1024)} MB)`;
  }
  return err instanceof Error ? err.message : 'Upload fehlgeschlagen';
}

router.get('/admin/media', (_req, res) => {
  res.json(getConfig().slideshow.items);
});

router.post(
  '/admin/media',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: uploadErrorMessage(err) });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Keine Datei erhalten' });
      return;
    }
    // Path/mimetype spoofing is only a concern from an untrusted caller —
    // this is an internal, LAN-only, admin-only tool, so mimetype +
    // extension matching (already applied in fileFilter) is sufficient
    // without magic-byte sniffing the file contents.
    const format = ACCEPTED_FORMATS[file.mimetype];
    if (!format || file.size > format.maxBytes) {
      await deleteMediaFile(file.filename);
      res.status(400).json({
        error: `Datei zu groß (max. ${Math.round((format?.maxBytes ?? 0) / 1024 / 1024)} MB)`,
      });
      return;
    }

    const item: MediaItem = {
      id: path.basename(file.filename, path.extname(file.filename)),
      filename: file.filename,
      originalName: file.originalname,
      type: format.type,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
    };
    await updateConfig((cfg) => {
      cfg.slideshow.items.push(item);
      return cfg;
    });
    res.status(201).json(item);
  })
);

router.delete(
  '/admin/media/:id',
  asyncHandler(async (req, res) => {
    const { items } = getConfig().slideshow;
    const item = items.find((i) => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Element nicht gefunden' });
      return;
    }
    await deleteMediaFile(item.filename);
    const next = await updateConfig((cfg) => {
      cfg.slideshow.items = cfg.slideshow.items.filter((i) => i.id !== req.params.id);
      return cfg;
    });
    res.json(next.slideshow.items);
  })
);

router.put(
  '/admin/media/order',
  asyncHandler(async (req, res) => {
    const { order } = req.body as { order?: string[] };
    const { items } = getConfig().slideshow;
    const currentIds = new Set(items.map((i) => i.id));
    const orderedIds = new Set(order);
    if (
      !Array.isArray(order) ||
      order.length !== items.length ||
      orderedIds.size !== currentIds.size ||
      ![...orderedIds].every((id) => currentIds.has(id))
    ) {
      res.status(400).json({ error: 'order muss genau die vorhandenen IDs enthalten' });
      return;
    }
    const next = await updateConfig((cfg) => {
      const byId = new Map(cfg.slideshow.items.map((i) => [i.id, i]));
      cfg.slideshow.items = order.map((id) => byId.get(id)!);
      return cfg;
    });
    res.json(next.slideshow.items);
  })
);

router.get('/admin/settings/slideshow-overview-duration', (_req, res) => {
  res.json({ overviewDurationSeconds: getConfig().slideshow.overviewDurationSeconds });
});

router.put(
  '/admin/settings/slideshow-overview-duration',
  asyncHandler(async (req, res) => {
    const { seconds } = req.body as { seconds?: number };
    if (!Number.isInteger(seconds) || (seconds as number) < 30) {
      res.status(400).json({ error: 'seconds muss eine ganze Zahl ≥ 30 sein' });
      return;
    }
    const next = await updateConfig((cfg) => {
      cfg.slideshow.overviewDurationSeconds = seconds as number;
      return cfg;
    });
    res.json({ overviewDurationSeconds: next.slideshow.overviewDurationSeconds });
  })
);

router.get('/admin/settings/slideshow-item-duration', (_req, res) => {
  res.json({ itemDurationSeconds: getConfig().slideshow.itemDurationSeconds });
});

router.put(
  '/admin/settings/slideshow-item-duration',
  asyncHandler(async (req, res) => {
    const { seconds } = req.body as { seconds?: number };
    if (!Number.isInteger(seconds) || (seconds as number) < 3) {
      res.status(400).json({ error: 'seconds muss eine ganze Zahl ≥ 3 sein' });
      return;
    }
    const next = await updateConfig((cfg) => {
      cfg.slideshow.itemDurationSeconds = seconds as number;
      return cfg;
    });
    res.json({ itemDurationSeconds: next.slideshow.itemDurationSeconds });
  })
);

export default router;
