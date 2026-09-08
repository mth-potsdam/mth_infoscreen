import { useEffect, useState } from 'react';
import {
  useEventsDetailDuration,
  useEventsInterval,
  useEventsOverviewDuration,
  useSaveEventsDetailDuration,
  useSaveEventsInterval,
  useSaveEventsOverviewDuration,
} from '../api/queries';

export default function EventsIntervalPage() {
  const current = useEventsInterval();
  const save = useSaveEventsInterval();
  const [seconds, setSeconds] = useState(300);

  const currentOverview = useEventsOverviewDuration();
  const saveOverview = useSaveEventsOverviewDuration();
  const [overviewSeconds, setOverviewSeconds] = useState(60);

  const currentDetail = useEventsDetailDuration();
  const saveDetail = useSaveEventsDetailDuration();
  const [detailSeconds, setDetailSeconds] = useState(15);

  useEffect(() => {
    if (current.data) {
      setSeconds(current.data.refreshIntervalSeconds);
    }
  }, [current.data]);

  useEffect(() => {
    if (currentOverview.data) {
      setOverviewSeconds(currentOverview.data.overviewDurationSeconds);
    }
  }, [currentOverview.data]);

  useEffect(() => {
    if (currentDetail.data) {
      setDetailSeconds(currentDetail.data.detailDurationSeconds);
    }
  }, [currentDetail.data]);

  return (
    <div className="admin-page">
      <h1>Aktualisierungsintervall der Veranstaltungen</h1>
      <div className="admin-field-row">
        <input
          type="number"
          min={30}
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        />
        <span>Sekunden</span>
        <button onClick={() => save.mutate(seconds)} disabled={save.isPending}>
          {save.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      {save.isSuccess && <p className="admin-success">Intervall gespeichert.</p>}

      <h1>Anzeigedauer der Übersicht</h1>
      <p className="admin-attribution">
        Wie lange die Veranstaltungsübersicht gezeigt wird, bevor zur Detailanzeige (falls
        konfiguriert) gewechselt wird.
      </p>
      <div className="admin-field-row">
        <input
          type="number"
          min={10}
          value={overviewSeconds}
          onChange={(e) => setOverviewSeconds(Number(e.target.value))}
        />
        <span>Sekunden</span>
        <button
          onClick={() => saveOverview.mutate(overviewSeconds)}
          disabled={saveOverview.isPending}
        >
          {saveOverview.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      {saveOverview.isSuccess && <p className="admin-success">Anzeigedauer gespeichert.</p>}

      <h1>Anzeigedauer der Detailansicht</h1>
      <p className="admin-attribution">
        Wie lange jede einzelne Veranstaltung mit aktivierter Detailanzeige gezeigt wird, bevor zur
        nächsten Veranstaltung bzw. zurück zur Übersicht gewechselt wird.
      </p>
      <div className="admin-field-row">
        <input
          type="number"
          min={5}
          value={detailSeconds}
          onChange={(e) => setDetailSeconds(Number(e.target.value))}
        />
        <span>Sekunden</span>
        <button onClick={() => saveDetail.mutate(detailSeconds)} disabled={saveDetail.isPending}>
          {saveDetail.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      {saveDetail.isSuccess && <p className="admin-success">Anzeigedauer gespeichert.</p>}
    </div>
  );
}
