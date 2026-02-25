import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const JOB_EXPIRATION_QUEUE_NAME = 'job-expiration-queue';

export const jobExpirationQueue = new Queue(JOB_EXPIRATION_QUEUE_NAME, {
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

// Add repeatable job to check for expired jobs every 6 hours
jobExpirationQueue
  .add(
    'check-expired-jobs',
    {},
    {
      repeat: { pattern: '0 */6 * * *' },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    }
  )
  .catch((err) => {
    logger.error('Failed to add repeatable job expiration check:', err);
  });

jobExpirationQueue.on('error', (err) => {
  logger.error('Job Expiration Queue Error:', err);
});

logger.info(`Job Expiration Queue initialized: ${JOB_EXPIRATION_QUEUE_NAME}`);
