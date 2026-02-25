import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { JOB_EXPIRATION_QUEUE_NAME } from './job-expiration.queue';
import { prisma } from '../config/prisma';
import { JobStatus } from '@prisma/client';

export const jobExpirationWorker = new Worker(
    JOB_EXPIRATION_QUEUE_NAME,
    async (job: Job) => {
        const TIMEOUT_MS = 60_000;
        const timeoutId = setTimeout(() => { /* safety net */ }, TIMEOUT_MS);
        try {
            logger.info(`Processing job expiration check ${job.id}`);

            const processExpiration = async () => {
                // Find all OPEN jobs that have passed their expiresAt date
                const expiredJobs = await prisma.jobPost.findMany({
                    where: {
                        status: JobStatus.OPEN,
                        expiresAt: { lte: new Date() },
                    },
                    select: { id: true, title: true, companyId: true },
                });

                if (expiredJobs.length === 0) {
                    logger.info('No expired jobs found');
                    return { expired: 0 };
                }

                // Batch update all expired jobs
                const result = await prisma.jobPost.updateMany({
                    where: {
                        id: { in: expiredJobs.map(j => j.id) },
                    },
                    data: { status: JobStatus.EXPIRED },
                });

                // Remove expired jobs from Elasticsearch
                try {
                    const { searchService } = await import('../services/search.service');
                    for (const expJob of expiredJobs) {
                        await searchService.deleteJob(expJob.id).catch(() => {});
                    }
                } catch (error) {
                    logger.error('Failed to remove expired jobs from ES:', error);
                }

                // Notify employers about expired jobs
                try {
                    const { notificationService } = await import('../services/notification.service');
                    for (const expiredJob of expiredJobs) {
                        const company = await prisma.companyProfile.findUnique({
                            where: { id: expiredJob.companyId },
                            select: { userId: true },
                        });
                        if (company) {
                            await notificationService.send({
                                userId: company.userId,
                                title: 'Job Expired',
                                message: `Your job posting "${expiredJob.title}" has expired.`,
                                type: 'WARNING',
                                category: 'job',
                                link: `/employer/jobs/${expiredJob.id}`,
                                channels: ['in_app', 'email', 'fcm', 'web_push'],
                            }).catch(() => {});
                        }
                    }
                } catch (e) { logger.error('Failed to notify employers about expired jobs', e); }

                logger.info(`Expired ${result.count} jobs`);
                return { expired: result.count, jobIds: expiredJobs.map(j => j.id) };
            };

            return await Promise.race([
                processExpiration(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Job expiration worker timeout after 60s')), TIMEOUT_MS)
                ),
            ]);
        } catch (error) {
            logger.error('Job expiration check failed:', error);
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 1, // Only one expiration check at a time
        lockDuration: 60000,
    }
);

jobExpirationWorker.on('completed', (job) => {
    logger.info(`Job expiration check ${job.id} completed`);
});

jobExpirationWorker.on('failed', (job, err) => {
    logger.error(`Job expiration check ${job?.id} failed: ${err.message}`);
});
