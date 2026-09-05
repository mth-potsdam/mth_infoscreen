import { getConfig } from '../config/configStore';
import { decrypt } from '../lib/crypto';
import { fetchWithTimeout } from '../lib/httpFetch';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
  tenantId: string;
  clientId: string;
}

let cached: CachedToken | null = null;

export function invalidateGraphToken(): void {
  cached = null;
}

export async function getGraphAccessToken(): Promise<string> {
  const { graph } = getConfig();
  if (!graph.tenantId || !graph.clientId || !graph.clientSecretEncrypted) {
    throw new Error('Microsoft Graph is not configured yet');
  }

  const now = Date.now();
  if (
    cached &&
    cached.tenantId === graph.tenantId &&
    cached.clientId === graph.clientId &&
    cached.expiresAt - 60_000 > now
  ) {
    return cached.accessToken;
  }

  const clientSecret = decrypt(graph.clientSecretEncrypted);
  const tokenUrl = `https://login.microsoftonline.com/${graph.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: graph.clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetchWithTimeout(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph token request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
    tenantId: graph.tenantId,
    clientId: graph.clientId,
  };
  return cached.accessToken;
}
