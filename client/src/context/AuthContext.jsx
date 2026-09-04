import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('devpilot_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  const persist = (data) => {
    localStorage.setItem('devpilot_token', data.token);
    const { token, ...userWithoutToken } = data;
    localStorage.setItem('devpilot_user', JSON.stringify(userWithoutToken));
    setUser(userWithoutToken);
  };

  useEffect(() => {
    const token = localStorage.getItem('devpilot_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .getMe()
      .then((freshUser) => {
        localStorage.setItem('devpilot_user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        localStorage.removeItem('devpilot_token');
        localStorage.removeItem('devpilot_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    persist(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    persist(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('devpilot_token');
    localStorage.removeItem('devpilot_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('devpilot_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser, isAuthenticated: Boolean(user) }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
