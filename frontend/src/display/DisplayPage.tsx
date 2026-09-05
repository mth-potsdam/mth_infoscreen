import DeparturesPanel from './DeparturesPanel';
import './display.css';
import EventsPanel from './EventsPanel';

export default function DisplayPage() {
  return (
    <div className="display-grid">
      <DeparturesPanel />
      <EventsPanel />
    </div>
  );
}
