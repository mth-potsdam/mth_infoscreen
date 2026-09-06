import { useEffect, useState } from 'react';
import {
  useGraphColumns,
  useGraphLists,
  useGraphSettings,
  useGraphSites,
  useSaveGraphMapping,
  useSaveGraphSettings,
  useTestGraphConnection,
} from '../api/queries';

const MAPPING_FIELDS = ['title', 'start', 'end', 'location', 'description'] as const;
type MappingField = (typeof MAPPING_FIELDS)[number];

const MAPPING_FIELD_LABELS: Record<MappingField, string> = {
  title: 'Titel',
  start: 'Beginn',
  end: 'Ende',
  location: 'Ort',
  description: 'Beschreibung',
};

const TEST_STEP_LABELS: Record<string, string> = {
  token: 'Anmeldung',
  site: 'Website',
  list: 'Liste',
  items: 'Einträge',
};

export default function GraphSettingsPage() {
  const settings = useGraphSettings();
  const saveSettings = useSaveGraphSettings();
  const saveMapping = useSaveGraphMapping();
  const testConnection = useTestGraphConnection();

  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const [siteSearch, setSiteSearch] = useState('');
  const [siteId, setSiteId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('');
  const [listId, setListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');
  const [mapping, setMapping] = useState<Record<MappingField, string>>({
    title: '',
    start: '',
    end: '',
    location: '',
    description: '',
  });

  const sites = useGraphSites(siteSearch, siteSearch.length > 1);
  const lists = useGraphLists(siteId);
  const columns = useGraphColumns(siteId, listId);

  useEffect(() => {
    if (settings.data) {
      setTenantId(settings.data.tenantId);
      setClientId(settings.data.clientId);
      setSiteId(settings.data.siteId);
      setSiteName(settings.data.siteName ?? '');
      setListId(settings.data.listId);
      setListName(settings.data.listName ?? '');
      if (settings.data.columnMapping) {
        setMapping(settings.data.columnMapping);
      }
    }
  }, [settings.data]);

  async function handleSaveCredentials() {
    await saveSettings.mutateAsync({ tenantId, clientId, clientSecret: clientSecret || undefined });
    setClientSecret('');
  }

  async function handleSaveMapping() {
    if (!siteId || !listId) return;
    await saveMapping.mutateAsync({ siteId, siteName, listId, listName, ...mapping });
  }

  return (
    <div className="admin-page">
      <h1>Microsoft-365-Verbindung</h1>
      <label>
        Mandanten-ID
        <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
      </label>
      <label>
        Client-ID (App)
        <input value={clientId} onChange={(e) => setClientId(e.target.value)} />
      </label>
      <label>
        Client-Secret {settings.data?.hasClientSecret && '(leer lassen, um aktuelles beizubehalten)'}
        <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
      </label>
      <button onClick={handleSaveCredentials} disabled={saveSettings.isPending}>
        {saveSettings.isPending ? 'Wird gespeichert…' : 'Zugangsdaten speichern'}
      </button>

      <h2>SharePoint-Website &amp; Liste</h2>
      <label>
        Websites suchen
        <input
          value={siteSearch}
          onChange={(e) => setSiteSearch(e.target.value)}
          placeholder="Websitename…"
        />
      </label>
      <ul className="admin-pick-list">
        {sites.data?.map((site) => (
          <li key={site.id}>
            <button
              className={site.id === siteId ? 'admin-pick--active' : ''}
              onClick={() => {
                setSiteId(site.id);
                setSiteName(site.name);
                setListId(null);
              }}
            >
              {site.name}
            </button>
          </li>
        ))}
      </ul>

      {siteId && (
        <>
          <h3>Listen in {siteName}</h3>
          <ul className="admin-pick-list">
            {lists.data?.map((list) => (
              <li key={list.id}>
                <button
                  className={list.id === listId ? 'admin-pick--active' : ''}
                  onClick={() => {
                    setListId(list.id);
                    setListName(list.name);
                  }}
                >
                  {list.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {listId && columns.data && (
        <div className="admin-mapping">
          <h3>Spaltenzuordnung</h3>
          {MAPPING_FIELDS.map((field) => (
            <label key={field}>
              {MAPPING_FIELD_LABELS[field]}
              <select
                value={mapping[field]}
                onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}
              >
                <option value="">--</option>
                {columns.data.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.displayName}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button onClick={handleSaveMapping} disabled={saveMapping.isPending}>
            {saveMapping.isPending ? 'Wird gespeichert…' : 'Zuordnung speichern'}
          </button>
        </div>
      )}

      <h2>Verbindungstest</h2>
      <button onClick={() => testConnection.mutate()} disabled={testConnection.isPending}>
        {testConnection.isPending ? 'Wird getestet…' : 'Verbindung testen'}
      </button>
      {testConnection.data && (
        <p className={testConnection.data.ok ? 'admin-success' : 'admin-error'}>
          {testConnection.data.ok
            ? 'Verbindung erfolgreich.'
            : `Fehler bei Schritt „${TEST_STEP_LABELS[testConnection.data.step ?? ''] ?? testConnection.data.step}": ${testConnection.data.error}`}
        </p>
      )}
    </div>
  );
}
