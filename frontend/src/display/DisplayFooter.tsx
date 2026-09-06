import { useEffect, useState } from 'react';

const TIME_ZONE = 'Europe/Berlin';

export default function DisplayFooter() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayDate = now.toLocaleDateString('de-DE', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const time = now.toLocaleTimeString('de-DE', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <footer className="display-footer">
      <span className="display-footer__date">{dayDate}</span>
      <span className="display-footer__clock">{time}</span>
    </footer>
  );
}
