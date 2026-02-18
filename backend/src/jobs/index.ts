import type { Worker } from 'bullmq';
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
];

export async function closeAllWorkers() {
    await Promise.allSettled(workers.map((w) => w.close()));
    logger.info('All BullMQ workers closed');
}

logger.info(`Initialized ${workers.length} BullMQ workers`);
