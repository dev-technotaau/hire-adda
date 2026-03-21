import type { Worker } from 'bullmq';
import { acquireLock, releaseLock, renewLock } from '../utils/distributed-lock';
import { updateService } from '../config/service-status';
import logger from '../config/logger';

import { createEmailWorker } from './email.worker';
import { createSmsWorker } from './sms.worker';
import { createFcmWorker } from './fcm.worker';
import { createWebPushWorker } from './web-push.worker';
import { createInAppWorker } from './in-app.worker';
import { createWhatsappWorker } from './whatsapp.worker';
import { createWebhookWorker } from './webhook.worker';
import { createMatchingWorker } from './matching.worker';
import { createGeocodingWorker } from './geocoding.worker';
import { createResumeParseWorker } from './resume-parse.worker';
import { createEsReindexWorker } from './es-reindex.worker';
import { createOnboardingDripWorker } from './onboarding-drip.worker';
import { createImageProcessingWorker } from './image-processing.worker';
import { createSchedulerWorker } from './scheduler.worker';

const LOCK_KEY = 'tb:worker-leader';
const LOCK_TTL = 30; // seconds — auto-expires if leader crashes
const RENEW_INTERVAL = 10_000; // ms — renew every 10s (3 chances before TTL)
const MONITOR_INTERVAL = 5_000; // ms — standby checks every 5s

/**
 * Manages BullMQ worker lifecycle via Redis-based leader election.
 *
 * In a blue-green deployment, only the leader instance creates Worker objects
 * (each creates a blocking Redis connection). The standby instance runs in
 * API-only mode and auto-promotes if the leader dies or shuts down.
 */
class WorkerLeaderManager {
  private lockValue: string | null = null;
  private timer: NodeJS.Timeout | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private workers: Worker<any>[] = [];
  private _isLeader = false;

  get isLeader(): boolean {
    return this._isLeader;
  }

  /**
   * Try to become the worker leader. If successful, starts all workers.
   * If not, enters standby mode and monitors for leader failure.
   */
  async tryBecomeLeader(): Promise<boolean> {
    this.lockValue = await acquireLock(LOCK_KEY, LOCK_TTL);
    if (this.lockValue) {
      this._isLeader = true;
      this.startWorkers();
      this.startRenewal();
      updateService('BullMQ Workers', 'ready', `Leader — ${this.workers.length} workers`);
      return true;
    }
    // Standby mode — monitor for leader failure
    this.startMonitoring();
    updateService('BullMQ Workers', 'ready', 'Standby — monitoring');
    return false;
  }

  private startWorkers(): void {
    this.workers = [
      createEmailWorker(),
      createSmsWorker(),
      createFcmWorker(),
      createWebPushWorker(),
      createInAppWorker(),
      createWhatsappWorker(),
      createWebhookWorker(),
      createMatchingWorker(),
      createGeocodingWorker(),
      createResumeParseWorker(),
      createEsReindexWorker(),
      createOnboardingDripWorker(),
      createImageProcessingWorker(),
      createSchedulerWorker(),
    ];
    logger.info(`Worker leader elected — started ${this.workers.length} BullMQ workers`);
  }

  /**
   * Periodically renew the leader lock. If renewal fails (lock stolen or Redis down),
   * transition to standby mode.
   */
  private startRenewal(): void {
    this.timer = setInterval(async () => {
      const renewed = await renewLock(LOCK_KEY, this.lockValue!, LOCK_TTL);
      if (!renewed) {
        logger.warn('Lost worker leadership (lock renewal failed)');
        this._isLeader = false;
        await this.stopWorkers();
        updateService('BullMQ Workers', 'ready', 'Standby — monitoring');
        this.startMonitoring();
      }
    }, RENEW_INTERVAL);
  }

  /**
   * Standby mode: poll periodically to check if the leader lock is available.
   * When detected, acquire it and start workers.
   */
  private startMonitoring(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(async () => {
      const acquired = await acquireLock(LOCK_KEY, LOCK_TTL);
      if (acquired) {
        this.lockValue = acquired;
        this._isLeader = true;
        if (this.timer) clearInterval(this.timer);
        this.startWorkers();
        this.startRenewal();
        updateService('BullMQ Workers', 'ready', `Leader — ${this.workers.length} workers`);
      }
    }, MONITOR_INTERVAL);
  }

  private async stopWorkers(): Promise<void> {
    await Promise.allSettled(this.workers.map((w) => w.close()));
    this.workers = [];
    logger.info('Stopped all BullMQ workers');
  }

  /**
   * Graceful shutdown: stop workers and release the leader lock.
   */
  async shutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.stopWorkers();
    if (this.lockValue) {
      await releaseLock(LOCK_KEY, this.lockValue);
      logger.info('Released worker leader lock');
    }
    this._isLeader = false;
  }
}

export const workerLeader = new WorkerLeaderManager();
