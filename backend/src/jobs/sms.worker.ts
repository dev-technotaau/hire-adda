import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { env } from '../config/env';
import logger from '../config/logger';
import { SMS_QUEUE_NAME } from './sms.queue';
import { sendSMS } from '../services/sms.service';

interface SmsJobData {
  to: string;
  body: string;
}

export const smsWorker = new Worker<SmsJobData>(
  SMS_QUEUE_NAME,
  async (job: Job<SmsJobData>) => {
    const TIMEOUT_MS = 30_000;
    const timeoutId = setTimeout(() => {
      /* safety net */
    }, TIMEOUT_MS);
    try {
      logger.info(`Processing SMS job ${job.id} to ${job.data.to}`);

      const sent = await Promise.race([
        sendSMS(job.data.to, job.data.body),
        new Promise<never>((_resolve, reject) =>
          setTimeout(() => reject(new Error('SMS worker timeout after 30s')), TIMEOUT_MS)
        ),
      ]);
      if (!sent) {
        logger.warn(`SMS not sent to ${job.data.to} - service may be unconfigured`);
      }
      return { sent };
    } catch (error) {
      logger.error(`Failed to send SMS to ${job.data.to}:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  {
    connection: redis,
    concurrency: parseInt(env.BULLMQ_SMS_CONCURRENCY, 10),
    lockDuration: 60000,
    limiter: {
      max: 5,
      duration: 1000,
    },
  }
);

smsWorker.on('completed', (job) => {
  logger.info(`SMS job ${job.id} completed`);
});

smsWorker.on('failed', (job, err) => {
  logger.error(`SMS job ${job?.id} failed: ${err.message}`);
});
