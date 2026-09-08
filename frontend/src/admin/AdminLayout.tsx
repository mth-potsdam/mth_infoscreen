import { NavLink, Outlet } from 'react-router-dom';
import { useLogout } from '../api/queries';

export default function AdminLayout() {
  const logout = useLogout();

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <div className="admin-nav__title">Infoscreen-Verwaltung</div>
        <NavLink to="/admin" end>
          Standort &amp; Haltestellen
        </NavLink>
        <NavLink to="/admin/transit-interval">Abfahrten-Einstellungen</NavLink>
        <NavLink to="/admin/events">Microsoft 365</NavLink>
        <NavLink to="/admin/events-interval">Veranstaltungen-Einstellungen</NavLink>
        <button className="admin-nav__logout" onClick={() => logout.mutate()}>
          Abmelden
        </button>
      </nav>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
