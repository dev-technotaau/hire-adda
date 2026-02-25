import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { APP_CONFIG, API_BASE_URL } from '@/constants/config';
import { API } from '@/constants/api';
import { storage, sessionStore, STORAGE_KEYS } from '@/utils/storage';
import type { ApiError } from '@/types/api';
import { useMaintenanceStore } from '@/store/maintenance.store';

/** Raw error body shape returned by the backend — supports both legacy and new formats */
interface RawErrorBody {
    status?: string;
    message?: string;
    error?: {
        message?: string;
        code?: string;
        requestId?: string;
        details?: unknown;
        estimatedReturnTime?: string;
    };
    errors?: Record<string, string[]> | unknown;
}

const api = axios.create({
    baseURL: APP_CONFIG.apiUrl,
    timeout: 30000,
    withCredentials: true, // Required for CSRF httpOnly cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

// CSRF token management (stored in memory only — never localStorage)
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<string | null> | null = null;
const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'];

async function fetchCsrfToken(): Promise<string | null> {
    try {
        // CSRF endpoint is /api/csrf-token (not under /api/v1/)
        const { data } = await axios.get(`${API_BASE_URL}/csrf-token`, {
            withCredentials: true,
        });
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch {
        return null;
    }
}

async function ensureCsrfToken(): Promise<string | null> {
    if (csrfToken) return csrfToken;
    // Deduplicate concurrent fetches
    if (!csrfFetchPromise) {
        csrfFetchPromise = fetchCsrfToken().finally(() => { csrfFetchPromise = null; });
    }
    return csrfFetchPromise;
}

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else if (token) {
            resolve(token);
        }
    });
    failedQueue = [];
}

// Request interceptor: attach auth token + CSRF token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN) ?? sessionStore.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Attach CSRF token on state-changing requests
        if (config.method && MUTATION_METHODS.includes(config.method.toLowerCase())) {
            const csrf = await ensureCsrfToken();
            if (csrf && config.headers) {
                config.headers['x-csrf-token'] = csrf;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with token refresh, 429 with retry-after
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _rateLimitRetry?: boolean; _csrfRetry?: boolean };

        // Handle 403 CSRF token mismatch — re-fetch token and retry once
        if (error.response?.status === 403 && !originalRequest._csrfRetry) {
            const errorData = error.response.data as RawErrorBody;
            const isCsrfError = errorData?.error?.code === 'EBADCSRFTOKEN' || errorData?.message?.toLowerCase().includes('csrf');
            if (isCsrfError) {
                originalRequest._csrfRetry = true;
                csrfToken = null; // Invalidate cached token
                const newToken = await fetchCsrfToken();
                if (newToken && originalRequest.headers) {
                    originalRequest.headers['x-csrf-token'] = newToken;
                }
                return api(originalRequest);
            }
        }

        // Handle 429 Too Many Requests — wait and retry once
        if (error.response?.status === 429 && !originalRequest._rateLimitRetry) {
            originalRequest._rateLimitRetry = true;
            const retryAfter = Number(error.response.headers['retry-after']) || 5;
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return api(originalRequest);
        }

        // Handle 503 Service Unavailable — maintenance mode
        if (error.response?.status === 503) {
            const errorData = error.response.data as RawErrorBody;
            if (errorData?.error?.code === 'MAINTENANCE_MODE') {
                useMaintenanceStore.getState().setMaintenanceMode(
                    true,
                    errorData?.error?.message,
                    errorData?.error?.estimatedReturnTime
                );
            }
            return Promise.reject(transformError(error));
        }

        // If 401 and not a refresh request itself
        if (error.response?.status === 401 && !originalRequest._retry) {
            const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN) ?? sessionStore.get<string>(STORAGE_KEYS.REFRESH_TOKEN);

            // No refresh token — clear auth and redirect
            if (!refreshToken) {
                clearAuth();
                return Promise.reject(transformError(error));
            }

            if (isRefreshing) {
                // Queue this request while refresh is in progress
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Include CSRF token so the refresh call isn't blocked by CSRF middleware
                const csrf = await ensureCsrfToken();
                const { data } = await axios.post(
                    `${APP_CONFIG.apiUrl}${API.AUTH.REFRESH_TOKEN}`,
                    { refreshToken },
                    {
                        withCredentials: true,
                        headers: csrf ? { 'x-csrf-token': csrf } : {},
                    }
                );

                const newAccessToken = data.data.accessToken;
                const newRefreshToken = data.data.refreshToken;

                // Respect the rememberMe flag when storing refreshed tokens
                const remembered = storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME) ?? true;
                const activeStore = remembered ? storage : sessionStore;
                activeStore.set(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
                Cookies.set(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken, {
                    expires: remembered ? 7 : undefined,
                    secure: true,
                    sameSite: 'strict',
                });
                if (newRefreshToken) {
                    activeStore.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
                }

                processQueue(null, newAccessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAuth();
                return Promise.reject(transformError(error));
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(transformError(error));
    }
);

function transformError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
        const data = error.response.data as RawErrorBody;
        // Support both legacy { message } and new { error: { message, code } } shapes
        const message = data.error?.message || data.message || 'An unexpected error occurred';
        const code = data.error?.code;
        const requestId = data.error?.requestId;

        return {
            status: (data.status as ApiError['status']) || 'error',
            message,
            statusCode: error.response.status,
            errors: data.errors || data.error?.details,
            ...(code && { code }),
            ...(requestId && { requestId }),
        };
    }

    if (error.code === 'ECONNABORTED') {
        return { status: 'error', message: 'Request timed out. Please try again.', statusCode: 408 };
    }

    if (!error.response) {
        return { status: 'error', message: 'Network error. Please check your connection.', statusCode: 0 };
    }

    return {
        status: 'error',
        message: 'An unexpected error occurred',
        statusCode: error.response?.status || 500,
    };
}

const protectedPrefixes = ['/candidate', '/employer', '/admin', '/super-admin', '/notifications'];
const adminPrefixes = ['/admin', '/super-admin'];

let clearAuthPending = false;

function clearAuth() {
    // Clear both localStorage and sessionStorage
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER);
    sessionStore.remove(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStore.remove(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStore.remove(STORAGE_KEYS.USER);
    Cookies.remove(STORAGE_KEYS.ACCESS_TOKEN);

    if (typeof window !== 'undefined' && !clearAuthPending) {
        const path = window.location.pathname;
        const isProtected = protectedPrefixes.some((p) => path.startsWith(p));
        const isAdminRoute = adminPrefixes.some((p) => path.startsWith(p));

        // Don't redirect if already on a login page
        if (isProtected && !path.startsWith('/auth/') && !path.startsWith('/portal/')) {
            clearAuthPending = true;
            // Admin routes redirect to portal login, others to auth login
            const loginUrl = isAdminRoute ? '/portal/login' : '/auth/login';
            window.location.href = `${loginUrl}?redirect=${encodeURIComponent(path)}`;
        }
    }
}

// Cross-tab auth synchronization
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEYS.ACCESS_TOKEN && !event.newValue) {
            clearAuth();
        }
    });
}

export default api;
