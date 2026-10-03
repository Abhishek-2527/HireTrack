import { useCallback, useEffect, useMemo, useState } from 'react';
import { extractUser, getCurrentUser, login, logout, register } from '../services/authService';
import { AuthContext } from './authContextInstance';
const TOKEN_KEY = 'hiretrack_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((nextToken) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      return;
    }

    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const refreshSession = useCallback(async (authToken = token) => {
    if (!authToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser(authToken);
      setUser(extractUser(response));
    } catch {
      persistToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [persistToken, token]);

  useEffect(() => {
    const timeoutId = setTimeout(() => refreshSession(token), 0);
    return () => clearTimeout(timeoutId);
  }, [refreshSession, token]);

  const handleLogin = useCallback(async (formData) => {
    const response = await login(formData);
    persistToken(response.token);
    setToken(response.token);
    setUser(extractUser(response));
    return response;
  }, [persistToken]);

  const handleRegister = useCallback(async (formData) => {
    const response = await register(formData);
    persistToken(response.token);
    setToken(response.token);
    setUser(extractUser(response));
    return response;
  }, [persistToken]);

  const handleLogout = useCallback(async () => {
    try {
      if (token) {
        await logout(token);
      }
    } catch {
      // Graceful failure: still remove local state
    } finally {
      persistToken(null);
      setToken(null);
      setUser(null);
    }
  }, [persistToken, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      refreshSession,
    }),
    [user, token, loading, handleLogin, handleRegister, handleLogout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
