import { create } from 'zustand';
import Cookies from 'js-cookie';
import type { User } from '@/types/auth';
import { storage, sessionStore, STORAGE_KEYS } from '@/utils/storage';

/**
 * Resolve the active store based on `rememberMe` flag.
 * - rememberMe=true  → localStorage  (persists across browser sessions)
 * - rememberMe=false → sessionStorage (cleared when browser/tab closes)
 */
function getStore(rememberMe: boolean) {
  return rememberMe ? storage : sessionStore;
}

/** Read a key from localStorage first, fall back to sessionStorage. */
function getFromEither<T>(key: string): T | null {
  return storage.get<T>(key) ?? sessionStore.get<T>(key);
}

/** Remove a key from both storages. */
function removeFromBoth(key: string) {
  storage.remove(key);
  sessionStore.remove(key);
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  /** Timestamp of last storeLogin() call — used to skip re-verification right after login */
  lastLoginAt: number;

  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isHydrated: false,
  lastLoginAt: 0,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      const remembered = storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME) ?? true;
      getStore(remembered).set(STORAGE_KEYS.USER, user);
    } else {
      removeFromBoth(STORAGE_KEYS.USER);
    }
  },

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    const remembered = storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME) ?? true;
    const store = getStore(remembered);
    store.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    store.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    Cookies.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken, {
      expires: remembered ? 7 : undefined,
      secure: true,
      sameSite: 'strict',
    });
  },

  login: (user, accessToken, refreshToken, rememberMe = true) => {
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
      lastLoginAt: Date.now(),
    });

    // Clear the opposite storage to avoid stale data
    const store = getStore(rememberMe);
    const opposite = getStore(!rememberMe);
    opposite.remove(STORAGE_KEYS.USER);
    opposite.remove(STORAGE_KEYS.ACCESS_TOKEN);
    opposite.remove(STORAGE_KEYS.REFRESH_TOKEN);

    // Always persist rememberMe flag in localStorage so hydrate() can find it
    storage.set(STORAGE_KEYS.REMEMBER_ME, rememberMe);

    store.set(STORAGE_KEYS.USER, user);
    store.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    store.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    Cookies.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken, {
      expires: rememberMe ? 7 : undefined,
      secure: true,
      sameSite: 'strict',
    });
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    removeFromBoth(STORAGE_KEYS.USER);
    removeFromBoth(STORAGE_KEYS.ACCESS_TOKEN);
    removeFromBoth(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.REMEMBER_ME);
    Cookies.remove(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setLoading: (isLoading) => set({ isLoading }),

  hydrate: () => {
    const user = getFromEither<User>(STORAGE_KEYS.USER);
    const accessToken = getFromEither<string>(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = getFromEither<string>(STORAGE_KEYS.REFRESH_TOKEN);

    if (accessToken) {
      const remembered = storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME) ?? true;
      Cookies.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken, {
        expires: remembered ? 7 : undefined,
        secure: true,
        sameSite: 'strict',
      });
    }

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading: false,
      isHydrated: true,
    });
  },
}));
