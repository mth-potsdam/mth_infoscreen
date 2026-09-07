import { useEffect, useState } from 'react';
import {
  useDeparturesInterval,
  useDeparturesLookahead,
  useSaveDeparturesInterval,
  useSaveDeparturesLookahead,
} from '../api/queries';

export default function TransitIntervalPage() {
  const current = useDeparturesInterval();
  const save = useSaveDeparturesInterval();
  const [seconds, setSeconds] = useState(60);

  const currentLookahead = useDeparturesLookahead();
  const saveLookahead = useSaveDeparturesLookahead();
  const [lookaheadMinutes, setLookaheadMinutes] = useState(90);

  useEffect(() => {
    if (current.data) {
      setSeconds(current.data.refreshIntervalSeconds);
    }
  }, [current.data]);

  useEffect(() => {
    if (currentLookahead.data) {
      setLookaheadMinutes(currentLookahead.data.lookaheadMinutes);
    }
  }, [currentLookahead.data]);

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

      <h1>Anzeigezeitraum der Abfahrten</h1>
      <p className="admin-attribution">
        Wie viele Minuten in die Zukunft Abfahrten angezeigt werden (mind. 15, max. 360).
      </p>
      <div className="admin-field-row">
        <input
          type="number"
          min={15}
          max={360}
          value={lookaheadMinutes}
          onChange={(e) => setLookaheadMinutes(Number(e.target.value))}
        />
        <span>Minuten</span>
        <button onClick={() => saveLookahead.mutate(lookaheadMinutes)} disabled={saveLookahead.isPending}>
          {saveLookahead.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      {saveLookahead.isSuccess && <p className="admin-success">Zeitraum gespeichert.</p>}
    </div>
  );
}
