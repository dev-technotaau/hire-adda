import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const SCHEDULED_PUBLISH_QUEUE_NAME = 'scheduled-publish-queue';

export const scheduledPublishQueue = new Queue(SCHEDULED_PUBLISH_QUEUE_NAME, {
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

// Check for scheduled jobs every 5 minutes
scheduledPublishQueue
  .add(
    'check-scheduled-jobs',
    {},
    {
      repeat: { pattern: '*/5 * * * *' },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    }
  )
  .catch((err) => {
    logger.error('Failed to add repeatable scheduled publish check:', err);
  });

scheduledPublishQueue.on('error', (err) => {
  logger.error('Scheduled Publish Queue Error:', err);
});

logger.info(`Scheduled Publish Queue initialized: ${SCHEDULED_PUBLISH_QUEUE_NAME}`);
