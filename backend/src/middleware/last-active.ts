import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import redis from '../config/redis';

/**
 * Lightweight middleware to update user's lastActiveAt.
 * Debounced: only updates if last update was >5 minutes ago using Redis cache.
 */
export const updateLastActive = () => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) return next();

            const userId = req.user.id;
            const cacheKey = `last_active:${userId}`;

            if (redis) {
                const cached = await redis.get(cacheKey);
                if (cached) return next(); // Updated recently, skip

                // Set cache with 5 minute expiry
                await redis.set(cacheKey, '1', 'EX', 300);
            }

            // Fire-and-forget DB update
            prisma.user.update({
                where: { id: userId },
                data: { lastActiveAt: new Date() },
            }).catch(() => {}); // Non-critical, don't throw

            next();
        } catch {
            next(); // Never block the request
        }
    };
};
