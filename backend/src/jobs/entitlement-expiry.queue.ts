import { schedulerQueue } from './scheduler.queue';
import logger from '../config/logger';

/**
 * Daily entitlement expiry sweep cron — runs at 00:30 IST = 19:00 UTC.
 *
 * Marks `Entitlement.status` from ACTIVE → EXPIRED for any rows whose
 * `validUntil` is in the past. Dispatched from `scheduler.worker.ts`.
 */
schedulerQueue
  .add('sweep-expired-entitlements', {}, { repeat: { pattern: '0 19 * * *' } })
  .then(() => logger.info('Registered entitlement expiry cron: 0 19 * * *'))
  .catch((err) => logger.error('Failed to register entitlement expiry cron:', err));
