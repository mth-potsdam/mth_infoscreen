import { useEffect, useRef } from 'react';
import { useDepartures } from '../api/queries';
import DepartureRow from './DepartureRow';
import StaleBadge from './StaleBadge';

const SCROLL_PIXELS_PER_SECOND = 22;
const PAUSE_AT_EDGE_MS = 4000;

// Slowly auto-scrolls the departures list from top to bottom (there's no
// user around to scroll it manually on a kiosk), pausing briefly at each
// end, then jumps back to the top and repeats. Uses overflow: hidden rather
// than a real scrollbar — scrollTop still works, it just isn't visible or
// user-draggable, which is what we want here.
function useAutoScroll(ref: React.RefObject<HTMLElement>, resetKey: unknown) {
  useEffect(() => {
    let rafId: number;
    let phase: 'pause-top' | 'scrolling' | 'pause-bottom' = 'pause-top';
    let phaseStart: number | null = null;
    let lastTimestamp: number | null = null;
    // scrollTop is an integer DOM property that rounds on every write, so
    // accumulating sub-pixel-per-frame increments directly into it never
    // moves it at all (~0.37px/frame at 22px/s and 60fps rounds straight
    // back to 0 every time). Track the precise position separately instead.
    let scrollPosition = 0;

    function tick(timestamp: number) {
      const el = ref.current;
      if (!el) return;

      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 1) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (phaseStart === null) phaseStart = timestamp;

      if (phase !== 'scrolling') {
        if (timestamp - phaseStart >= PAUSE_AT_EDGE_MS) {
          if (phase === 'pause-bottom') {
            scrollPosition = 0;
            el.scrollTop = 0;
          }
          phase = phase === 'pause-top' ? 'scrolling' : 'pause-top';
          phaseStart = timestamp;
          lastTimestamp = timestamp;
        }
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (lastTimestamp === null) lastTimestamp = timestamp;
      const deltaSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      scrollPosition += SCROLL_PIXELS_PER_SECOND * deltaSeconds;

      if (scrollPosition >= maxScroll) {
        scrollPosition = maxScroll;
        el.scrollTop = scrollPosition;
        phase = 'pause-bottom';
        phaseStart = timestamp;
      } else {
        el.scrollTop = scrollPosition;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
}

export default function DeparturesPanel() {
  const { data, isLoading, isError, error } = useDepartures();
  const bodyRef = useRef<HTMLDivElement>(null);
  useAutoScroll(bodyRef, data?.departures.length);

  return (
    <section className="panel panel--departures">
      <header className="panel__header">
        <h2>Abfahrten</h2>
        {data && <StaleBadge dataAsOf={data.dataAsOf} stale={data.stale} />}
      </header>
      <div className="panel__body" ref={bodyRef}>
        {isLoading && <p className="panel__empty">Abfahrten werden geladen…</p>}
        {!data && !isLoading && isError && (
          <p className="panel__empty">
            Abfahrten konnten nicht geladen werden: {(error as Error)?.message}
          </p>
        )}
        {data && data.departures.length === 0 && (
          <p className="panel__empty">Keine bevorstehenden Abfahrten</p>
        )}
        {data?.departures.map((departure, index) => (
          <DepartureRow
            key={`${departure.stopId}-${departure.line}-${departure.when}-${index}`}
            departure={departure}
          />
        ))}
      </div>
      <p className="panel__attribution">
        Fahrplandaten:{' '}
        <a href="https://transitous.org/sources/" target="_blank" rel="noreferrer">
          transitous.org
        </a>
        , ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap-Mitwirkende
        </a>
      </p>
    </section>
  );
}
