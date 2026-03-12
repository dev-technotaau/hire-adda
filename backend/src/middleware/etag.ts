import type { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { redis } from '../config/redis';
import logger from '../config/logger';

interface ETagOptions {
  /** TTL in seconds for the cached ETag (default: 60) */
  ttl?: number;
}

/**
 * ETag middleware — caches response ETags in Redis and returns 304 Not Modified
 * when the client sends a matching If-None-Match header.
 * Apply selectively to high-traffic GET endpoints.
 */
export const etagCache = (options: ETagOptions = {}) => {
  const { ttl = 60 } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    if (redis.status !== 'ready') {
      next();
      return;
    }

    const userId = (req as any).user?.id || 'anon';
    const etagKey = `etag:${req.originalUrl}:${userId}`;
    const ifNoneMatch = req.headers['if-none-match'];

    // Check if client's ETag matches the stored one
    if (ifNoneMatch) {
      try {
        const storedEtag = await redis.get(etagKey);
        if (storedEtag && storedEtag === ifNoneMatch) {
          res.status(304).end();
          return;
        }
      } catch {
        // Redis unavailable — proceed normally
      }
    }

    // Intercept res.json to compute and cache ETag
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const bodyStr = JSON.stringify(body);
          const etag = `"${createHash('md5').update(bodyStr).digest('hex')}"`;
          res.setHeader('ETag', etag);

          // Cache the ETag in Redis (fire-and-forget)
          redis.set(etagKey, etag, 'EX', ttl).catch(() => {});
        } catch (error) {
          logger.debug('ETag computation error:', error);
        }
      }
      return originalJson(body);
    };

    next();
  };
};
