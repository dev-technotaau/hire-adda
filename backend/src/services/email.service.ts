import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../config/logger';
import { isFeatureEnabled } from '../config/feature-flags';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(env.SMTP_PORT || '587', 10),
  secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Send an email
 * @param options - Email options (to, subject, html, text)
 * @returns info about the sent message
 */
export const sendEmail = async (options: EmailOptions): Promise<any> => {
  try {
    if (!(await isFeatureEnabled('enableEmailNotifications'))) {
      logger.debug('Email disabled via feature flag — skipping');
      return { messageId: 'flag-disabled' };
    }

    if (env.NODE_ENV === 'test') {
      logger.info(`[TEST] Email sent to ${options.to}: ${options.subject}`);
      return { messageId: 'test-id' };
    }

    const info = await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.EMAIL_FROM}>`, // sender address
      to: options.to, // list of receivers
      replyTo: options.replyTo || env.EMAIL_REPLY_TO || env.EMAIL_FROM, // reply-to address
      subject: options.subject, // Subject line
      text: options.text, // plain text body
      html: options.html, // html body
    });

    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Verify transporter connection
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    if (env.NODE_ENV === 'test') return true;
    await transporter.verify();
    logger.info('Email service connected');
    return true;
  } catch (error) {
    logger.error('Email service connection failed:', error);
    return false;
  }
};

export const emailService = {
  sendEmail,
  verifyEmailConnection,
};
