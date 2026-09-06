import { useEffect, useState } from 'react';
import { useDeparturesInterval, useSaveDeparturesInterval } from '../api/queries';

export default function TransitIntervalPage() {
  const current = useDeparturesInterval();
  const save = useSaveDeparturesInterval();
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (current.data) {
      setSeconds(current.data.refreshIntervalSeconds);
    }
  }, [current.data]);

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
    </div>
  );
}
