import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminSession } from '../api/queries';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { data, isLoading } = useAdminSession();
  const location = useLocation();

  if (isLoading) {
    return <div className="admin-loading">Loading…</div>;
  }
  if (!data?.authenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
