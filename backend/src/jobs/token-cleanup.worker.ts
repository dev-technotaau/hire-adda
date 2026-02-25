import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { TOKEN_CLEANUP_QUEUE_NAME } from './token-cleanup.queue';
import { cleanupExpiredTokens } from '../services/token.service';

export const tokenCleanupWorker = new Worker(
  TOKEN_CLEANUP_QUEUE_NAME,
  async (job: Job) => {
    const TIMEOUT_MS = 60_000;
    const timeoutId = setTimeout(() => {
      /* safety net */
    }, TIMEOUT_MS);
    try {
      logger.info(`Processing token cleanup job ${job.id}`);

      const deletedCount = await Promise.race([
        cleanupExpiredTokens(),
        new Promise<never>((_resolve, reject) =>
          setTimeout(() => reject(new Error('Token cleanup worker timeout after 60s')), TIMEOUT_MS)
        ),
      ]);
      logger.info(`Token cleanup completed: ${deletedCount} tokens removed`);
      return { deleted: deletedCount };
    } catch (error) {
      logger.error('Token cleanup failed:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  {
    connection: createBullMQConnection(),
    concurrency: 1,
    lockDuration: 60000,
  }
);

tokenCleanupWorker.on('completed', (job) => {
  logger.info(`Token cleanup job ${job.id} completed`);
});

tokenCleanupWorker.on('failed', (job, err) => {
  logger.error(`Token cleanup job ${job?.id} failed: ${err.message}`);
});
