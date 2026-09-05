import { useEffect, useState } from 'react';
import { useEventsInterval, useSaveEventsInterval } from '../api/queries';

export default function EventsIntervalPage() {
  const current = useEventsInterval();
  const save = useSaveEventsInterval();
  const [seconds, setSeconds] = useState(300);

  useEffect(() => {
    if (current.data) {
      setSeconds(current.data.refreshIntervalSeconds);
    }
  }, [current.data]);

  return (
    <div className="admin-page">
      <h1>Events Refresh Interval</h1>
      <div className="admin-field-row">
        <input
          type="number"
          min={30}
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
