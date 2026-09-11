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
// `station` is the device's stored choice, and it applies to admins only --
// stations 1-2 are a property of the tablet. A doctor's desk is a property of
// their account, assigned by an admin at onboarding, so it is read off the user
// and the device's choice is ignored for them.
//
// A doctor with no station is a row that should not exist (the column is
// required), so this is a safety net rather than a supported state.
// eslint-disable-next-line react-refresh/only-export-components -- route helper, co-located with the guards that use it
export function homeRouteFor(user, station) {
  if (isSuperAdmin(user)) return '/dashboard';

  const role = normalizedRole(user);

  if (role === ROLES.DOCTOR) {
    return user?.station ? `/station${user.station}` : '/no-station';
  }

  if (!station && role === ROLES.ADMIN) {
    return '/stations';
  }

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
// people, so a doctor assigned to one desk must not reach another by typing its
// URL -- the sidebar hiding the link is not enough on its own.
//
// The comparison is against the station on the doctor's account, so unlike the
// old device-storage check it cannot be defeated by editing localStorage.
//
// A superadmin supervises every desk at once and so is exempt. This is still a
// UX guard, not an authorization boundary: the API accepts any station's
// submission from any authenticated doctor.
export function RequireStation({ station, children }) {
  const { user } = useAuth();

  if (isSuperAdmin(user)) return children ?? <Outlet />;

  const role = normalizedRole(user);
  const assigned = role === ROLES.DOCTOR ? user?.station : readStation(role);

  if (assigned !== station) {
    return <Navigate to={homeRouteFor(user, assigned)} replace />;
  }

  return children ?? <Outlet />;
}
