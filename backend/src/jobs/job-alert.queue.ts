import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const JOB_ALERT_QUEUE_NAME = 'job-alert-queue';

export const jobAlertQueue = new Queue(JOB_ALERT_QUEUE_NAME, {
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

// Process job alerts every hour
jobAlertQueue
  .add(
    'process-alerts',
    {},
    {
      repeat: { pattern: '0 * * * *' },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    }
  )
  .catch((err) => {
    logger.error('Failed to add repeatable job alert processing:', err);
  });

jobAlertQueue.on('error', (err) => {
  logger.error('Job Alert Queue Error:', err);
});

logger.info(`Job Alert Queue initialized: ${JOB_ALERT_QUEUE_NAME}`);
