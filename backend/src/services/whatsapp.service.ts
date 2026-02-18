import { env } from '../config/env';
import logger from '../config/logger';

// Meta WhatsApp Cloud API
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

export const sendWhatsAppMessage = async (to: string, templateName: string, languageCode = 'en_US', components?: any[]): Promise<boolean> => {
    const phoneId = env.META_WHATSAPP_PHONE_ID;
    const token = env.META_WHATSAPP_TOKEN;

    if (!phoneId || !token) {
        logger.warn('Meta WhatsApp credentials missing - Message not sent');
        return false;
    }

    try {
        const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

        // Basic template message structure
        // Customize payload based on needs (text, template, interactive)
        const payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode,
                },
                components: components || [],
            },
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            logger.error(`WhatsApp API Error: ${JSON.stringify(data)}`);
            return false;
        }

        logger.info(`WhatsApp message sent to ${to}`);
        return true;
    } catch (error) {
        logger.error('Failed to send WhatsApp message:', error);
        return false;
    }
};
