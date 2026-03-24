import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { env } from '../config/env';
import logger from '../config/logger';
import { MATCHING_QUEUE_NAME } from './matching.queue';
import { matchingService } from '../services/matching.service';
import { notificationService } from '../services/notification.service';
import { prisma } from '../config/prisma';
import { withExtractedContext, SpanKind } from '../utils/trace-propagation';

interface MatchCandidatesData {
  jobId: string;
}

interface MatchJobsData {
  userId: string;
}

type MatchingJobData = MatchCandidatesData | MatchJobsData;

export function createMatchingWorker(): Worker<MatchingJobData> {
  const worker = new Worker<MatchingJobData>(
    MATCHING_QUEUE_NAME,
    async (job: Job<MatchingJobData>) => {
      const traceCtx = (job.data as Record<string, any>)?._traceContext || {};
      return withExtractedContext(
        traceCtx,
        `bullmq.process ${job.name}`,
        SpanKind.CONSUMER,
        async () => {
          const TIMEOUT_MS = 60_000;
          const timeoutId = setTimeout(() => {
            /* safety net */
          }, TIMEOUT_MS);
          try {
            const processJob = async () => {
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
                        // Create JobCandidateMatch record
                        await prisma.jobCandidateMatch.upsert({
                          where: {
                            jobId_candidateId: {
                              jobId,
                              candidateId: match.userId,
                            },
                          },
                          update: {
                            matchScore: match.score,
                          },
                          create: {
                            jobId,
                            candidateId: match.userId,
                            matchScore: match.score,
                            notificationsSent: false,
                          },
                        });

                        // Send multi-channel notification (email, SMS, WhatsApp, FCM, web push, in-app)
                        await notificationService.notifyJobMatch(
                          match.userId,
                          jobTitle,
                          companyName,
                          jobId,
                          match.score
                        );

                        // Mark as fully notified
                        await prisma.jobCandidateMatch.update({
                          where: {
                            jobId_candidateId: { jobId, candidateId: match.userId },
                          },
                          data: {
                            notificationsSent: true,
                            emailSent: true,
                            pushSent: true,
                            smsSent: true,
                            whatsappSent: true,
                            notifiedAt: new Date(),
                          },
                        });

                        notified++;
                      } catch (error) {
                        logger.error(
                          `Failed to notify candidate ${match.userId} about job ${jobId}`,
                          error
                        );
                      }
                    }
                  }

                  // Notify employer about matching candidates
                  if (notified > 0 && jobDetails.company?.userId) {
                    notificationService
                      .notifyMatchingCandidatesFound(
                        jobDetails.company.userId,
                        jobId,
                        jobTitle,
                        notified
                      )
                      .catch(() => {});
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

                  // Notify candidate about top matching jobs (score >= 0.5)
                  let notified = 0;
                  for (const match of matches) {
                    if (match.score >= 0.5) {
                      try {
                        await notificationService.notifyJobMatch(
                          userId,
                          match.title,
                          match.companyName,
                          match.jobId,
                          match.score
                        );
                        notified++;
                      } catch (error) {
                        logger.error(
                          `Failed to notify user ${userId} about job ${match.jobId}`,
                          error
                        );
                      }
                    }
                  }

                  logger.info(`Notified user ${userId} about ${notified} matching jobs`);
                  return { matchCount: matches.length, notifiedCount: notified };
                }

                default:
                  logger.warn(`Unknown matching job name: ${job.name}`);
                  return null;
              }
            };

            return await Promise.race([
              processJob(),
              new Promise<never>((_resolve, reject) =>
                setTimeout(() => reject(new Error('Matching worker timeout after 60s')), TIMEOUT_MS)
              ),
            ]);
          } finally {
            clearTimeout(timeoutId);
          }
        }
      );
    },
    {
      connection: redis,
      concurrency: parseInt(env.BULLMQ_MATCHING_CONCURRENCY, 10),
      lockDuration: 300000, // 5 min — matching is CPU/IO heavy
      stalledInterval: 120000,
      limiter: {
        max: 5,
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Matching job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Matching job ${job?.id} (${job?.name}) failed: ${err.message}`);
  });

  return worker;
}
