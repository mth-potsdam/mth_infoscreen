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

interface LineStyle {
  background: string;
  color: string;
}

// VBB's official line colors for these product families.
const BUS_STYLE: LineStyle = { background: '#713077', color: '#fff' };
const SBAHN_STYLE: LineStyle = { background: '#3f8335', color: '#fff' };
const REGIO_STYLE: LineStyle = { background: '#ef2713', color: '#fff' };
const DEFAULT_STYLE: LineStyle = { background: 'var(--mth-green-light)', color: 'var(--mth-green-dark)' };

const LINE_STYLES_BY_PRODUCT: Record<string, LineStyle> = {
  BUS: BUS_STYLE,
  COACH: BUS_STYLE,
  SUBURBAN: SBAHN_STYLE,
  RAIL: REGIO_STYLE,
  REGIONAL_RAIL: REGIO_STYLE,
  REGIONAL_FAST_RAIL: REGIO_STYLE,
  LONG_DISTANCE: REGIO_STYLE,
  HIGHSPEED_RAIL: REGIO_STYLE,
  NIGHT_RAIL: REGIO_STYLE,
};

function lineStyleForProduct(product: string): LineStyle {
  return LINE_STYLES_BY_PRODUCT[product] ?? DEFAULT_STYLE;
}

export default function DepartureRow({ departure }: { departure: Departure }) {
  const delayMinutes = departure.delaySeconds ? Math.round(departure.delaySeconds / 60) : 0;
  const lineStyle = lineStyleForProduct(departure.product);
  return (
    <div className={`departure-row ${departure.cancelled ? 'departure-row--cancelled' : ''}`}>
      <span
        className="departure-row__line"
        style={{ backgroundColor: lineStyle.background, color: lineStyle.color }}
      >
        {departure.line}
      </span>
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
