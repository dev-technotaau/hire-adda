import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { JOB_ALERT_QUEUE_NAME } from './job-alert.queue';
import { jobAlertService } from '../services/job-alert.service';

export const jobAlertWorker = new Worker(
    JOB_ALERT_QUEUE_NAME,
    async (job: Job) => {
        logger.info(`Processing job alerts ${job.id}`);

        try {
            await jobAlertService.processAlerts();
            return { processed: true };
        } catch (error) {
            logger.error('Job alert processing failed:', error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 1,
    }
);

jobAlertWorker.on('completed', (job) => {
    logger.info(`Job alert processing ${job.id} completed`);
});

jobAlertWorker.on('failed', (job, err) => {
    logger.error(`Job alert processing ${job?.id} failed: ${err.message}`);
});
