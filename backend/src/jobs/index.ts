import type { Queue, Worker } from 'bullmq';
import logger from '../config/logger';
import { emailWorker } from './email.worker';
import { smsWorker } from './sms.worker';
import { fcmWorker } from './fcm.worker';
import { webPushWorker } from './web-push.worker';
import { inAppWorker } from './in-app.worker';
import { whatsappWorker } from './whatsapp.worker';
import { webhookWorker } from './webhook.worker';
import { matchingWorker } from './matching.worker';
import { geocodingWorker } from './geocoding.worker';
import { resumeParseWorker } from './resume-parse.worker';
import { jobExpirationWorker } from './job-expiration.worker';
import { tokenCleanupWorker } from './token-cleanup.worker';
import { jobAlertWorker } from './job-alert.worker';
import { dataExportWorker } from './data-export.worker';
import { slaCheckWorker } from './sla-check.worker';
import { profileReminderWorker } from './profile-reminder.worker';
import { scheduledPublishWorker } from './scheduled-publish.worker';
import { weeklyDigestWorker } from './weekly-digest.worker';
import { jobExpirationQueue } from './job-expiration.queue';
import { tokenCleanupQueue } from './token-cleanup.queue';
import { slaCheckQueue } from './sla-check.queue';
import { jobAlertQueue } from './job-alert.queue';
import { profileReminderQueue } from './profile-reminder.queue';
import { scheduledPublishQueue } from './scheduled-publish.queue';
import { weeklyDigestQueue } from './weekly-digest.queue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workers: Worker<any>[] = [
  emailWorker,
  smsWorker,
  fcmWorker,
  webPushWorker,
  inAppWorker,
  whatsappWorker,
  webhookWorker,
  matchingWorker,
  geocodingWorker,
  resumeParseWorker,
  jobExpirationWorker,
  tokenCleanupWorker,
  jobAlertWorker,
  dataExportWorker,
  slaCheckWorker,
  profileReminderWorker,
  scheduledPublishWorker,
  weeklyDigestWorker,
];

/**
 * Clean up stale repeatable jobs before the queue files re-register them.
 * This prevents duplicate repeatables when cron patterns or job names change.
 */
async function cleanStaleRepeatableJobs(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repeatableQueues: Queue<any>[] = [
    jobExpirationQueue,
    tokenCleanupQueue,
    slaCheckQueue,
    jobAlertQueue,
    profileReminderQueue,
    scheduledPublishQueue,
    weeklyDigestQueue,
  ];

  for (const queue of repeatableQueues) {
    try {
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const rj of repeatableJobs) {
        await queue.removeRepeatableByKey(rj.key);
        logger.debug(`Removed stale repeatable job: ${rj.key} from ${queue.name}`);
      }
      if (repeatableJobs.length > 0) {
        logger.info(`Cleaned ${repeatableJobs.length} stale repeatable job(s) from ${queue.name}`);
      }
    } catch (error) {
      logger.error(`Failed to clean repeatable jobs from ${queue.name}:`, error);
    }
  }
}

export async function closeAllWorkers() {
  await Promise.allSettled(workers.map((w) => w.close()));
  logger.info('All BullMQ workers closed');
}

// Clean stale repeatables on startup, then log initialization
cleanStaleRepeatableJobs()
  .then(() => logger.info(`Initialized ${workers.length} BullMQ workers (repeatable jobs cleaned)`))
  .catch((err) => {
    logger.error('Failed to clean stale repeatable jobs:', err);
    logger.info(`Initialized ${workers.length} BullMQ workers`);
  });
