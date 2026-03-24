import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { env } from '../config/env';
import logger from '../config/logger';
import { SCHEDULER_QUEUE_NAME } from './scheduler.queue';
import { withExtractedContext, SpanKind } from '../utils/trace-propagation';
import { handleJobExpiration } from './job-expiration.worker';
import { handleTokenCleanup } from './token-cleanup.worker';
import { handleJobAlert } from './job-alert.worker';
import { handleSlaCheck } from './sla-check.worker';
import { handleProfileReminder } from './profile-reminder.worker';
import { handleScheduledPublish } from './scheduled-publish.worker';
import { handleWeeklyDigest } from './weekly-digest.worker';
import { handleDataExport, handleExportCleanup } from './data-export.worker';
import { handleDbBackup, handleBackupCleanup } from './backup.worker';
import { handleExpirationWarning } from './expiration-warning.worker';
import { handleReviewReminder } from './review-reminder.worker';
import { handleStaleProfileCheck } from './stale-profile.worker';
import { handleViewCounterFlush } from './view-counter-flush.worker';

/**
 * Combined scheduler worker — processes ALL periodic/cron jobs through
 * a single BullMQ Worker (1 blocking Redis connection) instead of many
 * separate Workers.
 */
export function createSchedulerWorker(): Worker {
  const worker = new Worker(
    SCHEDULER_QUEUE_NAME,
    async (job: Job) => {
      const traceCtx = (job.data as Record<string, any>)?._traceContext || {};
      return withExtractedContext(
        traceCtx,
        `bullmq.process ${job.name}`,
        SpanKind.CONSUMER,
        async () => {
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
            case 'export-cleanup':
              return handleExportCleanup(job);
            case 'send-expiration-warnings':
              return handleExpirationWarning(job);
            case 'send-review-reminders':
              return handleReviewReminder(job);
            case 'check-stale-profiles':
              return handleStaleProfileCheck(job);
            case 'flush-view-counters':
              return handleViewCounterFlush(job);
            default:
              logger.warn(`Unknown scheduler job name: ${job.name}`);
              return null;
          }
        }
      );
    },
    {
      connection: redis,
      concurrency: parseInt(env.BULLMQ_SCHEDULER_CONCURRENCY, 10),
      lockDuration: 300000, // 5 min — some periodic tasks are heavy
      stalledInterval: 120000,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Scheduler job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Scheduler job ${job?.id} (${job?.name}) failed: ${err.message}`);
  });

  return worker;
}
