import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { WEEKLY_DIGEST_QUEUE_NAME } from './weekly-digest.queue';
import prisma from '../config/prisma';
import { emailQueue } from './email.queue';

export const weeklyDigestWorker = new Worker(
    WEEKLY_DIGEST_QUEUE_NAME,
    async (job: Job) => {
        logger.info(`Processing weekly digest ${job.id}`);

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Find all employers with weeklyDigest enabled
        const employers = await prisma.companyProfile.findMany({
            where: {
                user: { role: 'EMPLOYER', isEmailVerified: true },
            },
            select: {
                id: true,
                userId: true,
                companyName: true,
                notificationPreferences: true,
                user: { select: { email: true, firstName: true } },
            },
        });

        let sentCount = 0;
        for (const employer of employers) {
            try {
                // Check weeklyDigest preference (default true if not set)
                const prefs = employer.notificationPreferences as Record<string, boolean> | null;
                if (prefs?.weeklyDigest === false) continue;

                // Gather weekly stats for this employer
                const companyId = employer.id;
                const [newApplications, activeJobs, interviewsScheduled, hires] = await Promise.all([
                    prisma.jobApplication.count({
                        where: { job: { companyId }, appliedAt: { gte: oneWeekAgo } },
                    }),
                    prisma.jobPost.count({
                        where: { companyId, status: 'OPEN' },
                    }),
                    prisma.jobApplication.count({
                        where: {
                            job: { companyId },
                            status: 'INTERVIEW_SCHEDULED',
                            updatedAt: { gte: oneWeekAgo },
                        },
                    }),
                    prisma.jobApplication.count({
                        where: {
                            job: { companyId },
                            status: 'HIRED',
                            updatedAt: { gte: oneWeekAgo },
                        },
                    }),
                ]);

                // Skip if no activity this week
                if (newApplications === 0 && interviewsScheduled === 0 && hires === 0) continue;

                const name = employer.user.firstName || 'Hiring Manager';
                const company = employer.companyName || 'your company';

                await emailQueue.add('send-email', {
                    to: employer.user.email,
                    subject: `Your Weekly Hiring Digest — ${company}`,
                    html: `
                        <h2>Weekly Hiring Digest</h2>
                        <p>Hi ${name},</p>
                        <p>Here's a summary of your hiring activity for the past week:</p>
                        <table style="border-collapse:collapse;width:100%;max-width:500px;">
                            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>New Applications</strong></td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${newApplications}</td></tr>
                            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Active Job Postings</strong></td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${activeJobs}</td></tr>
                            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Interviews Scheduled</strong></td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${interviewsScheduled}</td></tr>
                            <tr><td style="padding:8px;"><strong>New Hires</strong></td><td style="padding:8px;text-align:right;">${hires}</td></tr>
                        </table>
                        <p style="margin-top:20px;"><a href="${process.env.FRONTEND_URL}/employer/analytics">View Full Analytics</a></p>
                        <p style="color:#888;font-size:12px;margin-top:30px;">You can disable this digest in your <a href="${process.env.FRONTEND_URL}/employer/settings">notification settings</a>.</p>
                    `,
                    text: `Weekly Hiring Digest — ${company}\n\nNew Applications: ${newApplications}\nActive Jobs: ${activeJobs}\nInterviews Scheduled: ${interviewsScheduled}\nNew Hires: ${hires}\n\nView analytics: ${process.env.FRONTEND_URL}/employer/analytics`,
                });

                sentCount++;
            } catch (error) {
                logger.debug(`Failed to send weekly digest to employer ${employer.userId}`);
            }
        }

        logger.info(`Weekly digests sent: ${sentCount}/${employers.length}`);
        return { sent: sentCount, total: employers.length };
    },
    {
        connection: createBullMQConnection(),
        concurrency: 1,
        lockDuration: 300000, // 5 min — processes all employers
    }
);

weeklyDigestWorker.on('completed', (job) => {
    logger.info(`Weekly digest job ${job.id} completed`);
});

weeklyDigestWorker.on('failed', (job, err) => {
    logger.error(`Weekly digest job ${job?.id} failed: ${err.message}`);
});
