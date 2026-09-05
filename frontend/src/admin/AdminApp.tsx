import { Route, Routes } from 'react-router-dom';
import './admin.css';
import AdminLayout from './AdminLayout';
import AdminLoginPage from './AdminLoginPage';
import AuthGuard from './AuthGuard';
import EventsIntervalPage from './EventsIntervalPage';
import GraphSettingsPage from './GraphSettingsPage';
import LocationStopsPage from './LocationStopsPage';
import TransitIntervalPage from './TransitIntervalPage';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route
        path="*"
        element={
          <AuthGuard>
            <AdminLayout />
          </AuthGuard>
        }
      >
        <Route index element={<LocationStopsPage />} />
        <Route path="transit-interval" element={<TransitIntervalPage />} />
        <Route path="events" element={<GraphSettingsPage />} />
        <Route path="events-interval" element={<EventsIntervalPage />} />
      </Route>
    </Routes>
  );
}
