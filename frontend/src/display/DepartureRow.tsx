import type { Departure } from '../../../shared/types';

function formatTime(iso: string | null): string {
  if (!iso) return '--:--';
  // Always render in the facility's own timezone — see EventRow.tsx.
  return new Date(iso).toLocaleTimeString('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DepartureRow({ departure }: { departure: Departure }) {
  const delayMinutes = departure.delaySeconds ? Math.round(departure.delaySeconds / 60) : 0;
  return (
    <div className={`departure-row ${departure.cancelled ? 'departure-row--cancelled' : ''}`}>
      <span className="departure-row__line">{departure.line}</span>
      <span className="departure-row__direction">
        {departure.direction}
        <span className="departure-row__stop">{departure.stopName}</span>
      </span>
      <span className="departure-row__time">
        {formatTime(departure.when)}
        {delayMinutes > 0 && <span className="departure-row__delay">+{delayMinutes}</span>}
      </span>
    </div>
  );
}
