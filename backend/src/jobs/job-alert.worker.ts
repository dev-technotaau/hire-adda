import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { JOB_ALERT_QUEUE_NAME } from './job-alert.queue';
import { jobAlertService } from '../services/job-alert.service';

export const jobAlertWorker = new Worker(
  JOB_ALERT_QUEUE_NAME,
  async (job: Job) => {
    const TIMEOUT_MS = 60_000;
    const timeoutId = setTimeout(() => {
      /* safety net */
    }, TIMEOUT_MS);
    try {
      logger.info(`Processing job alerts ${job.id}`);

      await Promise.race([
        jobAlertService.processAlerts(),
        new Promise<never>((_resolve, reject) =>
          setTimeout(() => reject(new Error('Job alert worker timeout after 60s')), TIMEOUT_MS)
        ),
      ]);
      return { processed: true };
    } catch (error) {
      logger.error('Job alert processing failed:', error);
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

jobAlertWorker.on('completed', (job) => {
  logger.info(`Job alert processing ${job.id} completed`);
});

jobAlertWorker.on('failed', (job, err) => {
  logger.error(`Job alert processing ${job?.id} failed: ${err.message}`);
});
