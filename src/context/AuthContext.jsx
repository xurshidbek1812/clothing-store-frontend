import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'clothing_shop_auth';
const LAST_ACTIVITY_KEY = 'clothing_shop_last_activity';
const INACTIVITY_LIMIT = 10 * 60 * 1000;
const API_BASE_URL = 'http://127.0.0.1:5050/api';

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return safeParse(raw);
}

function writeStoredAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

function updateLastActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

function getLastActivity() {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  return raw ? Number(raw) : 0;
}

async function fetchStores(token) {
  const response = await fetch(`${API_BASE_URL}/stores`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Do'konlarni yuklab bo'lmadi");
  }

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [activeStoreId, setActiveStoreIdState] = useState('');
  const [bootstrapped, setBootstrapped] = useState(false);

  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const persist = (nextToken, nextUser, nextStores, nextActiveStoreId) => {
    writeStoredAuth({
      token: nextToken,
      user: nextUser,
      stores: nextStores,
      activeStoreId: nextActiveStoreId,
    });
  };

  const logout = () => {
    clearLogoutTimer();
    setToken(null);
    setUser(null);
    setStores([]);
    setActiveStoreIdState('');
    clearStoredAuth();
  };

  const scheduleAutoLogout = () => {
    clearLogoutTimer();

    const lastActivity = getLastActivity();
    const now = Date.now();
    const passed = now - lastActivity;
    const remaining = Math.max(INACTIVITY_LIMIT - passed, 0);

    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, remaining);
  };

  const registerActivity = () => {
    if (!token) return;
    updateLastActivity();
    scheduleAutoLogout();
  };

  const refreshStores = async (forcedToken) => {
    const authToken = forcedToken || token;
    if (!authToken) return [];

    try {
      const fetchedStores = await fetchStores(authToken);

      setStores(fetchedStores);

      setActiveStoreIdState((prev) => {
        const nextActiveStoreId = fetchedStores.some((store) => store.id === prev)
          ? prev
          : fetchedStores[0]?.id || '';

        const stored = readStoredAuth();
        const storedUser = stored?.user || user;

        if (storedUser) {
          persist(authToken, storedUser, fetchedStores, nextActiveStoreId);
        }

        return nextActiveStoreId;
      });

      return fetchedStores;
    } catch (error) {
      console.error('refreshStores error:', error);
      return [];
    }
  };

  const login = async (payload) => {
    const nextToken = payload?.token || null;
    const nextUser = payload?.user || null;

    setToken(nextToken);
    setUser(nextUser);

    let nextStores = [];
    try {
      if (nextToken) {
        nextStores = await fetchStores(nextToken);
      }
    } catch (error) {
      console.error('login fetchStores error:', error);
      nextStores = nextUser?.stores || [];
    }

    const nextActiveStoreId = nextStores[0]?.id || '';

    setStores(nextStores);
    setActiveStoreIdState(nextActiveStoreId);

    persist(nextToken, nextUser, nextStores, nextActiveStoreId);
    updateLastActivity();
    scheduleAutoLogout();
  };

  const setActiveStoreId = (storeId) => {
    setActiveStoreIdState(storeId);

    const stored = readStoredAuth();
    const nextToken = stored?.token || token;
    const nextUser = stored?.user || user;
    const nextStores = stored?.stores || stores;

    if (nextToken && nextUser) {
      persist(nextToken, nextUser, nextStores, storeId);
    }

    updateLastActivity();
    scheduleAutoLogout();
  };

  useEffect(() => {
    const bootstrap = async () => {
      const stored = readStoredAuth();

      if (!stored?.token || !stored?.user) {
        setBootstrapped(true);
        return;
      }

      const lastActivity = getLastActivity();
      const expired = !lastActivity || Date.now() - lastActivity > INACTIVITY_LIMIT;

      if (expired) {
        clearStoredAuth();
        setBootstrapped(true);
        return;
      }

      setToken(stored.token);
      setUser(stored.user);

      const restoredStores = stored.stores || stored.user?.stores || [];
      setStores(restoredStores);

      const restoredActiveStoreId =
        stored.activeStoreId || restoredStores[0]?.id || '';

      setActiveStoreIdState(restoredActiveStoreId);

      persist(stored.token, stored.user, restoredStores, restoredActiveStoreId);
      updateLastActivity();
      scheduleAutoLogout();

      try {
        const fetchedStores = await fetchStores(stored.token);

        const nextActiveStoreId = fetchedStores.some(
          (store) => store.id === restoredActiveStoreId
        )
          ? restoredActiveStoreId
          : fetchedStores[0]?.id || '';

        setStores(fetchedStores);
        setActiveStoreIdState(nextActiveStoreId);
        persist(stored.token, stored.user, fetchedStores, nextActiveStoreId);
      } catch (error) {
        console.error('bootstrap fetchStores error:', error);
      }

      setBootstrapped(true);
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!token) return;

    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

    const handleActivity = () => {
      registerActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && !e.newValue) {
        logout();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorage);
    };
  }, [token]);

  useEffect(() => {
    return () => clearLogoutTimer();
  }, []);

  const selectedStore =
    stores.find((store) => store.id === activeStoreId) || stores[0] || null;

  const value = useMemo(
    () => ({
      token,
      user,
      stores,
      activeStoreId,
      selectedStore,
      isAuthenticated: Boolean(token && user),
      bootstrapped,
      login,
      logout,
      setActiveStoreId,
      registerActivity,
      refreshStores,
    }),
    [token, user, stores, activeStoreId, selectedStore, bootstrapped]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}