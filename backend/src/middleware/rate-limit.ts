import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env';
import { redis } from '../config/redis';

/**
 * Create a fresh RedisStore instance for each limiter.
 * Each must have a unique prefix to avoid ERR_ERL_STORE_REUSE.
 */
function createRedisStore(prefix: string): RedisStore {
  return new RedisStore({
    prefix: `rl:${prefix}:`,
    // @ts-expect-error - Known issue with rate-limit-redis types
    sendCommand: (...args: string[]) => redis.call(...args),
  });
}

/**
 * Strict Rate Limiter for Authentication Routes
 * Usage: Apply to /login, /register, /forgot-password
 */
export const authLimiter = rateLimit({
  windowMs: parseInt(env.AUTH_RATE_LIMIT_WINDOW_MS, 10), // Default: 5 minutes
  max: parseInt(env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 10), // Default: 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('auth'),
  message: {
    status: 'fail',
    message: 'Too many login attempts, please try again later.',
  },
  skipSuccessfulRequests: false, // Count successful logins too to prevent enumeration
});

/**
 * Standard Rate Limiter for General API Routes
 * Usage: Apply to /api
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10), // Default: 15 minutes
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10), // Default: 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('api'),
  message: {
    status: 'fail',
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Public/Open Route Limiter (e.g. valid for landing page data)
 * Usage: Apply to public read-only endpoints if needed
 */
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('pub'),
});

/**
 * MFA Route Limiter
 * Usage: Apply to /auth/mfa/* endpoints to prevent brute-force
 */
export const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('mfa'),
  message: {
    status: 'fail',
    message: 'Too many MFA attempts. Please try again later.',
  },
});

/**
 * Search Route Limiter
 * Usage: Apply to /search routes (autocomplete, suggestions, etc.)
 * More permissive than auth but stricter than general API to prevent abuse.
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('search'),
  message: {
    status: 'fail',
    message: 'Too many search requests, please slow down.',
  },
});
