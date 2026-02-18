import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import prisma from '../config/prisma';
import { RESUME_PARSE_QUEUE_NAME } from './resume-parse.queue';
import { parseResume } from '../services/resume-parser.service';
import { notificationService } from '../services/notification.service';

interface ResumeParseJobData {
    userId: string;
    candidateProfileId: string;
    resumeUrl: string;
    mimeType: string;
}

export const resumeParseWorker = new Worker<ResumeParseJobData>(
    RESUME_PARSE_QUEUE_NAME,
    async (job: Job<ResumeParseJobData>) => {
        const { userId, candidateProfileId, resumeUrl, mimeType } = job.data;

        logger.info(`Processing resume parse job ${job.id} for user ${userId}`);

        try {
            // Fetch the resume file
            const response = await fetch(resumeUrl, {
                signal: AbortSignal.timeout(30000),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch resume: HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);

            // Parse with Document AI
            const parsed = await parseResume(fileBuffer, mimeType);

            if (!parsed) {
                logger.warn(`Resume parsing returned null for user ${userId}`);
                return { success: false, reason: 'parsing_returned_null' };
            }

            // Store parsed data
            await prisma.candidateProfile.update({
                where: { id: candidateProfileId },
                data: { parsedResumeData: parsed as any },
            });

            // Notify user
            await notificationService.send({
                userId,
                title: 'Resume Parsed Successfully',
                message: 'Your resume has been analyzed by AI. Review the extracted data in your profile.',
                type: 'INFO',
                category: 'profile',
                link: '/candidate/profile',
                channels: ['in_app'],
            });

            logger.info(`Resume parsed for user ${userId}: ${parsed.skills.length} skills found`);
            return { success: true, skillCount: parsed.skills.length };
        } catch (error) {
            logger.error(`Resume parse failed for user ${userId}:`, error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 2,
    }
);

resumeParseWorker.on('completed', (job) => {
    logger.info(`Resume parse job ${job.id} completed`);
});

resumeParseWorker.on('failed', (job, err) => {
    logger.error(`Resume parse job ${job?.id} failed: ${err.message}`);
});
