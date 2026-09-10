import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getUser } from '../services/auth/auth';

export default function PublicOnlyRoute() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkAuthentication = async () => {
            const token = localStorage.getItem('token');

            // No token = user can access login
            if (!token) {
                if (isMounted) {
                    setIsAuthenticated(false);
                    setIsLoading(false);
                }

                return;
            }

            try {
                // Verify that the token is still valid
                await getUser();

                if (isMounted) {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                // Token is invalid/expired
                localStorage.removeItem('token');

                if (isMounted) {
                    setIsAuthenticated(false);
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

    // Still checking authentication
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

    // Already authenticated
    // Don't allow access to login/landing page
    if (isAuthenticated) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    // Not authenticated
    return <Outlet />;
}