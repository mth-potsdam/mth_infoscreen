import { useEffect, useState } from 'react';
import {
  useDeparturesInterval,
  useDeparturesMaxPerStop,
  useSaveDeparturesInterval,
  useSaveDeparturesMaxPerStop,
} from '../api/queries';

export default function TransitIntervalPage() {
  const current = useDeparturesInterval();
  const save = useSaveDeparturesInterval();
  const [seconds, setSeconds] = useState(60);

  const currentMaxPerStop = useDeparturesMaxPerStop();
  const saveMaxPerStop = useSaveDeparturesMaxPerStop();
  const [maxPerStop, setMaxPerStop] = useState(5);

  useEffect(() => {
    if (current.data) {
      setSeconds(current.data.refreshIntervalSeconds);
    }
  }, [current.data]);

  useEffect(() => {
    if (currentMaxPerStop.data) {
      setMaxPerStop(currentMaxPerStop.data.maxDeparturesPerStop);
    }
  }, [currentMaxPerStop.data]);

  return (
    <div className="admin-page">
      <h1>Aktualisierungsintervall der Abfahrten</h1>
      <div className="admin-field-row">
        <input
          type="number"
          min={10}
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        />
        <span>Sekunden</span>
        <button onClick={() => save.mutate(seconds)} disabled={save.isPending}>
          {save.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      {save.isSuccess && <p className="admin-success">Intervall gespeichert.</p>}

      <h1>Maximale Anzahl Abfahrten pro Haltestelle</h1>
      <p className="admin-attribution">
        Wie viele Abfahrten je Haltestellengruppe höchstens gleichzeitig auf dem Infoscreen
        angezeigt werden (1–50).
      </p>
      <div className="admin-field-row">
        <input
          type="number"
          min={1}
          max={50}
          value={maxPerStop}
          onChange={(e) => setMaxPerStop(Number(e.target.value))}
        />
        <span>Abfahrten</span>
        <button
          onClick={() => saveMaxPerStop.mutate(maxPerStop)}
          disabled={saveMaxPerStop.isPending}
        >
          {saveMaxPerStop.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      {saveMaxPerStop.isSuccess && <p className="admin-success">Anzahl gespeichert.</p>}
    </div>
  );
}
