import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';

// Check if Redis is enabled (optional for development)
const isRedisEnabled = env.REDIS_ENABLED !== 'false';

// Build Redis configuration from environment variables
const buildRedisConfig = (): RedisOptions => {
  // If full URL is provided, use it
  if (env.REDIS_URL) {
    return {
      maxRetriesPerRequest: null, // Required for BullMQ
      lazyConnect: true, // Don't connect immediately
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
    };
  }

  const config: RedisOptions = {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
    maxRetriesPerRequest: null, // Required for BullMQ
    lazyConnect: true, // Don't connect immediately
    retryStrategy: (times) => {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 200, 2000);
    },
  };

  // Add password if provided
  if (env.REDIS_PASSWORD) {
    config.password = env.REDIS_PASSWORD;
  }

  // Enable TLS for cloud Redis (Upstash, Redis Cloud)
  if (env.REDIS_TLS === 'true') {
    config.tls = {};
  }

  return config;
};

// Create a mock Redis for when Redis is disabled
const createMockRedis = () => {
  const noop = () => Promise.resolve(null);
  return {
    get: noop,
    set: noop,
    del: noop,
    expire: noop,
    ttl: noop,
    on: () => { },
    connect: () => Promise.resolve(),
    disconnect: () => { },
    quit: () => Promise.resolve('OK'),
    call: (..._args: unknown[]) => Promise.resolve(null),
    status: 'disabled',
  } as unknown as Redis;
};

const redisConfig = buildRedisConfig();

// Create Redis connection
const createConnection = (): Redis => {
  if (!isRedisEnabled) {
    console.log('⚠️ Redis is disabled (REDIS_ENABLED=false)');
    return createMockRedis();
  }

  if (env.REDIS_URL) {
    return new Redis(env.REDIS_URL, redisConfig);
  }
  return new Redis(redisConfig);
};

// Main Redis connection (for caching, pub/sub)
export const redis = createConnection();

// BullMQ connection factory (each queue/worker needs its own connection)
export const createBullMQConnection = () => createConnection();

// BullMQ default job options from env
export const bullmqDefaultJobOptions = {
  attempts: parseInt(env.BULLMQ_DEFAULT_JOB_OPTIONS_ATTEMPTS, 10),
  backoff: {
    type: 'exponential' as const,
    delay: parseInt(env.BULLMQ_DEFAULT_JOB_OPTIONS_BACKOFF, 10),
  },
  removeOnComplete: parseInt(env.BULLMQ_REMOVE_ON_COMPLETE, 10),
  removeOnFail: parseInt(env.BULLMQ_REMOVE_ON_FAIL, 10),
};

// Event handlers (only if Redis is enabled)
if (isRedisEnabled) {
  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  redis.on('close', () => {
    console.log('⚠️ Redis connection closed');
  });
}

export default redis;
