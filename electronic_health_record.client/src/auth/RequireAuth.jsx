import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLE_HOME_PATH, isSuperAdmin } from '../lib/constants';

function normalizedRole(user) {
    return typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role;
}

// Accepts a user, not a bare role: a superadmin is not tied to one station, so
// they skip the station picker and land on the dashboard instead.
export function homeRouteFor(user) {
  const role = typeof user === 'string' ? user : user?.user;
  if (isSuperAdmin(user)) return '/dashboard';
    return ROLE_HOME_PATH[normalizedRole(user)] ?? '/login';
}

// allowSuperAdmin: let a superadmin through a route whose `allow` list is for
// another role — they oversee every station, not just the admin ones.
export function RequireAuth({ allow, requireSuperAdmin, allowSuperAdmin, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allow && !allow.includes(user.role) && !(allowSuperAdmin && isSuperAdmin(user))) {
    return <Navigate to={homeRouteFor(user)} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin(user)) {
    return <Navigate to={homeRouteFor(user)} replace />;
  }

  return <Outlet />;
}