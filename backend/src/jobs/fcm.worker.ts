import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { FCM_QUEUE_NAME } from './fcm.queue';
import { sendFcmNotification } from '../services/fcm.service';
import prisma from '../config/prisma';

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
        const TIMEOUT_MS = 30_000;
        const timeoutId = setTimeout(() => { /* safety net */ }, TIMEOUT_MS);
        try {
            logger.info(`Processing FCM job ${job.id} for ${job.data.tokens.length} devices`);

            const result = await Promise.race([
                sendFcmNotification(job.data),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('FCM worker timeout after 30s')), TIMEOUT_MS)
                ),
            ]);

            // Clean up invalid/expired tokens
            if (result.failureCount > 0) {
                const invalidTokens: string[] = [];
                result.responses.forEach((resp: { success: boolean; error?: { code: string } }, idx: number) => {
                    if (!resp.success && resp.error) {
                        const code = resp.error.code;
                        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
                            invalidTokens.push(job.data.tokens[idx]);
                        }
                    }
                });

                if (invalidTokens.length > 0) {
                    await prisma.deviceToken.deleteMany({ where: { token: { in: invalidTokens } } });
                    logger.info(`Cleaned up ${invalidTokens.length} invalid FCM token(s)`);
                }
            }

            logger.info(`FCM notification sent: ${result.successCount} success, ${result.failureCount} failed`);
            return { sent: true, successCount: result.successCount };
        } catch (error) {
            logger.error(`Failed to send FCM notification:`, error);
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 5,
        lockDuration: 60000,
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
