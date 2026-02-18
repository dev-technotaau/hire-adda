import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { MATCHING_QUEUE_NAME } from './matching.queue';
import { matchingService } from '../services/matching.service';
import { notificationService } from '../services/notification.service';
import { prisma } from '../config/prisma';

interface MatchCandidatesData {
    jobId: string;
}

interface MatchJobsData {
    userId: string;
}

type MatchingJobData = MatchCandidatesData | MatchJobsData;

export const matchingWorker = new Worker<MatchingJobData>(
    MATCHING_QUEUE_NAME,
    async (job: Job<MatchingJobData>) => {
        switch (job.name) {
            case 'match-candidates': {
                const { jobId } = job.data as MatchCandidatesData;
                logger.info(`Processing match-candidates job ${job.id} for jobId=${jobId}`);

                const matches = await matchingService.findMatchingCandidates(jobId);
                logger.info(`Found ${matches.length} candidate matches for job ${jobId}`);

                // Load job details for notification
                const jobDetails = await prisma.jobPost.findUnique({
                    where: { id: jobId },
                    include: { company: true },
                });

                if (!jobDetails) {
                    logger.warn(`Job ${jobId} not found, skipping notifications`);
                    return { matchCount: 0 };
                }

                const jobTitle = jobDetails.title;
                const companyName = jobDetails.company?.companyName || '';

                let notified = 0;
                for (const match of matches) {
                    if (match.score >= 0.5) {
                        try {
                            await notificationService.notifyJobMatch(
                                match.userId,
                                jobTitle,
                                companyName,
                                jobId,
                                match.score
                            );
                            notified++;
                        } catch (error) {
                            logger.error(
                                `Failed to notify candidate ${match.userId} about job ${jobId}`,
                                error
                            );
                        }
                    }
                }

                logger.info(`Notified ${notified} candidates for job ${jobId}`);
                return { matchCount: matches.length, notifiedCount: notified };
            }

            case 'match-jobs': {
                const { userId } = job.data as MatchJobsData;
                logger.info(`Processing match-jobs job ${job.id} for userId=${userId}`);

                const matches = await matchingService.findMatchingJobs(userId);
                logger.info(
                    `Found ${matches.length} job matches for user ${userId}: ${matches
                        .map((m) => `${m.title} (${Math.round(m.score * 100)}%)`)
                        .join(', ')}`
                );

                // On-demand only - no automatic notification to candidate about matching jobs
                return { matchCount: matches.length };
            }

            default:
                logger.warn(`Unknown matching job name: ${job.name}`);
                return null;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 3,
        limiter: {
            max: 5,
            duration: 1000,
        },
    }
);

matchingWorker.on('completed', (job) => {
    logger.info(`Matching job ${job.id} (${job.name}) completed`);
});

matchingWorker.on('failed', (job, err) => {
    logger.error(`Matching job ${job?.id} (${job?.name}) failed: ${err.message}`);
});
