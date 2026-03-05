import type { Worker } from 'bullmq';
import logger from '../config/logger';

// Essential (on-demand) workers — each creates 1 blocking Redis connection
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

// Combined scheduler worker — handles ALL periodic/cron jobs through
// a single Worker (1 blocking connection) instead of 8 separate workers.
import { schedulerWorker } from './scheduler.worker';

// Import periodic queue files to register their repeatable jobs.
// These all funnel into the shared scheduler queue (no extra connections).
import './job-expiration.queue';
import './token-cleanup.queue';
import './sla-check.queue';
import './job-alert.queue';
import './profile-reminder.queue';
import './scheduled-publish.queue';
import './weekly-digest.queue';
import './backup.queue';
import './data-export.queue';

// Scheduler queue for stale job cleanup
import { schedulerQueue } from './scheduler.queue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workers: Worker<any>[] = [
  // On-demand workers (10)
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
  // Combined scheduler (1 — replaces 8 individual periodic workers)
  schedulerWorker,
];

/**
 * Clean up stale repeatable jobs before the queue files re-register them.
 * All periodic jobs now live in the single scheduler queue.
 */
async function cleanStaleRepeatableJobs(): Promise<void> {
  try {
    const repeatableJobs = await schedulerQueue.getRepeatableJobs();
    for (const rj of repeatableJobs) {
      await schedulerQueue.removeRepeatableByKey(rj.key);
      logger.debug(`Removed stale repeatable job: ${rj.key}`);
    }
    if (repeatableJobs.length > 0) {
      logger.info(`Cleaned ${repeatableJobs.length} stale repeatable job(s) from scheduler-queue`);
    }
  } catch (error) {
    logger.error('Failed to clean repeatable jobs from scheduler-queue:', error);
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
