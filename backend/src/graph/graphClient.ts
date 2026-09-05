import { fetchWithTimeout } from '../lib/httpFetch';
import { getGraphAccessToken } from './graphAuth';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export async function graphGet<T>(path: string): Promise<T> {
  const token = await getGraphAccessToken();
  const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path}`;
  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}
