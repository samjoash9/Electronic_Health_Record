import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLES, isSuperAdmin } from '../lib/constants';

// eslint-disable-next-line react-refresh/only-export-components -- shared helper, co-located with the guard that uses it
export function homeRouteFor(role) {
  if (role === ROLES.ADMIN) return '/stations';
  if (role === ROLES.DOCTOR) return '/station3';
  if (role === ROLES.PATIENT) return '/my-record';
  return '/login';
}

export function RequireAuth({ allow, requireSuperAdmin, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={homeRouteFor(user.role)} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin(user)) {
    return <Navigate to={homeRouteFor(user.role)} replace />;
  }

  return children ?? <Outlet />;
}
