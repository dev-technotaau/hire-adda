import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const SLA_CHECK_QUEUE_NAME = 'sla-check-queue';

export const slaCheckQueue = new Queue(SLA_CHECK_QUEUE_NAME, {
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

// Check SLA breaches every 15 minutes
slaCheckQueue.add('check-sla-breaches', {}, {
    repeat: { pattern: '*/15 * * * *' },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
}).catch(err => {
    logger.error('Failed to add repeatable SLA check:', err);
});

slaCheckQueue.on('error', (err) => {
    logger.error('SLA Check Queue Error:', err);
});

logger.info(`SLA Check Queue initialized: ${SLA_CHECK_QUEUE_NAME}`);
