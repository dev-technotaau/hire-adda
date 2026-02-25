import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { PROFILE_REMINDER_QUEUE_NAME } from './profile-reminder.queue';
import prisma from '../config/prisma';
import { notificationService } from '../services/notification.service';
import { profileCompletionReminder } from '../templates/email/onboarding';
import { profileCompletionWhatsapp } from '../templates/whatsapp';

export const profileReminderWorker = new Worker(
    PROFILE_REMINDER_QUEUE_NAME,
    async (job: Job) => {
        logger.info(`Processing profile completion reminders ${job.id}`);

        // Find candidates with incomplete profiles (< 80%) who registered > 3 days ago
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const candidates = await prisma.candidateProfile.findMany({
            where: {
                profileCompleteness: { lt: 80 },
                user: {
                    role: 'CANDIDATE',
                    isEmailVerified: true,
                    createdAt: { lt: threeDaysAgo },
                },
            },
            select: {
                userId: true,
                profileCompleteness: true,
                user: { select: { email: true, firstName: true, mobileNumber: true, whatsappNumber: true, isWhatsappVerified: true } },
            },
            take: 200, // Process in batches
        });

        let sentCount = 0;
        for (const candidate of candidates) {
            try {
                const progress = candidate.profileCompleteness || 0;
                const name = candidate.user.firstName || 'Candidate';
                const emailTmpl = profileCompletionReminder(name, progress);

                const channels: ('in_app' | 'email' | 'whatsapp')[] = ['in_app', 'email'];
                let whatsappOptions;

                const whatsappTarget = candidate.user.whatsappNumber || candidate.user.mobileNumber;
                if (candidate.user.isWhatsappVerified && whatsappTarget) {
                    channels.push('whatsapp');
                    const waTmpl = profileCompletionWhatsapp(name, progress);
                    whatsappOptions = { to: whatsappTarget, templateName: waTmpl.templateName, components: waTmpl.components };
                }

                await notificationService.send({
                    userId: candidate.userId,
                    title: 'Complete Your Profile',
                    message: `Your profile is ${progress}% complete. Complete it to get more job matches.`,
                    type: 'INFO',
                    category: 'onboarding',
                    link: '/candidate/profile',
                    channels,
                    emailOptions: {
                        to: candidate.user.email,
                        subject: emailTmpl.subject,
                        html: emailTmpl.html,
                        text: emailTmpl.text,
                    },
                    whatsappOptions,
                });
                sentCount++;
            } catch (error) {
                logger.debug(`Failed to send profile reminder to ${candidate.userId}`);
            }
        }

        logger.info(`Profile completion reminders sent: ${sentCount}/${candidates.length}`);
        return { sent: sentCount, total: candidates.length };
    },
    {
        connection: createBullMQConnection(),
        concurrency: 1,
        lockDuration: 120000,
    }
);

profileReminderWorker.on('completed', (job) => {
    logger.info(`Profile reminder job ${job.id} completed`);
});

profileReminderWorker.on('failed', (job, err) => {
    logger.error(`Profile reminder job ${job?.id} failed: ${err.message}`);
});
