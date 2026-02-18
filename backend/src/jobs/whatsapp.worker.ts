import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import logger from '../config/logger';
import { WHATSAPP_QUEUE_NAME } from './whatsapp.queue';
import { sendWhatsAppMessage } from '../services/whatsapp.service';

interface WhatsAppJobData {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: any[];
}

export const whatsappWorker = new Worker<WhatsAppJobData>(
    WHATSAPP_QUEUE_NAME,
    async (job: Job<WhatsAppJobData>) => {
        logger.info(`Processing WhatsApp job ${job.id} to ${job.data.to}`);

        try {
            const sent = await sendWhatsAppMessage(
                job.data.to,
                job.data.templateName,
                job.data.languageCode || 'en_US',
                job.data.components
            );
            if (!sent) {
                logger.warn(`WhatsApp not sent to ${job.data.to} - service may be unconfigured`);
            }
            return { sent };
        } catch (error) {
            logger.error(`Failed to send WhatsApp to ${job.data.to}:`, error);
            throw error;
        }
    },
    {
        connection: createBullMQConnection(),
        concurrency: 10, // WhatsApp Cloud API has high throughput
        limiter: {
            max: 20,
            duration: 1000,
        },
    }
);

whatsappWorker.on('completed', (job) => {
    logger.info(`WhatsApp job ${job.id} completed`);
});

whatsappWorker.on('failed', (job, err) => {
    logger.error(`WhatsApp job ${job?.id} failed: ${err.message}`);
});
