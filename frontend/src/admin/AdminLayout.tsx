import { NavLink, Outlet } from 'react-router-dom';
import { useLogout } from '../api/queries';

export default function AdminLayout() {
  const logout = useLogout();

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <div className="admin-nav__title">Infoscreen Admin</div>
        <NavLink to="/admin" end>
          Location &amp; Stops
        </NavLink>
        <NavLink to="/admin/transit-interval">Transit Interval</NavLink>
        <NavLink to="/admin/events">Microsoft 365</NavLink>
        <NavLink to="/admin/events-interval">Events Interval</NavLink>
        <button className="admin-nav__logout" onClick={() => logout.mutate()}>
          Log out
        </button>
      </nav>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
