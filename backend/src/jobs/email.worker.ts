import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
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
        logger.info(`Processing email job ${job.id} to ${job.data.to}`);

        try {
            await sendEmail(job.data);
            logger.info(`Email sent to ${job.data.to}`);
            return { sent: true, messageId: 'mock-id' };
        } catch (error) {
            logger.error(`Failed to send email to ${job.data.to}:`, error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 5,
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
