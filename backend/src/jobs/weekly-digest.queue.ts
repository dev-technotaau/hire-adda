import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const WEEKLY_DIGEST_QUEUE_NAME = 'weekly-digest-queue';

export const weeklyDigestQueue = new Queue(WEEKLY_DIGEST_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 10000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// Run weekly digest every Monday at 9:00 AM
weeklyDigestQueue.add('send-weekly-digest', {}, {
    repeat: { pattern: '0 9 * * 1' },
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
}).catch(err => {
    logger.error('Failed to add repeatable weekly digest:', err);
});

weeklyDigestQueue.on('error', (err) => {
    logger.error('Weekly Digest Queue Error:', err);
});

logger.info(`Weekly Digest Queue initialized: ${WEEKLY_DIGEST_QUEUE_NAME}`);
