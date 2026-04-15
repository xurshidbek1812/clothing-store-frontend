import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'clothing_shop_auth';
const LAST_ACTIVITY_KEY = 'clothing_shop_last_activity';
const INACTIVITY_LIMIT = 10 * 60 * 1000;

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

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [activeStoreId, setActiveStoreIdState] = useState('');
  const [bootstrapped, setBootstrapped] = useState(false);

  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const persist = (nextToken, nextUser, nextActiveStoreId) => {
    writeStoredAuth({
      token: nextToken,
      user: nextUser,
      activeStoreId: nextActiveStoreId,
    });
  };

  const logout = () => {
    clearLogoutTimer();
    setToken(null);
    setUser(null);
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

  const login = (payload) => {
    const nextToken = payload?.token || null;
    const nextUser = payload?.user || null;
    const nextStores = nextUser?.stores || [];
    const nextActiveStoreId = nextStores[0]?.id || '';

    setToken(nextToken);
    setUser(nextUser);
    setActiveStoreIdState(nextActiveStoreId);

    persist(nextToken, nextUser, nextActiveStoreId);
    updateLastActivity();
    scheduleAutoLogout();
  };

  const setActiveStoreId = (storeId) => {
    setActiveStoreIdState(storeId);

    const stored = readStoredAuth();
    if (stored?.token && stored?.user) {
      persist(stored.token, stored.user, storeId);
    }

    updateLastActivity();
    scheduleAutoLogout();
  };

  useEffect(() => {
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

    const restoredStores = stored.user?.stores || [];
    const restoredActiveStoreId =
      stored.activeStoreId || restoredStores[0]?.id || '';

    setToken(stored.token);
    setUser(stored.user);
    setActiveStoreIdState(restoredActiveStoreId);

    persist(stored.token, stored.user, restoredActiveStoreId);
    updateLastActivity();
    scheduleAutoLogout();
    setBootstrapped(true);
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

  const stores = user?.stores || [];
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