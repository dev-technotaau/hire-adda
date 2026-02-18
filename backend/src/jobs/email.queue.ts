import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

emailQueue.on('error', (err) => {
    logger.error('Email Queue Error:', err);
});

logger.info(`Email Queue initialized: ${EMAIL_QUEUE_NAME}`);
