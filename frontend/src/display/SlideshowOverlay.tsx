import { SlideshowMediaItem } from '../../../shared/types';

interface SlideshowOverlayProps {
  item: SlideshowMediaItem;
  onAdvance: () => void;
}

export default function SlideshowOverlay({ item, onAdvance }: SlideshowOverlayProps) {
  return (
    <div className="slideshow-overlay">
      {item.type === 'image' ? (
        // key={item.id} forces a remount on item change — swapping `src` on an
        // already-mounted element doesn't reliably restart playback/refire
        // load events across browsers.
        <img
          key={item.id}
          className="slideshow-overlay__media"
          src={`/api/media/${item.filename}`}
          alt=""
          onError={onAdvance}
        />
      ) : (
        <video
          key={item.id}
          className="slideshow-overlay__media"
          src={`/api/media/${item.filename}`}
          autoPlay
          muted
          playsInline
          onEnded={onAdvance}
          onError={onAdvance}
        />
      )}
    </div>
  );
}
