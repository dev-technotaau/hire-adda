import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { TOKEN_CLEANUP_QUEUE_NAME } from './token-cleanup.queue';
import { cleanupExpiredTokens } from '../services/token.service';

export const tokenCleanupWorker = new Worker(
    TOKEN_CLEANUP_QUEUE_NAME,
    async (job: Job) => {
        logger.info(`Processing token cleanup job ${job.id}`);

        try {
            const deletedCount = await cleanupExpiredTokens();
            logger.info(`Token cleanup completed: ${deletedCount} tokens removed`);
            return { deleted: deletedCount };
        } catch (error) {
            logger.error('Token cleanup failed:', error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 1,
    }
);

tokenCleanupWorker.on('completed', (job) => {
    logger.info(`Token cleanup job ${job.id} completed`);
});

tokenCleanupWorker.on('failed', (job, err) => {
    logger.error(`Token cleanup job ${job?.id} failed: ${err.message}`);
});
