import { JobServiceClient } from '@google-cloud/talent';
import { env } from './env';
import logger from './logger';

let jobClient: JobServiceClient | null = null;

try {
    if (env.GOOGLE_CLOUD_PROJECT_ID && env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
        const credentials = {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
        };

        jobClient = new JobServiceClient({ credentials, projectId: env.GOOGLE_CLOUD_PROJECT_ID });

        logger.info('🤝 Google Cloud Talent Solution initialized');
    } else {
        logger.warn('⚠️ Google Cloud credentials missing - Talent Solution disabled');
    }
} catch (error) {
    logger.error('❌ Talent Solution initialization failed:', error);
}

export { jobClient };
