import { GraphColumn, GraphList, GraphSite } from '../../../shared/types';
import { graphGet } from './graphClient';

interface GraphSiteRaw {
  id: string;
  displayName?: string;
  name?: string;
  webUrl: string;
}

interface GraphListRaw {
  id: string;
  displayName?: string;
  name?: string;
  list?: { template?: string };
}

interface GraphColumnRaw {
  name: string;
  displayName: string;
  hidden?: boolean;
  readOnly?: boolean;
}

interface GraphListItemRaw {
  id: string;
  fields?: Record<string, unknown>;
}

export interface ListItemRecord {
  id: string;
  fields: Record<string, unknown>;
}

export async function searchSites(query: string): Promise<GraphSite[]> {
  const q = query.trim();
  const path = `/sites?search=${encodeURIComponent(q || '*')}`;
  const data = await graphGet<{ value: GraphSiteRaw[] }>(path);
  return data.value.map((site) => ({
    id: site.id,
    name: site.displayName ?? site.name ?? site.webUrl,
    webUrl: site.webUrl,
  }));
}

export async function listListsForSite(siteId: string): Promise<GraphList[]> {
  const data = await graphGet<{ value: GraphListRaw[] }>(
    `/sites/${encodeURIComponent(siteId)}/lists`
  );
  return data.value
    .filter((list) => list.list?.template === 'genericList')
    .map((list) => ({ id: list.id, name: list.displayName ?? list.name ?? list.id }));
}

export async function listColumnsForList(siteId: string, listId: string): Promise<GraphColumn[]> {
  const data = await graphGet<{ value: GraphColumnRaw[] }>(
    `/sites/${encodeURIComponent(siteId)}/lists/${encodeURIComponent(listId)}/columns`
  );
  return data.value
    .filter((col) => !col.hidden && !col.readOnly)
    .map((col) => ({ name: col.name, displayName: col.displayName }));
}

export async function fetchListItems(siteId: string, listId: string): Promise<ListItemRecord[]> {
  const items: ListItemRecord[] = [];
  let path: string | null =
    `/sites/${encodeURIComponent(siteId)}/lists/${encodeURIComponent(listId)}/items?expand=fields&$top=200`;

  while (path) {
    const data: { value: GraphListItemRaw[]; '@odata.nextLink'?: string } = await graphGet(path);
    for (const item of data.value) {
      if (item.fields) {
        items.push({ id: item.id, fields: item.fields });
      }
    }
    path = data['@odata.nextLink'] ?? null;
  }

  return items;
}
