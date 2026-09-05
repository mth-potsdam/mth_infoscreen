interface StaleBadgeProps {
  dataAsOf: string | null;
  stale: boolean;
}

export default function StaleBadge({ dataAsOf, stale }: StaleBadgeProps) {
  if (!dataAsOf) {
    return <span className="stale-badge stale-badge--loading">Loading…</span>;
  }
  const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(dataAsOf).getTime()) / 60000));
  const label = minutesAgo === 0 ? 'just now' : `${minutesAgo} min ago`;
  return (
    <span className={`stale-badge ${stale ? 'stale-badge--stale' : ''}`}>Updated {label}</span>
  );
}
