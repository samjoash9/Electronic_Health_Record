import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUser } from '../services/auth/auth';

export default function ProtectedRoute({
    allowedRoles = null,
    allowedPrincipalTypes = null,
}) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const location = useLocation();

    useEffect(() => {
        let isMounted = true;

        const checkAuthentication = async () => {
            const token = localStorage.getItem('token');

            // No token = not logged in
            if (!token) {
                if (isMounted) {
                    setIsLoading(false);
                }

                return;
            }

            try {
                const data = await getUser();

                console.log('Protected Route User:', data);

                if (isMounted) {
                    setUser(data);
                }
            } catch (error) {
                console.error(
                    'Authentication check failed:',
                    error
                );

                // Invalid/expired token
                localStorage.removeItem('token');

                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        checkAuthentication();

        return () => {
            isMounted = false;
        };
    }, []);

    // =========================================================
    // LOADING
    // =========================================================

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />

                    <p className="text-sm text-slate-500">
                        Checking authentication...
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // NOT AUTHENTICATED
    // =========================================================
 
    if (!user) {
        return (
            <Navigate
                to="/"
                replace
                state={{ from: location }}
            />
        );
    }

    // =========================================================
    // ROLE CHECK
    // =========================================================

    const userRole =
        user?.role ??
        user?.Role ??
        null;

    const principalType =
        user?.principalType ??
        user?.PrincipalType ??
        null;

    // Check allowed roles
    if (
        allowedRoles &&
        !allowedRoles.includes(userRole)
    ) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    // Check allowed principal types
    if (
        allowedPrincipalTypes &&
        !allowedPrincipalTypes.includes(principalType)
    ) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    // =========================================================
    // AUTHENTICATED + AUTHORIZED
    // =========================================================

    return <Outlet />;
}