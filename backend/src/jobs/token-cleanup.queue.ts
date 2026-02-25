import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const TOKEN_CLEANUP_QUEUE_NAME = 'token-cleanup-queue';

export const tokenCleanupQueue = new Queue(TOKEN_CLEANUP_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Run token cleanup daily at 3 AM
tokenCleanupQueue
  .add(
    'cleanup-tokens',
    {},
    {
      repeat: { pattern: '0 3 * * *' },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    }
  )
  .catch((err) => {
    logger.error('Failed to add repeatable token cleanup job:', err);
  });

tokenCleanupQueue.on('error', (err) => {
  logger.error('Token Cleanup Queue Error:', err);
});

logger.info(`Token Cleanup Queue initialized: ${TOKEN_CLEANUP_QUEUE_NAME}`);
