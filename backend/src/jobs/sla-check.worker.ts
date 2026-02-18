import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { SLA_CHECK_QUEUE_NAME } from './sla-check.queue';

export const slaCheckWorker = new Worker(
    SLA_CHECK_QUEUE_NAME,
    async (job: Job) => {
        logger.info(`Processing SLA breach check ${job.id}`);

        try {
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
                            channels: ['in_app'],
                        }).catch(() => {});
                    }
                } catch (_e) { /* non-critical */ }
            }

            return result;
        } catch (error) {
            logger.error('SLA breach check failed:', error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 1,
    }
);

slaCheckWorker.on('completed', (job) => {
    logger.info(`SLA breach check ${job.id} completed`);
});

slaCheckWorker.on('failed', (job, err) => {
    logger.error(`SLA breach check ${job?.id} failed: ${err.message}`);
});
