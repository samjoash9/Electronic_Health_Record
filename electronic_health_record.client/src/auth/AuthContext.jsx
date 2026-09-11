import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  getSession,
  fetchCurrentUser,
} from '../services/authService';
import { clearSession } from '../lib/session';

// eslint-disable-next-line react-refresh/only-export-components -- co-located with its provider by design
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession()?.user ?? null);
  // Only block routing on a server round-trip when there is a stored session
  // to re-validate. An anonymous visitor has nothing to check and must not be
  // stuck behind a spinner.
  const [loading, setLoading] = useState(() => Boolean(getSession()));

  useEffect(() => {
    if (!getSession()) return undefined;

    let cancelled = false;

    fetchCurrentUser()
      .then((serverUser) => {
        if (cancelled) return;
        // The server is the source of truth for station/role: this is what
        // stops a hand-edited localStorage session from moving a doctor
        // between stations.
        setUser(serverUser);
      })
      .catch((error) => {
        if (cancelled) return;
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          // The session really is invalid -- sign out.
          clearSession();
          setUser(null);
        }
        // Otherwise (network error, 5xx) the server hiccuped, not the
        // session. Keep the stale user rather than signing them out --
        // losing your session over a server blip is worse than the
        // stale-station risk, which the route guards already handle safely.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const session = await apiLogin(credentials);
    setUser(session.user);
    return session.user;
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), signIn, signOut, loading }),
    [user, signIn, signOut, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
