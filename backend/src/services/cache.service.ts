import redis from '../config/redis';
import logger from '../config/logger';

/**
 * Cache Service
 * Wrapper around Redis for common caching operations
 */
export class CacheService {
    private static instance: CacheService;
    private readonly defaultTtl: number = 3600; // 1 hour

    private constructor() { }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    /**
     * Get value from cache
     * @param key Cache key
     */
    public async get<T>(key: string): Promise<T | null> {
        try {
            const value = await redis.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error(`Cache Get Error [${key}]:`, error);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live in seconds (optional)
     */
    public async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            if (ttl) {
                await redis.set(key, stringValue, 'EX', ttl);
            } else {
                await redis.set(key, stringValue, 'EX', this.defaultTtl);
            }
        } catch (error) {
            logger.error(`Cache Set Error [${key}]:`, error);
        }
    }

    /**
     * Delete value from cache
     * @param key Cache key
     */
    public async del(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (error) {
            logger.error(`Cache Del Error [${key}]:`, error);
        }
    }

    /**
     * Flush all cache (Use with caution)
     */
    public async flush(): Promise<void> {
        try {
            await redis.flushall();
            logger.warn('Cache flushed');
        } catch (error) {
            logger.error('Cache Flush Error:', error);
        }
    }
}

export const cacheService = CacheService.getInstance();
