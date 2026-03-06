import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Create a NextResponse.next() with CSP nonce headers attached.
 *
 * CSP notes:
 * - style-src requires 'unsafe-inline' — Next.js/Tailwind inject non-nonce'd inline styles
 *   at build & runtime. This is a known framework limitation, not removable without breakage.
 * - frame-ancestors 'none' is the modern CSP3 replacement for X-Frame-Options: DENY
 * - report-to (Reporting API v1) sent alongside deprecated report-uri for forward compat
 */
function nextWithCsp(): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
  const reportUri = `${apiUrl}/api/csp-report`;

  // Derive WebSocket URL from API URL (http→ws, https→wss)
  const wsUrl = apiUrl.replace(/^http/, 'ws');

  // Specific Firebase RTDB domain instead of *.firebaseio.com wildcard
  const firebaseDbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '';
  const firebaseDbOrigin = firebaseDbUrl ? new URL(firebaseDbUrl).origin : '';

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.gstatic.com https://challenges.cloudflare.com https://vercel.live${firebaseDbOrigin ? ` ${firebaseDbOrigin}` : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
    "img-src 'self' data: blob: https://res.cloudinary.com https://assets.talentbridge.com https://lh3.googleusercontent.com https://www.facebook.com https://www.google-analytics.com https://www.googletagmanager.com https://vercel.live https://vercel.com",
    "font-src 'self' https://fonts.gstatic.com https://vercel.live",
    `connect-src 'self' ${apiUrl} ${wsUrl} https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://challenges.cloudflare.com https://vercel.live https://firebaseinstallations.googleapis.com https://firebaseremoteconfig.googleapis.com https://firestore.googleapis.com https://fcmregistrations.googleapis.com https://fcm.googleapis.com${firebaseDbOrigin ? ` ${firebaseDbOrigin}` : ''}`,
    "frame-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com https://vercel.live",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `report-uri ${reportUri}`,
    'report-to csp-endpoint',
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);
  // Reporting API v1 endpoint header (modern browsers use this instead of report-uri)
  response.headers.set('Reporting-Endpoints', `csp-endpoint="${reportUri}"`);

  return response;
}

const publicPaths = [
  '/',
  '/about',
  '/contact',
  '/help',
  '/privacy',
  '/terms',
  '/cookie-policy',
  '/refund-policy',
  '/accessibility',
  '/disclaimer',
];
// Auth paths where authenticated users should be redirected away (no reason to visit)
const guestOnlyPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/portal/login'];
// Auth paths accessible regardless of auth state (needed post-login)
const authPaths = [...guestOnlyPaths, '/auth/reset-password', '/auth/verify-email'];

const rolePrefixMap: Record<string, string[]> = {
  '/candidate': ['CANDIDATE'],
  '/employer': ['EMPLOYER'],
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/super-admin': ['SUPER_ADMIN'],
};

const roleDashboards: Record<string, string> = {
  CANDIDATE: '/candidate',
  EMPLOYER: '/employer',
  ADMIN: '/admin',
  SUPER_ADMIN: '/super-admin',
};

/** Decode JWT payload without verification (Edge-compatible, no crypto needed — just for routing).
 *  Returns null if the token is malformed or expired so the middleware treats it as unauthenticated. */
function getRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64 → decode
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    const data = JSON.parse(json) as { role?: string; exp?: number };
    // Treat expired tokens as unauthenticated to prevent redirect loops
    if (data.exp && data.exp * 1000 < Date.now()) return null;
    return data.role || null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return nextWithCsp();
  }

  const token = request.cookies.get('tb_access_token')?.value;

  // Homepage: authenticated users go to their dashboard, guests see landing page
  if (pathname === '/') {
    if (token) {
      const role = getRoleFromToken(token);
      const dashboard = role && roleDashboards[role];
      if (dashboard) {
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }
    return nextWithCsp();
  }

  // Other public paths (about, contact, etc.) — no auth check needed
  if (publicPaths.includes(pathname)) {
    return nextWithCsp();
  }

  // Auth/portal paths: redirect authenticated users away from login/register pages
  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (token && guestOnlyPaths.some((p) => pathname.startsWith(p))) {
      const role = getRoleFromToken(token);
      // Only redirect if the token is valid AND not expired.
      // If role is null (expired/invalid JWT), let the user through to the login page
      // so they can re-authenticate. Stale cookies are cleaned up by the BFF on next getMe().
      if (role) {
        const dashboard = roleDashboards[role] || '/';
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }
    return nextWithCsp();
  }

  // Protected paths: check if the path requires a specific role
  for (const [prefix] of Object.entries(rolePrefixMap)) {
    if (pathname.startsWith(prefix)) {
      // If no token, redirect to login
      if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Role-based access is enforced client-side by DashboardLayout
      return nextWithCsp();
    }
  }

  // Notifications page requires auth
  if (pathname === '/notifications') {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return nextWithCsp();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
