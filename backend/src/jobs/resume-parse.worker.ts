import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { redis } from '../config/redis';
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
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      const response = await fetch(resumeUrl, {
        signal: AbortSignal.timeout(30000), // eslint-disable-line n/no-unsupported-features/node-builtins
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resume: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // Parse with Document AI (includes pre and post processing)
      const result = await parseResume(fileBuffer, mimeType);

      if (!result) {
        logger.warn(`Resume parsing returned null for user ${userId}`);
        return { success: false, reason: 'parsing_returned_null' };
      }

      const { data: parsed, confidence, warnings, metadata } = result;

      // Store parsed data with metadata
      await prisma.candidateProfile.update({
        where: { id: candidateProfileId },
        data: {
          parsedResumeData: {
            ...parsed,
            _metadata: {
              confidence: confidence.overall,
              confidenceFields: confidence.fields,
              warnings,
              parsedAt: new Date().toISOString(),
              fileSize: metadata.originalSize,
              mimeType: metadata.mimeType,
              hasImages: metadata.hasImages,
            },
          } as any,
        },
      });

      // Notify user with confidence info
      const confidencePct = Math.round(confidence.overall * 100);
      const hasWarnings = warnings.length > 0;

      await notificationService.send({
        userId,
        title: hasWarnings ? 'Resume Parsed - Review Needed' : 'Resume Parsed Successfully',
        message: hasWarnings
          ? `Your resume has been analyzed (${confidencePct}% confidence). Please review the extracted data as some fields may need correction.`
          : `Your resume has been analyzed with ${confidencePct}% confidence. Review the extracted data in your profile.`,
        type: hasWarnings ? 'WARNING' : 'INFO',
        category: 'profile',
        link: '/candidate/profile',
        channels: ['in_app', 'fcm', 'web_push'],
      });

      logger.info(
        `Resume parsed for user ${userId}: ${parsed.skills.length} skills, ` +
          `${parsed.experience.length} experience, confidence=${confidencePct}%, warnings=${warnings.length}`
      );

      return {
        success: true,
        skillCount: parsed.skills.length,
        experienceCount: parsed.experience.length,
        confidence: confidencePct,
        warningCount: warnings.length,
      };
    } catch (error) {
      logger.error(`Resume parse failed for user ${userId}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2,
    lockDuration: 300000, // 5 min — fetches file + calls Document AI
    stalledInterval: 120000,
  }
);

resumeParseWorker.on('completed', (job) => {
  logger.info(`Resume parse job ${job.id} completed`);
});

resumeParseWorker.on('failed', (job, err) => {
  logger.error(`Resume parse job ${job?.id} failed: ${err.message}`);
});
