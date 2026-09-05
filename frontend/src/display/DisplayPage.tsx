import { useEffect } from 'react';
import DeparturesPanel from './DeparturesPanel';
import './display.css';
import EventsPanel from './EventsPanel';

export default function DisplayPage() {
  useEffect(() => {
    document.body.classList.add('kiosk');
    return () => document.body.classList.remove('kiosk');
  }, []);

  return (
    <div className="display-grid">
      <DeparturesPanel />
      <EventsPanel />
    </div>
  );
}
