import { createContext, useCallback, useMemo, useState } from 'react';
import { login as apiLogin, logout as apiLogout, getSession } from '../api/auth.api';

// eslint-disable-next-line react-refresh/only-export-components -- co-located with its provider by design
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession()?.user ?? null);
  const [loading] = useState(false);

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
