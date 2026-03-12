import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const ES_REINDEX_QUEUE_NAME = 'es-reindex-queue';

export const esReindexQueue = new Queue(ES_REINDEX_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

esReindexQueue.on('error', (err) => {
  logger.error('ES Reindex Queue Error:', err);
});

logger.info(`ES Reindex Queue initialized: ${ES_REINDEX_QUEUE_NAME}`);

export interface ReindexJobData {
  indexType: 'job' | 'candidate';
  documentId: string;
  action: 'index' | 'delete';
}

export async function addReindexJob(data: ReindexJobData) {
  return esReindexQueue.add('reindex', data, {
    // Deduplicate: if same doc is queued multiple times, only process once
    jobId: `reindex:${data.indexType}:${data.documentId}:${data.action}`,
  });
}
