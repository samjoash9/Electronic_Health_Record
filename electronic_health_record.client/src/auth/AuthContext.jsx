import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  getSession,
  fetchCurrentUser,
} from '../services/authService';
import { clearSession } from '../lib/session';
import { beginSignOut, endSignOut } from '../hooks/useUnsavedChangesGuard';

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

  // endSignOut() here rather than at the end of signOut: a fresh sign-in is
  // what actually re-arms the guard. Without it, a user who signs out and
  // straight back in inside the same tab keeps the blocker disabled and loses
  // the unsaved-changes prompt on every station form.
  const signIn = useCallback(async (credentials) => {
    const session = await apiLogin(credentials);
    endSignOut();
    setUser(session.user);
    return session.user;
  }, []);

  // beginSignOut() before the await, not after: the unsaved-changes blocker
  // must already be standing down by the time the caller navigates to /login,
  // which happens in the same tick this promise resolves. It is never reset --
  // signing out ends in a full remount at /login, and leaving it set keeps a
  // dirty station form from blocking the redirect that follows.
  const signOut = useCallback(async () => {
    beginSignOut();
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), signIn, signOut, loading }),
    [user, signIn, signOut, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
