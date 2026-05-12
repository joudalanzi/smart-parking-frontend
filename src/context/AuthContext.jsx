import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('userToken'));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('userProfile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) {
      localStorage.setItem('userToken', data.token);
      setToken(data.token);
    }
    if (data?.user) {
      localStorage.setItem('userProfile', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  }, []);

  const signup = useCallback(async (body) => {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    if (data?.token) {
      localStorage.setItem('userToken', data.token);
      setToken(data.token);
    }
    if (data?.user) {
      localStorage.setItem('userProfile', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userProfile');
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      if (data?.user) {
        localStorage.setItem('userProfile', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch {
      logout();
    }
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoggedIn: !!token,
      login,
      signup,
      logout,
      refreshMe,
    }),
    [user, token, login, signup, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
