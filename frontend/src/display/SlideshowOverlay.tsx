import { useEffect, useRef, useState } from 'react';
import { SlideshowMediaItem } from '../../../shared/types';

interface SlideshowOverlayProps {
  item: SlideshowMediaItem;
  onAdvance: () => void;
}

type Slot = 0 | 1;

// A slow file (mainly video, over a slower network) shouldn't hold the
// previous item frozen on screen indefinitely — force the cross-fade after
// this grace period even if the new item hasn't reported ready yet.
const READY_FALLBACK_MS = 2500;

export default function SlideshowOverlay({ item, onAdvance }: SlideshowOverlayProps) {
  // Two stacked layers cross-fade via CSS opacity instead of swapping a
  // single element — the outgoing layer stays fully visible (and its video,
  // if any, keeps playing) until the incoming layer reports it has actually
  // decoded a frame, so there's never a gap where only the black background
  // shows between items.
  const [slotItems, setSlotItems] = useState<[SlideshowMediaItem, SlideshowMediaItem | null]>([
    item,
    null,
  ]);
  const [activeSlot, setActiveSlot] = useState<Slot>(0);
  const videoRefs = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null]);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSlotItems((prev) => {
      if (prev[activeSlot]?.id === item.id) return prev;
      const nextSlot: Slot = activeSlot === 0 ? 1 : 0;
      const next: [SlideshowMediaItem, SlideshowMediaItem | null] = [...prev];
      next[nextSlot] = item;
      return next;
    });
    clearTimeout(readyTimeoutRef.current);
    readyTimeoutRef.current = setTimeout(() => {
      setActiveSlot((current) => (current === 0 ? 1 : 0));
    }, READY_FALLBACK_MS);
    return () => clearTimeout(readyTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  useEffect(() => {
    // Pause whichever slot just became inactive so it can't keep playing —
    // or fire its own `ended` — once it's faded out.
    const inactive: Slot = activeSlot === 0 ? 1 : 0;
    videoRefs.current[inactive]?.pause();
  }, [activeSlot]);

  function handleReady(slot: Slot, slotItemId: string) {
    if (slotItemId !== item.id) return; // stale event from an already-replaced slot
    clearTimeout(readyTimeoutRef.current);
    setActiveSlot(slot);
  }

  return (
    <div className="slideshow-overlay">
      {([0, 1] as Slot[]).map((slot) => {
        const slotItem = slotItems[slot];
        if (!slotItem) return null;
        const isActive = slot === activeSlot;
        return (
          <div
            key={slot}
            className={`slideshow-overlay__layer${isActive ? ' slideshow-overlay__layer--visible' : ''}`}
          >
            {slotItem.type === 'image' ? (
              <img
                key={slotItem.id}
                className="slideshow-overlay__media"
                src={`/api/media/${slotItem.filename}`}
                alt=""
                onLoad={() => handleReady(slot, slotItem.id)}
                onError={() => {
                  handleReady(slot, slotItem.id);
                  if (isActive) onAdvance();
                }}
              />
            ) : (
              <video
                key={slotItem.id}
                ref={(el) => {
                  videoRefs.current[slot] = el;
                }}
                className="slideshow-overlay__media"
                src={`/api/media/${slotItem.filename}`}
                autoPlay
                muted
                playsInline
                onLoadedData={() => handleReady(slot, slotItem.id)}
                onEnded={() => isActive && onAdvance()}
                onError={() => {
                  handleReady(slot, slotItem.id);
                  if (isActive) onAdvance();
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
