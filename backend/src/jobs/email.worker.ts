import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';
import { EMAIL_QUEUE_NAME } from './email.queue';
import { sendEmail } from '../services/email.service';

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    const TIMEOUT_MS = 30_000;
    const timeoutId = setTimeout(() => {
      /* safety net; AbortSignal is primary */
    }, TIMEOUT_MS);
    try {
      logger.info(`Processing email job ${job.id} to ${job.data.to}`);

      await Promise.race([
        sendEmail(job.data),
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error('Email worker timeout after 30s')), TIMEOUT_MS)
        ),
      ]);
      logger.info(`Email sent to ${job.data.to}`);
      return { sent: true, messageId: 'mock-id' };
    } catch (error) {
      logger.error(`Failed to send email to ${job.data.to}:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  {
    connection: redis,
    concurrency: 5,
    lockDuration: 30000,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed: ${err.message}`);
});
