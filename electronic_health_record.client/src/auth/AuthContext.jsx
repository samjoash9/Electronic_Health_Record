import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, logout as apiLogout, getSession } from '../api/auth.api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session?.user) setUser(session.user);
    setLoading(false);
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
