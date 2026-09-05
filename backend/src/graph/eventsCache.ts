import { EventsResponse } from '../../../shared/types';
import { getConfig } from '../config/configStore';
import { log } from '../lib/log';
import { mapListItemsToEvents } from './eventMapper';
import { fetchListItems } from './sharePointLists';

interface CacheState {
  events: EventsResponse['events'];
  fetchedAt: string | null;
  stale: boolean;
}

let state: CacheState = { events: [], fetchedAt: null, stale: false };

export async function refreshEvents(): Promise<void> {
  const { graph } = getConfig();
  if (!graph.siteId || !graph.listId || !graph.columnMapping) {
    state = { events: [], fetchedAt: null, stale: false };
    return;
  }

  try {
    const items = await fetchListItems(graph.siteId, graph.listId);
    const events = mapListItemsToEvents(items, graph.columnMapping);
    state = { events, fetchedAt: new Date().toISOString(), stale: false };
  } catch (err) {
    log.error('Failed to refresh events from Microsoft Graph', err);
    state = { ...state, stale: state.fetchedAt !== null };
  }
}

export function getEventsResponse(): EventsResponse {
  const { refreshIntervalSeconds } = getConfig().graph;
  return {
    generatedAt: new Date().toISOString(),
    dataAsOf: state.fetchedAt,
    stale: state.stale,
    refreshIntervalSeconds,
    events: state.events,
  };
}
