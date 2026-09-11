import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLES, ROLE_HOME_PATH, isSuperAdmin } from '../lib/constants';
import { readStation } from '../lib/stationStorage';

function normalizedRole(user) {
    return typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role;
}

// Accepts a user, not a bare role: a superadmin is not tied to one station, so
// they skip the station picker and land on the dashboard instead.
//
// `station` is passed in rather than read here so this stays a pure function --
// callers that know the device's station (HomeRedirect, LoginPage) supply it.
//
// Admins and doctors both work one desk at a time, so a device with no station
// chosen yet is sent to pick one before it shows any work. They differ in where
// they go once it is known: a doctor opens their station's queue, while an admin
// gets the dashboard, their overview across stations 1-2.
// eslint-disable-next-line react-refresh/only-export-components -- route helper, co-located with the guards that use it
export function homeRouteFor(user, station) {
  if (isSuperAdmin(user)) return '/dashboard';

  const role = normalizedRole(user);

  if (!station && (role === ROLES.ADMIN || role === ROLES.DOCTOR)) {
    return '/stations';
  }

  if (role === ROLES.DOCTOR) return `/station${station}`;

  return ROLE_HOME_PATH[role] ?? '/login';
}

// Where to send someone who is signed in but on the wrong route. Reads the
// stored station so redirects land on the desk this device is actually set to.
function fallbackRouteFor(user) {
  return homeRouteFor(user, readStation(normalizedRole(user)));
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
    return <Navigate to={fallbackRouteFor(user)} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin(user)) {
    return <Navigate to={fallbackRouteFor(user)} replace />;
  }

  return children ?? <Outlet />;
}

// Pins a route to one station. Doctors across stations 3-5 are different
// people, so a doctor set to one desk must not reach another by typing its
// URL -- the sidebar hiding the link is not enough on its own.
//
// A superadmin supervises every desk at once and so is exempt. This is a UX
// guard, not an authorization boundary: the API still accepts any station's
// submission from any authenticated doctor.
export function RequireStation({ station, children }) {
  const { user } = useAuth();

  if (isSuperAdmin(user)) return children ?? <Outlet />;

  const chosen = readStation(normalizedRole(user));

  if (chosen !== station) {
    return <Navigate to={homeRouteFor(user, chosen)} replace />;
  }

  return children ?? <Outlet />;
}
