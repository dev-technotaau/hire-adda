import { env } from '../config/env';
import logger from '../config/logger';
import { isFeatureEnabled } from '../config/feature-flags';

// Meta WhatsApp Cloud API
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

export const sendWhatsAppMessage = async (
  to: string,
  templateName: string,
  languageCode = 'en_US',
  components?: any[]
): Promise<boolean> => {
  if (!(await isFeatureEnabled('enableWhatsApp'))) {
    logger.debug('WhatsApp disabled via feature flag — skipping');
    return false;
  }

  const phoneId = env.META_WHATSAPP_PHONE_ID;
  const token = env.META_WHATSAPP_TOKEN;

  if (!phoneId || !token) {
    logger.warn('Meta WhatsApp credentials missing - Message not sent');
    return false;
  }

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: components || [],
    },
  };

  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(`WhatsApp API ${response.status}: ${JSON.stringify(data)}`);
  }

  logger.info(`WhatsApp message sent to ${to}`);
  return true;
};
