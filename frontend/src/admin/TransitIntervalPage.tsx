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
      <h1>Departures Refresh Interval</h1>
      <div className="admin-field-row">
        <input
          type="number"
          min={10}
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        />
        <span>seconds</span>
        <button onClick={() => save.mutate(seconds)} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {save.isSuccess && <p className="admin-success">Interval saved.</p>}
    </div>
  );
}
