import { Route, Routes } from 'react-router-dom';
import AdminApp from './admin/AdminApp';
import DisplayPage from './display/DisplayPage';
import EventOverviewPage from './display/EventOverviewPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DisplayPage />} />
      <Route path="/event-overview" element={<EventOverviewPage />} />
      <Route path="/admin/*" element={<AdminApp />} />
    </Routes>
  );
}
