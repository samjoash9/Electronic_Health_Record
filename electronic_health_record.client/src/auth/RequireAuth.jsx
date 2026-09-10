import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLES, isSuperAdmin } from '../lib/constants';

// eslint-disable-next-line react-refresh/only-export-components -- shared helper, co-located with the guard that uses it
// Accepts a user, not a bare role: a superadmin is not tied to one station, so
// they skip the station picker and land on the dashboard instead.
export function homeRouteFor(user) {
  const role = typeof user === 'string' ? user : user?.role;
  if (isSuperAdmin(user)) return '/dashboard';
  if (role === ROLES.ADMIN) return '/stations';
  if (role === ROLES.DOCTOR) return '/station3';
  if (role === ROLES.PATIENT) return '/my-record';
  return '/login';
}

// allowSuperAdmin: let a superadmin through a route whose `allow` list is for
// another role — they oversee every station, not just the admin ones.
export function RequireAuth({ allow, requireSuperAdmin, allowSuperAdmin, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allow && !allow.includes(user.role) && !(allowSuperAdmin && isSuperAdmin(user))) {
    return <Navigate to={homeRouteFor(user)} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin(user)) {
    return <Navigate to={homeRouteFor(user)} replace />;
  }

  return children ?? <Outlet />;
}
