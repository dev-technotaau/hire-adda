import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import logger from '../config/logger';
import { collectUserData } from '../services/data-export.service';
import { emailQueue } from './email.queue';
import { DATA_EXPORT_QUEUE_NAME } from './data-export.queue';

interface DataExportJob {
    userId: string;
    email: string;
}

const worker = new Worker<DataExportJob>(
    DATA_EXPORT_QUEUE_NAME,
    async (job: Job<DataExportJob>) => {
        const { userId, email } = job.data;
        logger.info(`Processing data export for user ${userId}`);

        const data = await collectUserData(userId);
        const jsonStr = JSON.stringify(data, null, 2);

        // For now, send the data as an email attachment inline.
        // In production, upload to R2 and email a signed download link.
        await emailQueue.add('send-email', {
            to: email,
            subject: 'Your Data Export - Talent Bridge',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Your Data Export is Ready</h2>
                    <p>Hi,</p>
                    <p>As requested, we've compiled all your personal data from Talent Bridge.</p>
                    <p>Your exported data is attached below as a JSON file. This includes your profile information, saved jobs, notifications, consent records, devices, and activity logs.</p>
                    <p>This data was exported on <strong>${data.exportedAt}</strong>.</p>
                    <p>If you did not request this export, please contact us immediately.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `talent-bridge-data-export-${new Date().toISOString().split('T')[0]}.json`,
                    content: jsonStr,
                    contentType: 'application/json',
                },
            ],
        });

        logger.info(`Data export completed and emailed for user ${userId}`);
    },
    {
        connection: redis,
        concurrency: 2,
        limiter: { max: 5, duration: 60000 },
    },
);

worker.on('completed', (job) => {
    logger.info(`Data export job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    logger.error(`Data export job ${job?.id} failed:`, err);
});

export { worker as dataExportWorker };
