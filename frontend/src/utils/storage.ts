const isBrowser = typeof window !== 'undefined';

export const storage = {
    get<T>(key: string, fallback?: T): T | null {
        if (!isBrowser) return fallback ?? null;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : (fallback ?? null);
        } catch {
            return fallback ?? null;
        }
    },

    set<T>(key: string, value: T): void {
        if (!isBrowser) return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Storage full or unavailable
        }
    },

    remove(key: string): void {
        if (!isBrowser) return;
        localStorage.removeItem(key);
    },

    clear(): void {
        if (!isBrowser) return;
        localStorage.clear();
    },
};

export const sessionStore = {
    get<T>(key: string, fallback?: T): T | null {
        if (!isBrowser) return fallback ?? null;
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : (fallback ?? null);
        } catch {
            return fallback ?? null;
        }
    },

    set<T>(key: string, value: T): void {
        if (!isBrowser) return;
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Storage full or unavailable
        }
    },

    remove(key: string): void {
        if (!isBrowser) return;
        sessionStorage.removeItem(key);
    },
};

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'tb_access_token',
    REFRESH_TOKEN: 'tb_refresh_token',
    USER: 'tb_user',
    REMEMBER_ME: 'tb_remember_me',
    SIDEBAR_COLLAPSED: 'tb_sidebar_collapsed',
} as const;
