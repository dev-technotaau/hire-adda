import { NextRequest, NextResponse } from 'next/server';
import { authenticatedBackendFetch, setAuthCookies, clearAuthCookies, getTokensFromCookies } from '../_lib/proxy-helpers';
import { attemptServerRefresh } from '../_lib/refresh';

export async function GET(request: NextRequest) {
  try {
    let res = await authenticatedBackendFetch('/auth/me', { request });

    // If 401, try silent refresh then retry
    if (res.status === 401) {
      const tokens = await attemptServerRefresh();
      if (tokens) {
        // Retry with new access token
        res = await authenticatedBackendFetch('/auth/me', {
          request,
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          const { rememberMe } = await getTokensFromCookies();
          const response = NextResponse.json(data);
          return setAuthCookies(response, tokens.accessToken, tokens.refreshToken, rememberMe);
        }
      }

      // Session is truly dead — clear stale cookies so middleware doesn't keep
      // allowing access to protected routes with a dead session.
      // This is safe here (unlike the catch-all proxy) because getMe() is the
      // authoritative session check called once on mount, not concurrent bulk requests.
      const response = NextResponse.json(
        { status: 'error', message: 'Not authenticated' },
        { status: 401 },
      );
      return clearAuthCookies(response);
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 },
    );
  }
}
