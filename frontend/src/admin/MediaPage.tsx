import { useEffect, useState } from 'react';
import {
  useDeleteMedia,
  useMediaItems,
  useReorderMedia,
  useSaveSlideshowItemDuration,
  useSaveSlideshowOverviewDuration,
  useSlideshowItemDuration,
  useSlideshowOverviewDuration,
  useUploadMedia,
} from '../api/queries';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,video/mp4';

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

export default function MediaPage() {
  const mediaItems = useMediaItems();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const reorderMedia = useReorderMedia();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const currentOverview = useSlideshowOverviewDuration();
  const saveOverview = useSaveSlideshowOverviewDuration();
  const [overviewSeconds, setOverviewSeconds] = useState(300);

  const currentItem = useSlideshowItemDuration();
  const saveItem = useSaveSlideshowItemDuration();
  const [itemSeconds, setItemSeconds] = useState(8);

  useEffect(() => {
    if (currentOverview.data) {
      setOverviewSeconds(currentOverview.data.overviewDurationSeconds);
    }
  }, [currentOverview.data]);

  useEffect(() => {
    if (currentItem.data) {
      setItemSeconds(currentItem.data.itemDurationSeconds);
    }
  }, [currentItem.data]);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadErrors([]);
    const errors: string[] = [];
    for (const file of files) {
      try {
        await uploadMedia.mutateAsync(file);
      } catch (err) {
        errors.push(`${file.name}: ${(err as Error).message}`);
      }
    }
    setUploadErrors(errors);
    setIsUploading(false);
  }

  function moveItem(index: number, direction: -1 | 1) {
    const items = mediaItems.data;
    if (!items) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    reorderMedia.mutate(ids);
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`"${name}" wirklich löschen?`)) return;
    deleteMedia.mutate(id);
  }

  return (
    <div className="admin-page">
      <h1>Medien hochladen</h1>
      <p className="admin-attribution">
        Bilder (JPG, PNG, WebP, max. 20 MB) und Videos (MP4, max. 200 MB).
      </p>
      <input
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={handleFilesSelected}
        disabled={isUploading}
      />
      {isUploading && <p>Wird hochgeladen…</p>}
      {uploadErrors.map((error) => (
        <p key={error} className="admin-error">
          {error}
        </p>
      ))}

      <h1>Hochgeladene Medien</h1>
      {mediaItems.isLoading && <p>Wird geladen…</p>}
      {mediaItems.data && mediaItems.data.length === 0 && <p>Noch keine Medien hochgeladen.</p>}
      <ul className="admin-media-list">
        {mediaItems.data?.map((item, index) => (
          <li key={item.id} className="admin-media-item">
            {item.type === 'image' ? (
              <img
                className="admin-media-thumb"
                src={`/api/media/${item.filename}`}
                alt={item.originalName}
              />
            ) : (
              <video
                className="admin-media-thumb"
                src={`/api/media/${item.filename}`}
                muted
                playsInline
                preload="metadata"
              />
            )}
            <div className="admin-media-item__info">
              <div className="admin-media-item__name">{item.originalName}</div>
              <div className="admin-media-item__meta">
                {item.type === 'image' ? 'Bild' : 'Video'} · {formatSize(item.sizeBytes)}
              </div>
            </div>
            <div className="admin-media-item__actions">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0 || reorderMedia.isPending}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === (mediaItems.data?.length ?? 0) - 1 || reorderMedia.isPending}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id, item.originalName)}
                disabled={deleteMedia.isPending}
              >
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h1>Anzeigedauer der Übersicht</h1>
      <p className="admin-attribution">
        Wie lange die normale Anzeige (Abfahrten &amp; Veranstaltungen) gezeigt wird, bevor im
        Vollbildmodus zur Diashow gewechselt wird.
      </p>
      <div className="admin-field-row">
        <input
          type="number"
          min={30}
          value={overviewSeconds}
          onChange={(e) => setOverviewSeconds(Number(e.target.value))}
        />
        <span>Sekunden</span>
        <button
          onClick={() => saveOverview.mutate(overviewSeconds)}
          disabled={saveOverview.isPending}
        >
          {saveOverview.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      {saveOverview.isSuccess && <p className="admin-success">Anzeigedauer gespeichert.</p>}

      <h1>Anzeigedauer je Bild</h1>
      <p className="admin-attribution">
        Wie lange jedes Bild in der Diashow gezeigt wird. Videos spielen stattdessen bis zu ihrem
        eigenen Ende.
      </p>
      <div className="admin-field-row">
        <input
          type="number"
          min={3}
          value={itemSeconds}
          onChange={(e) => setItemSeconds(Number(e.target.value))}
        />
        <span>Sekunden</span>
        <button onClick={() => saveItem.mutate(itemSeconds)} disabled={saveItem.isPending}>
          {saveItem.isPending ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      {saveItem.isSuccess && <p className="admin-success">Anzeigedauer gespeichert.</p>}
    </div>
  );
}
