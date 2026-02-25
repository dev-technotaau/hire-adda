import twilio from 'twilio';
import { env } from '../config/env';
import logger from '../config/logger';
import { isFeatureEnabled } from '../config/feature-flags';

let twilioClient: twilio.Twilio | null = null;

try {
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
        twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        logger.info('📱 Twilio client initialized');
    } else {
        logger.warn('⚠️ Twilio credentials missing - SMS disabled');
    }
} catch (error) {
    logger.error('❌ Twilio initialization failed:', error);
}

export const sendSMS = async (to: string, body: string): Promise<boolean> => {
    if (!await isFeatureEnabled('enableSMS')) {
        logger.debug('SMS disabled via feature flag — skipping');
        return false;
    }

    if (!twilioClient || !env.TWILIO_PHONE_NUMBER) {
        logger.warn('Attempted to send SMS but Twilio is not configured');
        return false;
    }

    await twilioClient.messages.create({
        body,
        from: env.TWILIO_PHONE_NUMBER,
        to,
    });
    logger.info(`SMS sent to ${to}`);
    return true;
};
