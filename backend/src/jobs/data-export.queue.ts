import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';

export const DATA_EXPORT_QUEUE_NAME = 'data-export-queue';

export const dataExportQueue = new Queue(DATA_EXPORT_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

dataExportQueue.on('error', (err) => {
    logger.error('Data Export Queue Error:', err);
});

logger.info(`Data Export Queue initialized: ${DATA_EXPORT_QUEUE_NAME}`);

// Helper function to add data export jobs
export const addDataExportJob = async (data: {
    userId: string;
    exportType: 'USER_DATA' | 'CANDIDATE_EXPORT';
    email?: string;
    format?: 'csv' | 'xlsx' | 'json';
    candidateIds?: string[];
}) => {
    return await dataExportQueue.add('export-data', data, {
        priority: data.exportType === 'USER_DATA' ? 1 : 2, // USER_DATA has higher priority
    });
};
