interface StaleBadgeProps {
  dataAsOf: string | null;
  stale: boolean;
}

export default function StaleBadge({ dataAsOf, stale }: StaleBadgeProps) {
  if (!dataAsOf) {
    return <span className="stale-badge stale-badge--loading">Lädt…</span>;
  }
  const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(dataAsOf).getTime()) / 60000));
  const label = minutesAgo === 0 ? 'gerade eben' : `vor ${minutesAgo} Min.`;
  return (
    <span className={`stale-badge ${stale ? 'stale-badge--stale' : ''}`}>
      Aktualisiert {label}
    </span>
  );
}
