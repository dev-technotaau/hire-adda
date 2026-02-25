import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Create a NextResponse.next() with CSP nonce headers attached.
 */
function nextWithCsp(): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
  const reportUri = `${apiUrl}/api/csp-report`;

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.gstatic.com https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://assets.talentbridge.com https://lh3.googleusercontent.com https://www.facebook.com https://www.google-analytics.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${apiUrl} https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://firebaseinstallations.googleapis.com https://firebaseremoteconfig.googleapis.com https://*.firebaseio.com wss: ws:`,
    "frame-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    `report-uri ${reportUri}`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);

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
const guestOnlyPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return nextWithCsp();
  }

  // Allow static assets, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return nextWithCsp();
  }

  // Check auth via cookie/token
  // Note: In a real app, you'd verify JWT here. For client-side auth with localStorage,
  // the middleware provides basic path-level protection; actual auth verification
  // happens client-side in the DashboardLayout component.
  const token = request.cookies.get('tb_access_token')?.value;

  // Auth paths: allow all through, but redirect authenticated users away from guest-only pages
  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (token && guestOnlyPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/', request.url));
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
