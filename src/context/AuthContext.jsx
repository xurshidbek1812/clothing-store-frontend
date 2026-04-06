import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [activeStoreId, setActiveStoreIdState] = useState(
    localStorage.getItem('activeStoreId') || null
  );
  const [loading, setLoading] = useState(false);

  const setSession = ({ token: newToken, user: newUser }) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    const firstStoreId = newUser?.stores?.[0]?.id || null;
    const existingStoreId = localStorage.getItem('activeStoreId');

    const validStore =
      newUser?.stores?.some((store) => store.id === existingStoreId) ? existingStoreId : firstStoreId;

    if (validStore) {
      localStorage.setItem('activeStoreId', validStore);
      setActiveStoreIdState(validStore);
    } else {
      localStorage.removeItem('activeStoreId');
      setActiveStoreIdState(null);
    }
  };

  const login = async ({ username, password }) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      setSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeStoreId');
    setToken(null);
    setUser(null);
    setActiveStoreIdState(null);
  };

  const setActiveStoreId = (storeId) => {
    localStorage.setItem('activeStoreId', storeId);
    setActiveStoreIdState(storeId);
  };

  const activeStore = user?.stores?.find((store) => store.id === activeStoreId) || null;

  useEffect(() => {
    if (!user?.stores?.length) return;

    const exists = user.stores.some((store) => store.id === activeStoreId);
    if (!exists) {
      const firstStoreId = user.stores[0].id;
      localStorage.setItem('activeStoreId', firstStoreId);
      setActiveStoreIdState(firstStoreId);
    }
  }, [user, activeStoreId]);

  const value = useMemo(
    () => ({
      token,
      user,
      activeStoreId,
      activeStore,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      logout,
      setActiveStoreId,
    }),
    [token, user, activeStoreId, activeStore, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  }

  return context;
};