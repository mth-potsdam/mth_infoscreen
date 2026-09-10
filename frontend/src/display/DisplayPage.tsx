import { useEffect, useRef, useState } from 'react';
import { useSlideshow } from '../api/queries';
import DeparturesPanel from './DeparturesPanel';
import './display.css';
import DisplayFooter from './DisplayFooter';
import DisplayHeader from './DisplayHeader';
import EventsPanel from './EventsPanel';
import SlideshowOverlay from './SlideshowOverlay';
import './slideshow.css';

type Phase = 'normal' | 'slideshow';

export default function DisplayPage() {
  const { data: slideshow } = useSlideshow();
  const items = slideshow?.items ?? [];
  // Effects below read from this ref instead of closing over `items`
  // directly, so a background refetch that leaves the list unchanged never
  // has to restart an in-flight timer.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [phase, setPhase] = useState<Phase>('normal');
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  useEffect(() => {
    document.body.classList.add('kiosk');
    return () => document.body.classList.remove('kiosk');
  }, []);

  function advance() {
    setSlideshowIndex((i) => {
      const next = i + 1;
      if (next >= itemsRef.current.length) {
        setPhase('normal');
        return 0;
      }
      return next;
    });
  }

  const overviewDurationSeconds = slideshow?.overviewDurationSeconds;
  const itemDurationSeconds = slideshow?.itemDurationSeconds;

  // Normal phase: after the configured overview duration, take over the
  // screen with the slideshow from the start — only if there's anything to show.
  useEffect(() => {
    if (phase !== 'normal' || items.length === 0 || overviewDurationSeconds === undefined) return;
    const timer = setTimeout(() => {
      setSlideshowIndex(0);
      setPhase('slideshow');
    }, overviewDurationSeconds * 1000);
    return () => clearTimeout(timer);
  }, [phase, items.length, overviewDurationSeconds]);

  // Slideshow phase: images advance on a fixed timer; videos advance via
  // their own `ended` event instead (SlideshowOverlay's onAdvance prop).
  useEffect(() => {
    if (phase !== 'slideshow' || itemDurationSeconds === undefined) return;
    const current = itemsRef.current[slideshowIndex];
    if (!current || current.type !== 'image') return;
    const timer = setTimeout(advance, itemDurationSeconds * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, slideshowIndex, itemDurationSeconds]);

  // If the admin empties the library mid-slideshow, fall back to normal.
  useEffect(() => {
    if (phase === 'slideshow' && items.length === 0) {
      setPhase('normal');
    }
  }, [phase, items.length]);

  const currentItem = phase === 'slideshow' ? items[slideshowIndex] : undefined;

  return (
    <div className="display-page">
      <DisplayHeader />
      <div className="display-grid">
        <DeparturesPanel />
        <EventsPanel />
      </div>
      <DisplayFooter />
      {phase === 'slideshow' && currentItem && (
        <SlideshowOverlay item={currentItem} onAdvance={advance} />
      )}
    </div>
  );
}
