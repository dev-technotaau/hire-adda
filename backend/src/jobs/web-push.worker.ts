import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { WEB_PUSH_QUEUE_NAME } from './web-push.queue';
import { sendWebPushNotification } from '../services/web-push.service';
import { deviceService } from '../services/device.service';

interface WebPushJobData {
    subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
    };
    payload: string | Buffer | null;
}

export const webPushWorker = new Worker<WebPushJobData>(
    WEB_PUSH_QUEUE_NAME,
    async (job: Job<WebPushJobData>) => {
        logger.info(`Processing Web Push job ${job.id}`);

        try {
            await sendWebPushNotification(job.data.subscription, job.data.payload);
            logger.info(`Web Push notification sent`);
            return { sent: true };
        } catch (error: any) {
            // If subscription is expired, clean it up
            if (error.statusCode === 410 || error.statusCode === 404) {
                await deviceService.removePushSubscriptionByEndpoint(job.data.subscription.endpoint);
                logger.warn('Removed expired push subscription');
                return { sent: false, expired: true };
            }
            logger.error(`Failed to send Web Push notification:`, error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 5,
        limiter: {
            max: 20,
            duration: 1000,
        },
    }
);

webPushWorker.on('completed', (job) => {
    logger.info(`Web Push job ${job.id} completed`);
});

webPushWorker.on('failed', (job, err) => {
    logger.error(`Web Push job ${job?.id} failed: ${err.message}`);
});
