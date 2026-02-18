import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { FCM_QUEUE_NAME } from './fcm.queue';
import { sendFcmNotification } from '../services/fcm.service';

interface FcmJobData {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}

export const fcmWorker = new Worker<FcmJobData>(
    FCM_QUEUE_NAME,
    async (job: Job<FcmJobData>) => {
        logger.info(`Processing FCM job ${job.id} for ${job.data.tokens.length} devices`);

        try {
            const result = await sendFcmNotification(job.data);
            logger.info(`FCM notification sent to ${job.data.tokens.length} devices`);
            return { sent: true, successCount: result.successCount };
        } catch (error) {
            logger.error(`Failed to send FCM notification:`, error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 5,
        limiter: {
            max: 50, // FCM allows high volume
            duration: 1000,
        },
    }
);

fcmWorker.on('completed', (job) => {
    logger.info(`FCM job ${job.id} completed`);
});

fcmWorker.on('failed', (job, err) => {
    logger.error(`FCM job ${job?.id} failed: ${err.message}`);
});
