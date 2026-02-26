import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';
import { SCHEDULER_QUEUE_NAME } from './scheduler.queue';
import { handleJobExpiration } from './job-expiration.worker';
import { handleTokenCleanup } from './token-cleanup.worker';
import { handleJobAlert } from './job-alert.worker';
import { handleSlaCheck } from './sla-check.worker';
import { handleProfileReminder } from './profile-reminder.worker';
import { handleScheduledPublish } from './scheduled-publish.worker';
import { handleWeeklyDigest } from './weekly-digest.worker';
import { handleDataExport } from './data-export.worker';
import { handleDbBackup, handleBackupCleanup } from './backup.worker';

/**
 * Combined scheduler worker — processes ALL periodic/cron jobs through
 * a single BullMQ Worker (1 blocking Redis connection) instead of 8
 * separate Workers (8 blocking connections).
 */
export const schedulerWorker = new Worker(
  SCHEDULER_QUEUE_NAME,
  async (job: Job) => {
    switch (job.name) {
      case 'check-expired-jobs':
        return handleJobExpiration(job);
      case 'cleanup-tokens':
        return handleTokenCleanup(job);
      case 'process-alerts':
        return handleJobAlert(job);
      case 'check-sla-breaches':
        return handleSlaCheck(job);
      case 'send-profile-reminders':
        return handleProfileReminder(job);
      case 'check-scheduled-jobs':
        return handleScheduledPublish(job);
      case 'send-weekly-digest':
        return handleWeeklyDigest(job);
      case 'export-data':
        return handleDataExport(job);
      case 'db-backup':
        return handleDbBackup(job);
      case 'backup-cleanup':
        return handleBackupCleanup(job);
      default:
        logger.warn(`Unknown scheduler job name: ${job.name}`);
        return null;
    }
  },
  {
    connection: redis,
    concurrency: 2,
    lockDuration: 300000, // 5 min — some periodic tasks are heavy
    stalledInterval: 120000,
  }
);

schedulerWorker.on('completed', (job) => {
  logger.info(`Scheduler job ${job.id} (${job.name}) completed`);
});

schedulerWorker.on('failed', (job, err) => {
  logger.error(`Scheduler job ${job?.id} (${job?.name}) failed: ${err.message}`);
});
