import { useEffect, useState } from 'react';
import {
  useGraphColumns,
  useGraphLists,
  useGraphSettings,
  useGraphSites,
  useSaveGraphMapping,
  useTestGraphConnection,
} from '../api/queries';

const MAPPING_FIELDS = [
  'title',
  'start',
  'end',
  'location',
  'description',
  'visible',
  'showDetails',
] as const;
type MappingField = (typeof MAPPING_FIELDS)[number];

const MAPPING_FIELD_LABELS: Record<MappingField, string> = {
  title: 'Titel',
  start: 'Beginn',
  end: 'Ende',
  location: 'Ort',
  description: 'Beschreibung',
  visible: 'Anzeige auf Infoscreen (Ja/Nein-Feld)',
  showDetails: 'Detailanzeige (Ja/Nein-Feld)',
};

const TEST_STEP_LABELS: Record<string, string> = {
  token: 'Anmeldung',
  site: 'Website',
  list: 'Liste',
  items: 'Einträge',
};

export default function GraphSettingsPage() {
  const settings = useGraphSettings();
  const saveMapping = useSaveGraphMapping();
  const testConnection = useTestGraphConnection();

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
    visible: '',
    showDetails: '',
  });

  const sites = useGraphSites(siteSearch, siteSearch.length > 1);
  const lists = useGraphLists(siteId);
  const columns = useGraphColumns(siteId, listId);

  useEffect(() => {
    if (settings.data) {
      setSiteId(settings.data.siteId);
      setSiteName(settings.data.siteName ?? '');
      setListId(settings.data.listId);
      setListName(settings.data.listName ?? '');
      if (settings.data.columnMapping) {
        setMapping(settings.data.columnMapping);
      }
    }
  }, [settings.data]);

  async function handleSaveMapping() {
    if (!siteId || !listId) return;
    await saveMapping.mutateAsync({ siteId, siteName, listId, listName, ...mapping });
  }

  return (
    <div className="admin-page">
      <h1>Microsoft-365-Verbindung</h1>
      <p className="admin-attribution">
        Mandanten-ID, Client-ID und Client-Secret werden über die Umgebungsvariablen
        GRAPH_TENANT_ID, GRAPH_CLIENT_ID und GRAPH_CLIENT_SECRET in der .env-Datei konfiguriert,
        nicht hier im Admin-Bereich.
      </p>
      {settings.data && (
        <p className={settings.data.credentialsConfigured ? 'admin-success' : 'admin-error'}>
          {settings.data.credentialsConfigured
            ? 'Zugangsdaten sind konfiguriert.'
            : 'Zugangsdaten fehlen — GRAPH_TENANT_ID, GRAPH_CLIENT_ID und GRAPH_CLIENT_SECRET in der .env-Datei setzen und den Container neu starten.'}
        </p>
      )}

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
          <p className="admin-attribution">
            Die "Anzeige auf Infoscreen" ist optional: Wird hier ein Ja/Nein-Feld ausgewählt,
            werden nur Veranstaltungen mit dem Wert "Ja" überhaupt angezeigt — alle anderen
            bleiben vollständig ausgeblendet. Ohne Auswahl werden alle Veranstaltungen gezeigt
            (nur nach Datum gefiltert).
          </p>
          <p className="admin-attribution">
            Die "Detailanzeige" ist optional: Wird hier ein Ja/Nein-Feld ausgewählt, blendet die
            Anzeige Veranstaltungen mit dem Wert "Ja" reihum als eigene Detailseite ein (Name,
            Beginn/Ende, Ort, Beschreibung), bevor sie wieder zur Übersicht zurückkehrt. Ohne
            Auswahl wird nur die Übersicht gezeigt.
          </p>
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
