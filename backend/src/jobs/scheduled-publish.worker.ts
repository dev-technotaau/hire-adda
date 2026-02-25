import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { SCHEDULED_PUBLISH_QUEUE_NAME } from './scheduled-publish.queue';
import { prisma } from '../config/prisma';
import { JobStatus } from '@prisma/client';

export const scheduledPublishWorker = new Worker(
    SCHEDULED_PUBLISH_QUEUE_NAME,
    async (job: Job) => {
        const TIMEOUT_MS = 60_000;
        const timeoutId = setTimeout(() => { /* safety net */ }, TIMEOUT_MS);
        try {
            logger.info(`Processing scheduled publish check ${job.id}`);

            const processScheduled = async () => {
                // Find DRAFT jobs whose scheduledPublishAt has passed
                const scheduledJobs = await prisma.jobPost.findMany({
                    where: {
                        status: JobStatus.DRAFT,
                        scheduledPublishAt: { lte: new Date() },
                    },
                    select: { id: true, title: true, companyId: true, location: true },
                });

                if (scheduledJobs.length === 0) {
                    logger.info('No scheduled jobs ready to publish');
                    return { published: 0 };
                }

                let published = 0;
                for (const sj of scheduledJobs) {
                    try {
                        // Update status to OPEN
                        await prisma.jobPost.update({
                            where: { id: sj.id },
                            data: { status: JobStatus.OPEN },
                        });

                        // Index in Elasticsearch
                        try {
                            const { searchService } = await import('../services/search.service');
                            const jobForIndex = await prisma.jobPost.findUnique({
                                where: { id: sj.id },
                                include: { company: { select: { id: true, companyName: true, logo: true, industry: true, companyType: true, companySize: true, isVerified: true } } },
                            });
                            if (jobForIndex) {
                                await searchService.indexJob(jobForIndex);
                            }
                        } catch (e) { logger.error(`Failed to index scheduled job ${sj.id} in ES`, e); }

                        // Trigger geocoding
                        if (sj.location) {
                            import('./geocoding.queue').then(({ addGeocodingJob }) =>
                                addGeocodingJob({ entityType: 'job', entityId: sj.id, address: sj.location })
                            ).catch(() => {});
                        }

                        // Trigger candidate matching
                        try {
                            const { matchingQueue } = await import('./matching.queue');
                            await matchingQueue.add('match-candidates', { jobId: sj.id });
                        } catch (e) { logger.error(`Failed to enqueue matching for scheduled job ${sj.id}`, e); }

                        // Publish Kafka event
                        try {
                            const { publishEvent, KafkaTopics } = await import('../kafka/producer');
                            publishEvent(KafkaTopics.JOB_POSTED, sj.id, { jobId: sj.id, companyId: sj.companyId, title: sj.title, scheduled: true });
                        } catch { /* non-critical */ }

                        // Notify employer
                        try {
                            const company = await prisma.companyProfile.findUnique({
                                where: { id: sj.companyId },
                                select: { userId: true },
                            });
                            if (company) {
                                const { notificationService } = await import('../services/notification.service');
                                await notificationService.notifyJobPosted(company.userId, sj.title, sj.id);
                            }
                        } catch { /* non-critical */ }

                        published++;
                    } catch (error) {
                        logger.error(`Failed to publish scheduled job ${sj.id}:`, error);
                    }
                }

                logger.info(`Published ${published}/${scheduledJobs.length} scheduled jobs`);
                return { published, total: scheduledJobs.length };
            };

            return await Promise.race([
                processScheduled(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Scheduled publish worker timeout after 60s')), TIMEOUT_MS)
                ),
            ]);
        } catch (error) {
            logger.error('Scheduled publish check failed:', error);
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

scheduledPublishWorker.on('completed', (job) => {
    logger.info(`Scheduled publish check ${job.id} completed`);
});

scheduledPublishWorker.on('failed', (job, err) => {
    logger.error(`Scheduled publish check ${job?.id} failed: ${err.message}`);
});
