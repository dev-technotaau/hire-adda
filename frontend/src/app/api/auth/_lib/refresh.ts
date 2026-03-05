import { cookies } from 'next/headers';
import { BACKEND_URL, BFF_SECRET, COOKIE_NAMES } from './config';

/** Mutex to prevent concurrent refresh calls from the proxy */
let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

/**
 * Attempt a silent token refresh server-side.
 * Returns new tokens on success or null on failure.
 * Uses a mutex so concurrent 401 retries don't trigger multiple refreshes.
 */
export async function attemptServerRefresh(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function doRefresh(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (!refreshToken) return null;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (BFF_SECRET) {
      headers['x-bff-secret'] = BFF_SECRET;
    }

    const res = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newAccessToken = data?.data?.accessToken;
    const newRefreshToken = data?.data?.refreshToken;

    if (!newAccessToken || !newRefreshToken) return null;

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch {
    return null;
  }
}
