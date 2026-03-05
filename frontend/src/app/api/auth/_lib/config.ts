/**
 * BFF (Backend-For-Frontend) configuration.
 * These values are only available server-side in Next.js Route Handlers.
 */

/** Backend URL for server-side calls (never exposed to client) */
export const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

/** Shared secret for CSRF bypass on server-to-server calls */
export const BFF_SECRET = process.env.BFF_SECRET || '';

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'tb_access_token',
  REFRESH_TOKEN: 'tb_refresh_token',
  /** Non-httpOnly flag so client JS can detect auth state */
  AUTH_SESSION: 'tb_auth_session',
  REMEMBER_ME: 'tb_remember_me',
  /** Non-httpOnly session ID for "Current session" badge in UI */
  SESSION_ID: 'tb_session_id',
} as const;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const daysToSeconds = (days: number) => days * 24 * 60 * 60;

/** Cookie maxAge in days — read from env, fallback to defaults */
const ACCESS_MAX_AGE_DAYS = parseInt(process.env.COOKIE_ACCESS_MAX_AGE_DAYS || '7', 10);
const REFRESH_MAX_AGE_DAYS = parseInt(process.env.COOKIE_REFRESH_MAX_AGE_DAYS || '30', 10);

export function accessTokenCookieOptions(rememberMe = true) {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    ...(rememberMe ? { maxAge: daysToSeconds(ACCESS_MAX_AGE_DAYS) } : {}), // seconds (Next.js cookies API)
  };
}

export function refreshTokenCookieOptions(rememberMe = true) {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    ...(rememberMe ? { maxAge: daysToSeconds(REFRESH_MAX_AGE_DAYS) } : {}),
  };
}

export function sessionCookieOptions(rememberMe = true) {
  return {
    httpOnly: false,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    ...(rememberMe ? { maxAge: daysToSeconds(ACCESS_MAX_AGE_DAYS) } : {}),
  };
}
