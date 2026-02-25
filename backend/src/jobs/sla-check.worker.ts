import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { SLA_CHECK_QUEUE_NAME } from './sla-check.queue';

export const slaCheckWorker = new Worker(
    SLA_CHECK_QUEUE_NAME,
    async (job: Job) => {
        const TIMEOUT_MS = 60_000;
        const timeoutId = setTimeout(() => { /* safety net */ }, TIMEOUT_MS);
        try {
            logger.info(`Processing SLA breach check ${job.id}`);

            const processSlaCheck = async () => {
                const { verificationService } = await import('../services/verification.service');
                const result = await verificationService.checkSlaBreaches();

                if (result.escalated > 0) {
                    logger.warn(`Auto-escalated ${result.escalated} verification(s) due to SLA breach`);

                    // Notify admins about SLA breaches
                    try {
                        const { notificationService } = await import('../services/notification.service');
                        const { prisma } = await import('../config/prisma');
                        const admins = await prisma.user.findMany({
                            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
                            select: { id: true },
                        });
                        for (const admin of admins) {
                            await notificationService.send({
                                userId: admin.id,
                                title: 'SLA Breach Alert',
                                message: `${result.escalated} verification request(s) have breached their SLA deadline and been auto-escalated to URGENT.`,
                                type: 'WARNING',
                                category: 'admin',
                                link: '/admin/verifications',
                                channels: ['in_app', 'email', 'fcm', 'web_push'],
                            }).catch(() => {});
                        }
                    } catch (_e) { /* non-critical */ }
                }

                return result;
            };

            return await Promise.race([
                processSlaCheck(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('SLA check worker timeout after 60s')), TIMEOUT_MS)
                ),
            ]);
        } catch (error) {
            logger.error('SLA breach check failed:', error);
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

slaCheckWorker.on('completed', (job) => {
    logger.info(`SLA breach check ${job.id} completed`);
});

slaCheckWorker.on('failed', (job, err) => {
    logger.error(`SLA breach check ${job?.id} failed: ${err.message}`);
});
