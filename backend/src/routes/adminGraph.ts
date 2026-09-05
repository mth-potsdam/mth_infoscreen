import { Router } from 'express';
import { GraphSettingsPublic } from '../../../shared/types';
import { requireAdmin } from '../auth/authMiddleware';
import { getConfig, updateConfig } from '../config/configStore';
import { getGraphAccessToken, invalidateGraphToken } from '../graph/graphAuth';
import {
  fetchListItems,
  listColumnsForList,
  listListsForSite,
  searchSites,
} from '../graph/sharePointLists';
import { asyncHandler } from '../lib/asyncHandler';
import { encrypt } from '../lib/crypto';

const router = Router();
router.use(requireAdmin);

function toPublicSettings(): GraphSettingsPublic {
  const { graph } = getConfig();
  return {
    tenantId: graph.tenantId,
    clientId: graph.clientId,
    hasClientSecret: Boolean(graph.clientSecretEncrypted),
    siteId: graph.siteId,
    siteName: graph.siteName,
    listId: graph.listId,
    listName: graph.listName,
    columnMapping: graph.columnMapping,
    refreshIntervalSeconds: graph.refreshIntervalSeconds,
  };
}

router.get('/admin/graph/settings', (_req, res) => {
  res.json(toPublicSettings());
});

router.put(
  '/admin/graph/settings',
  asyncHandler(async (req, res) => {
    const { tenantId, clientId, clientSecret } = req.body as {
      tenantId?: string;
      clientId?: string;
      clientSecret?: string;
    };
    if (!tenantId || !clientId) {
      res.status(400).json({ error: 'tenantId and clientId are required' });
      return;
    }
    await updateConfig((cfg) => {
      cfg.graph.tenantId = tenantId;
      cfg.graph.clientId = clientId;
      if (clientSecret) {
        cfg.graph.clientSecretEncrypted = encrypt(clientSecret);
      }
      return cfg;
    });
    invalidateGraphToken();
    res.json(toPublicSettings());
  })
);

router.get(
  '/admin/graph/sites',
  asyncHandler(async (req, res) => {
    const search = String(req.query.search ?? '');
    const sites = await searchSites(search);
    res.json(sites);
  })
);

router.get(
  '/admin/graph/sites/:siteId/lists',
  asyncHandler(async (req, res) => {
    const lists = await listListsForSite(req.params.siteId);
    res.json(lists);
  })
);

router.get(
  '/admin/graph/lists/:siteId/:listId/columns',
  asyncHandler(async (req, res) => {
    const columns = await listColumnsForList(req.params.siteId, req.params.listId);
    res.json(columns);
  })
);

router.put(
  '/admin/graph/mapping',
  asyncHandler(async (req, res) => {
    const { siteId, siteName, listId, listName, title, start, end, location, description } =
      req.body as {
        siteId?: string;
        siteName?: string;
        listId?: string;
        listName?: string;
        title?: string;
        start?: string;
        end?: string;
        location?: string;
        description?: string;
      };
    if (!siteId || !listId || !title || !start) {
      res.status(400).json({ error: 'siteId, listId, title and start are required' });
      return;
    }
    const next = await updateConfig((cfg) => {
      cfg.graph.siteId = siteId;
      cfg.graph.siteName = siteName ?? null;
      cfg.graph.listId = listId;
      cfg.graph.listName = listName ?? null;
      cfg.graph.columnMapping = {
        title,
        start,
        end: end ?? '',
        location: location ?? '',
        description: description ?? '',
      };
      return cfg;
    });
    res.json(next.graph.columnMapping);
  })
);

router.post(
  '/admin/graph/test-connection',
  asyncHandler(async (_req, res) => {
    try {
      await getGraphAccessToken();
    } catch (err) {
      res.json({ ok: false, step: 'token', error: (err as Error).message });
      return;
    }

    const { siteId, listId } = getConfig().graph;
    if (!siteId) {
      res.json({ ok: false, step: 'site', error: 'No SharePoint site selected yet' });
      return;
    }
    try {
      await listListsForSite(siteId);
    } catch (err) {
      res.json({ ok: false, step: 'site', error: (err as Error).message });
      return;
    }

    if (!listId) {
      res.json({ ok: false, step: 'list', error: 'No list selected yet' });
      return;
    }
    try {
      await fetchListItems(siteId, listId);
    } catch (err) {
      res.json({ ok: false, step: 'items', error: (err as Error).message });
      return;
    }

    res.json({ ok: true });
  })
);

router.get('/admin/settings/events-interval', (_req, res) => {
  res.json({ refreshIntervalSeconds: getConfig().graph.refreshIntervalSeconds });
});

router.put(
  '/admin/settings/events-interval',
  asyncHandler(async (req, res) => {
    const { seconds } = req.body as { seconds?: number };
    if (!Number.isInteger(seconds) || (seconds as number) < 30) {
      res.status(400).json({ error: 'seconds must be an integer >= 30' });
      return;
    }
    const next = await updateConfig((cfg) => {
      cfg.graph.refreshIntervalSeconds = seconds as number;
      return cfg;
    });
    res.json({ refreshIntervalSeconds: next.graph.refreshIntervalSeconds });
  })
);

export default router;
