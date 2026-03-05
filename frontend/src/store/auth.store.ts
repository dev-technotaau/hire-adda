import { create } from 'zustand';
import type { User } from '@/types/auth';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * Auth store — enterprise httpOnly cookie edition.
 *
 * Tokens are NEVER stored in JavaScript-accessible storage.
 * They live exclusively in httpOnly cookies managed by the BFF layer.
 *
 * This store only tracks:
 *   - User object (cached in localStorage for quick hydration)
 *   - isAuthenticated flag (derived from the `tb_auth_session` cookie)
 *   - Loading/hydrated state
 */

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  /** Timestamp of last storeLogin() call — used to skip re-verification right after login */
  lastLoginAt: number;

  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => void;
}

/** Check if the non-httpOnly session indicator cookie exists */
function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('tb_auth_session=1');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isHydrated: false,
  lastLoginAt: 0,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      storage.set(STORAGE_KEYS.USER, user);
    } else {
      storage.remove(STORAGE_KEYS.USER);
    }
  },

  login: (user) => {
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      isHydrated: true,
      lastLoginAt: Date.now(),
    });

    // Cache user for quick hydration
    storage.set(STORAGE_KEYS.USER, user);
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    storage.remove(STORAGE_KEYS.USER);
  },

  setLoading: (isLoading) => set({ isLoading }),

  hydrate: () => {
    // Check the non-httpOnly session cookie to know if we're authenticated
    const hasSession = hasSessionCookie();

    if (!hasSession) {
      // No session cookie → not authenticated
      storage.remove(STORAGE_KEYS.USER);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
      });
      return;
    }

    // Session cookie exists → restore cached user for instant UI
    const user = storage.get<User>(STORAGE_KEYS.USER);

    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      isHydrated: true,
    });
  },
}));
