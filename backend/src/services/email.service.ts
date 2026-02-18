import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../config/logger';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
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
        if (env.NODE_ENV === 'test') {
            logger.info(`[TEST] Email sent to ${options.to}: ${options.subject}`);
            return { messageId: 'test-id' };
        }

        const info = await transporter.sendMail({
            from: `"${env.SMTP_FROM_NAME}" <${env.EMAIL_FROM}>`, // sender address
            to: options.to, // list of receivers
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

/**
 * Send Application Received Email (to Candidate)
 */
export const sendApplicationReceived = async (email: string, jobTitle: string, companyName: string) => {
    return sendEmail({
        to: email,
        subject: `Application Received: ${jobTitle}`,
        html: `
            <h1>Application Received</h1>
            <p>You have successfully applied for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
            <p>The employer will review your application and get back to you.</p>
            <p>Good luck!</p>
        `,
        text: `You have successfully applied for ${jobTitle} at ${companyName}.`
    });
};

/**
 * Send Application Status Update Email (to Candidate)
 */
export const sendApplicationStatusUpdate = async (email: string, jobTitle: string, companyName: string, status: string) => {
    return sendEmail({
        to: email,
        subject: `Application Status Update: ${jobTitle}`,
        html: `
            <h1>Application Status Update</h1>
            <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
            <p>New Status: <strong>${status}</strong></p>
            <p>Check your dashboard for more details.</p>
        `,
        text: `Your application for ${jobTitle} at ${companyName} has been updated to: ${status}.`
    });
};

/**
 * Send Verification Status Update Email (to User)
 */
export const sendVerificationStatusUpdate = async (email: string, type: string, status: string, comments?: string) => {
    return sendEmail({
        to: email,
        subject: `Verification Request Update: ${type}`,
        html: `
            <h1>Verification Request Update</h1>
            <p>Your ${type} verification request status is now: <strong>${status}</strong>.</p>
            ${comments ? `<p>Comments: ${comments}</p>` : ''}
        `,
        text: `Your ${type} verification request status is now: ${status}. ${comments ? `Comments: ${comments}` : ''}`
    });
};

export const emailService = {
    sendEmail,
    verifyEmailConnection,
    sendApplicationReceived,
    sendApplicationStatusUpdate,
    sendVerificationStatusUpdate
};
