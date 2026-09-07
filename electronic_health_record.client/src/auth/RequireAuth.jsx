import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLE_HOME_PATH, isSuperAdmin } from '../lib/constants';

function normalizedRole(user) {
    return typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role;
}

export function homeRouteFor(user) {
    return ROLE_HOME_PATH[normalizedRole(user)] ?? '/login';
}

export function RequireAuth({ allow = null, requireSuperAdmin = false }) {
    const { user, isAuthenticated, loading } = useAuth();
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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    const role = normalizedRole(user);

    if (allow && !allow.map((r) => r.toLowerCase()).includes(role)) {
        console.warn('RequireAuth: role check failed', { role, user });
        return <Navigate to={homeRouteFor(user)} replace />;
    }

    if (requireSuperAdmin && !isSuperAdmin(user)) {
        console.warn('RequireAuth: superadmin check failed', { user });
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}