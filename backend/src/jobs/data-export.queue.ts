import logger from '../config/logger';
import { schedulerQueue } from './scheduler.queue';

export const DATA_EXPORT_QUEUE_NAME = 'export-data';

// Re-export scheduler queue for backward compatibility
export const dataExportQueue = schedulerQueue;

logger.info(`Data Export scheduled on: scheduler-queue`);

// Helper function to add data export jobs
export const addDataExportJob = async (data: {
  userId: string;
  exportType: 'USER_DATA' | 'CANDIDATE_EXPORT';
  email?: string;
  format?: 'csv' | 'xlsx' | 'json';
  candidateIds?: string[];
}) => {
  return await schedulerQueue.add('export-data', data, {
    priority: data.exportType === 'USER_DATA' ? 1 : 2,
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  });
};
