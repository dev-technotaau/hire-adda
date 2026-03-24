import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';
import { injectTraceContext } from '../utils/trace-propagation';

export const SMS_QUEUE_NAME = 'sms-queue';

export const smsQueue = new Queue(SMS_QUEUE_NAME, {
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

smsQueue.on('error', (err) => {
  logger.error('SMS Queue Error:', err);
});

logger.info(`SMS Queue initialized: ${SMS_QUEUE_NAME}`);

export async function addSMSJob(data: { to: string; message: string }, priority?: number) {
  return smsQueue.add(
    'send-sms',
    { ...data, _traceContext: injectTraceContext() },
    priority ? { priority } : {}
  );
}
