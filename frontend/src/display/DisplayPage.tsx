import { useEffect } from 'react';
import DeparturesPanel from './DeparturesPanel';
import './display.css';
import DisplayHeader from './DisplayHeader';
import EventsPanel from './EventsPanel';

export default function DisplayPage() {
  useEffect(() => {
    document.body.classList.add('kiosk');
    return () => document.body.classList.remove('kiosk');
  }, []);

  return (
    <div className="display-page">
      <DisplayHeader />
      <div className="display-grid">
        <DeparturesPanel />
        <EventsPanel />
      </div>
    </div>
  );
}
