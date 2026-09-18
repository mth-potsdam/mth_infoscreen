import { fetchWithTimeout } from '../lib/httpFetch';

interface GraphCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export function getGraphCredentials(): GraphCredentials | null {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    return null;
  }
  return { tenantId, clientId, clientSecret };
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

export async function getGraphAccessToken(): Promise<string> {
  const credentials = getGraphCredentials();
  if (!credentials) {
    throw new Error(
      'Microsoft Graph ist noch nicht konfiguriert (GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET in der .env-Datei setzen)'
    );
  }

  const now = Date.now();
  if (cached && cached.expiresAt - 60_000 > now) {
    return cached.accessToken;
  }

  const tokenUrl = `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
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
    throw new Error(`Graph-Token-Anfrage fehlgeschlagen: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return cached.accessToken;
}
