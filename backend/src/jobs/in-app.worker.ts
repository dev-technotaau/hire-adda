import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { IN_APP_QUEUE_NAME } from './in-app.queue';
import { getIO } from '../socket';

interface InAppJobData {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}

export const inAppWorker = new Worker<InAppJobData>(
    IN_APP_QUEUE_NAME,
    async (job: Job<InAppJobData>) => {
        logger.info(`Processing In-App notification job ${job.id} for User ${job.data.userId}`);

        try {
            // Send via Socket.IO (Real-time)
            // Note: Notification record is already created by NotificationService.send()
            try {
                const io = getIO();
                io.to(`user:${job.data.userId}`).emit('notification', {
                    title: job.data.title,
                    message: job.data.message,
                    type: job.data.type,
                    link: job.data.link,
                    createdAt: new Date().toISOString(),
                });
            } catch {
                // Socket.IO may not be initialized in worker process
                logger.debug('Socket.IO not available in worker - skipping real-time emit');
            }

            logger.info(`In-App notification processed for User ${job.data.userId}`);
            return { sent: true };
        } catch (error) {
            logger.error(`Failed to process In-App notification for User ${job.data.userId}:`, error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 10, // High concurrency for real-time feel
    }
);

inAppWorker.on('completed', (job) => {
    logger.info(`In-App job ${job.id} completed`);
});

inAppWorker.on('failed', (job, err) => {
    logger.error(`In-App job ${job?.id} failed: ${err.message}`);
});
