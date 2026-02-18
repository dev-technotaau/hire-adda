import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
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
        logger.info(`Processing SMS job ${job.id} to ${job.data.to}`);

        try {
            const sent = await sendSMS(job.data.to, job.data.body);
            if (!sent) {
                logger.warn(`SMS not sent to ${job.data.to} - service may be unconfigured`);
            }
            return { sent };
        } catch (error) {
            logger.error(`Failed to send SMS to ${job.data.to}:`, error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 5,
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
