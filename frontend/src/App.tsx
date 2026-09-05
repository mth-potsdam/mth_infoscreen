import { Route, Routes } from 'react-router-dom';
import AdminApp from './admin/AdminApp';
import DisplayPage from './display/DisplayPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DisplayPage />} />
      <Route path="/admin/*" element={<AdminApp />} />
    </Routes>
  );
}
