import { doubleCsrf } from 'csrf-csrf';
import { env } from './env';
import { Request } from 'express';

// To avoid the "cannot be named" error, we just don't export invalidCsrfTokenError directly
const {
    invalidCsrfTokenError,
    generateCsrfToken,
    doubleCsrfProtection,
    validateRequest,
} = doubleCsrf({
    getSecret: () => env.CSRF_SECRET,
    cookieName: 'x-csrf-token',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: env.NODE_ENV === 'production',
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (req: Request) => {
        return req.headers['x-csrf-token'] as string;
    },
    // Using a default session identifier for now since we don't have auth middleware running yet
    // In production with auth, this should bind to req.user.id
    getSessionIdentifier: (req: Request) => {
        return (req.user as any)?.id || req.ip || 'anon-session';
    }
});

// Re-export individually
export { generateCsrfToken, doubleCsrfProtection, validateRequest };

// Export error as any to bypass "cannot be named" error
export const invalidCsrfError = invalidCsrfTokenError as any;
