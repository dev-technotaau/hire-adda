import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const PROFILE_REMINDER_QUEUE_NAME = 'profile-reminder-queue';

export const profileReminderQueue = new Queue(PROFILE_REMINDER_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// Run profile completion reminders weekly on Mondays at 10 AM
profileReminderQueue.add('send-profile-reminders', {}, {
    repeat: { pattern: '0 10 * * 1' },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
}).catch(err => {
    logger.error('Failed to add repeatable profile reminder job:', err);
});

profileReminderQueue.on('error', (err) => {
    logger.error('Profile Reminder Queue Error:', err);
});

logger.info(`Profile Reminder Queue initialized: ${PROFILE_REMINDER_QUEUE_NAME}`);
