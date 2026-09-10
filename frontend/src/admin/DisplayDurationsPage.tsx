import { useEffect, useRef, useState } from 'react';
import {
  useDeparturesLookahead,
  useEventsDetailDuration,
  useEventsOverviewDuration,
  useSaveDeparturesLookahead,
  useSaveEventsDetailDuration,
  useSaveEventsOverviewDuration,
  useSaveSlideshowItemDuration,
  useSaveSlideshowOverviewDuration,
  useSlideshowItemDuration,
  useSlideshowOverviewDuration,
} from '../api/queries';

// Seeds local state from server data exactly once. Local state starts
// `undefined` and the field below isn't rendered until it's set, so there's
// no window where an admin could edit (or an automated test could fill) a
// field before its real value has loaded — which would otherwise let this
// effect's first run silently overwrite that edit once the slow-to-resolve
// request for that field finally came back.
function useSyncOnce<T>(value: T | undefined, setValue: (value: T) => void) {
  const loaded = useRef(false);
  useEffect(() => {
    if (value !== undefined && !loaded.current) {
      setValue(value);
      loaded.current = true;
    }
  }, [value, setValue]);
}

export default function DisplayDurationsPage() {
  const currentLookahead = useDeparturesLookahead();
  const saveLookahead = useSaveDeparturesLookahead();
  const [lookaheadMinutes, setLookaheadMinutes] = useState<number>();

  const currentEventsOverview = useEventsOverviewDuration();
  const saveEventsOverview = useSaveEventsOverviewDuration();
  const [eventsOverviewSeconds, setEventsOverviewSeconds] = useState<number>();

  const currentEventsDetail = useEventsDetailDuration();
  const saveEventsDetail = useSaveEventsDetailDuration();
  const [eventsDetailSeconds, setEventsDetailSeconds] = useState<number>();

  const currentSlideshowOverview = useSlideshowOverviewDuration();
  const saveSlideshowOverview = useSaveSlideshowOverviewDuration();
  const [slideshowOverviewSeconds, setSlideshowOverviewSeconds] = useState<number>();

  const currentSlideshowItem = useSlideshowItemDuration();
  const saveSlideshowItem = useSaveSlideshowItemDuration();
  const [slideshowItemSeconds, setSlideshowItemSeconds] = useState<number>();

  useSyncOnce(currentLookahead.data?.lookaheadMinutes, setLookaheadMinutes);
  useSyncOnce(currentEventsOverview.data?.overviewDurationSeconds, setEventsOverviewSeconds);
  useSyncOnce(currentEventsDetail.data?.detailDurationSeconds, setEventsDetailSeconds);
  useSyncOnce(currentSlideshowOverview.data?.overviewDurationSeconds, setSlideshowOverviewSeconds);
  useSyncOnce(currentSlideshowItem.data?.itemDurationSeconds, setSlideshowItemSeconds);

  return (
    <div className="admin-page">
      <h1>Anzeigedauer</h1>
      <p className="admin-attribution">
        Alle Einstellungen an einem Ort, die bestimmen, wie lange einzelne Ansichten auf dem
        Infoscreen gezeigt werden.
      </p>

      <h2>Abfahrten: Anzeigezeitraum</h2>
      <p className="admin-attribution">
        Wie viele Minuten in die Zukunft Abfahrten angezeigt werden (mind. 15, max. 360).
      </p>
      {lookaheadMinutes === undefined ? (
        <p>Wird geladen…</p>
      ) : (
        <div className="admin-field-row">
          <input
            type="number"
            min={15}
            max={360}
            value={lookaheadMinutes}
            onChange={(e) => setLookaheadMinutes(Number(e.target.value))}
          />
          <span>Minuten</span>
          <button
            onClick={() => saveLookahead.mutate(lookaheadMinutes)}
            disabled={saveLookahead.isPending}
          >
            {saveLookahead.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </button>
        </div>
      )}
      {saveLookahead.isSuccess && <p className="admin-success">Zeitraum gespeichert.</p>}

      <h2>Veranstaltungen: Übersicht</h2>
      <p className="admin-attribution">
        Wie lange die Veranstaltungsübersicht gezeigt wird, bevor zur Detailanzeige (falls
        konfiguriert) gewechselt wird.
      </p>
      {eventsOverviewSeconds === undefined ? (
        <p>Wird geladen…</p>
      ) : (
        <div className="admin-field-row">
          <input
            type="number"
            min={10}
            value={eventsOverviewSeconds}
            onChange={(e) => setEventsOverviewSeconds(Number(e.target.value))}
          />
          <span>Sekunden</span>
          <button
            onClick={() => saveEventsOverview.mutate(eventsOverviewSeconds)}
            disabled={saveEventsOverview.isPending}
          >
            {saveEventsOverview.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </button>
        </div>
      )}
      {saveEventsOverview.isSuccess && <p className="admin-success">Anzeigedauer gespeichert.</p>}

      <h2>Veranstaltungen: Detailansicht</h2>
      <p className="admin-attribution">
        Wie lange jede einzelne Veranstaltung mit aktivierter Detailanzeige gezeigt wird, bevor zur
        nächsten Veranstaltung bzw. zurück zur Übersicht gewechselt wird.
      </p>
      {eventsDetailSeconds === undefined ? (
        <p>Wird geladen…</p>
      ) : (
        <div className="admin-field-row">
          <input
            type="number"
            min={5}
            value={eventsDetailSeconds}
            onChange={(e) => setEventsDetailSeconds(Number(e.target.value))}
          />
          <span>Sekunden</span>
          <button
            onClick={() => saveEventsDetail.mutate(eventsDetailSeconds)}
            disabled={saveEventsDetail.isPending}
          >
            {saveEventsDetail.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </button>
        </div>
      )}
      {saveEventsDetail.isSuccess && <p className="admin-success">Anzeigedauer gespeichert.</p>}

      <h2>Diashow: Übersicht vor Wechsel</h2>
      <p className="admin-attribution">
        Wie lange die normale Anzeige (Abfahrten &amp; Veranstaltungen) gezeigt wird, bevor im
        Vollbildmodus zur Diashow gewechselt wird.
      </p>
      {slideshowOverviewSeconds === undefined ? (
        <p>Wird geladen…</p>
      ) : (
        <div className="admin-field-row">
          <input
            type="number"
            min={30}
            value={slideshowOverviewSeconds}
            onChange={(e) => setSlideshowOverviewSeconds(Number(e.target.value))}
          />
          <span>Sekunden</span>
          <button
            onClick={() => saveSlideshowOverview.mutate(slideshowOverviewSeconds)}
            disabled={saveSlideshowOverview.isPending}
          >
            {saveSlideshowOverview.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </button>
        </div>
      )}
      {saveSlideshowOverview.isSuccess && (
        <p className="admin-success">Anzeigedauer gespeichert.</p>
      )}

      <h2>Diashow: Anzeigedauer je Bild</h2>
      <p className="admin-attribution">
        Wie lange jedes Bild in der Diashow gezeigt wird. Videos spielen stattdessen bis zu ihrem
        eigenen Ende.
      </p>
      {slideshowItemSeconds === undefined ? (
        <p>Wird geladen…</p>
      ) : (
        <div className="admin-field-row">
          <input
            type="number"
            min={3}
            value={slideshowItemSeconds}
            onChange={(e) => setSlideshowItemSeconds(Number(e.target.value))}
          />
          <span>Sekunden</span>
          <button
            onClick={() => saveSlideshowItem.mutate(slideshowItemSeconds)}
            disabled={saveSlideshowItem.isPending}
          >
            {saveSlideshowItem.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </button>
        </div>
      )}
      {saveSlideshowItem.isSuccess && <p className="admin-success">Anzeigedauer gespeichert.</p>}
    </div>
  );
}
