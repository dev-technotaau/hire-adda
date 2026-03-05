import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  BACKEND_URL,
  BFF_SECRET,
  COOKIE_NAMES,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  sessionCookieOptions,
} from './config';

/**
 * Make an authenticated request to the backend, attaching the BFF secret
 * and forwarding relevant client headers.
 */
export async function backendFetch(
  path: string,
  init: RequestInit & { request?: NextRequest } = {},
): Promise<Response> {
  const { request, ...fetchInit } = init;
  const url = `${BACKEND_URL}${path}`;

  const headers = new Headers(fetchInit.headers);
  headers.set('Content-Type', 'application/json');

  // BFF secret bypasses CSRF on the backend
  if (BFF_SECRET) {
    headers.set('x-bff-secret', BFF_SECRET);
  }

  // Forward client info for device tracking / rate limiting
  if (request) {
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    if (forwarded) headers.set('x-forwarded-for', forwarded);

    const ua = request.headers.get('user-agent');
    if (ua) headers.set('user-agent', ua);

    const fingerprint = request.headers.get('x-device-fingerprint');
    if (fingerprint) headers.set('x-device-fingerprint', fingerprint);
  }

  return fetch(url, {
    ...fetchInit,
    headers,
    cache: 'no-store',
  });
}

/**
 * Make an authenticated backend request using the access token from cookies.
 * Returns the raw Response.
 */
export async function authenticatedBackendFetch(
  path: string,
  init: RequestInit & { request?: NextRequest } = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  const { request, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return backendFetch(path, { ...fetchInit, headers, request });
}

/**
 * Set auth cookies on a NextResponse.
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe = true,
  sessionId?: string,
): NextResponse {
  response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessTokenCookieOptions(rememberMe));
  response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshTokenCookieOptions(rememberMe));
  response.cookies.set(COOKIE_NAMES.AUTH_SESSION, '1', sessionCookieOptions(rememberMe));
  response.cookies.set(COOKIE_NAMES.REMEMBER_ME, rememberMe ? '1' : '0', sessionCookieOptions(rememberMe));
  if (sessionId) {
    response.cookies.set(COOKIE_NAMES.SESSION_ID, sessionId, sessionCookieOptions(rememberMe));
  }
  return response;
}

/**
 * Clear auth cookies on a NextResponse.
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
  response.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
  response.cookies.delete(COOKIE_NAMES.AUTH_SESSION);
  response.cookies.delete(COOKIE_NAMES.REMEMBER_ME);
  response.cookies.delete(COOKIE_NAMES.SESSION_ID);
  return response;
}

/**
 * Read tokens from request cookies.
 */
export async function getTokensFromCookies() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value || null,
    refreshToken: cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value || null,
    rememberMe: cookieStore.get(COOKIE_NAMES.REMEMBER_ME)?.value === '1',
  };
}

/**
 * Create a JSON error response.
 */
export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ status: 'error', message }, { status });
}
