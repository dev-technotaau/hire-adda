import { prisma } from '../config/prisma';
import { NotificationType } from '@prisma/client';
import logger from '../config/logger';
import { emailQueue } from '../jobs/email.queue';
import { smsQueue } from '../jobs/sms.queue';
import { whatsappQueue } from '../jobs/whatsapp.queue';
import { fcmQueue } from '../jobs/fcm.queue';
import { webPushQueue } from '../jobs/web-push.queue';
import { inAppQueue } from '../jobs/in-app.queue';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('notification-service');

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'fcm' | 'web_push' | 'in_app';

interface SendNotificationParams {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    category?: string;
    link?: string;
    metadata?: Record<string, any>;
    channels: NotificationChannel[];
    emailOptions?: {
        to: string;
        subject: string;
        html: string;
        text?: string;
    };
    smsOptions?: {
        to: string;
        body: string;
    };
    whatsappOptions?: {
        to: string;
        templateName: string;
        languageCode?: string;
        components?: any[];
    };
}

class NotificationService {
    /**
     * Send a notification via specified channels
     */
    async send(params: SendNotificationParams): Promise<void> {
        return tracer.startActiveSpan('notification.dispatch', async (span) => {
        span.setAttribute('notification.channels', params.channels.join(','));
        span.setAttribute('notification.userId', params.userId);
        const {
            userId,
            title,
            message,
            type = NotificationType.INFO,
            category,
            link,
            metadata,
            channels,
        } = params;

        // 1. Always save to DB for in-app persistence
        try {
            await prisma.notification.create({
                data: {
                    userId,
                    title,
                    message,
                    type,
                    category,
                    link,
                    metadata: metadata || undefined,
                },
            });
        } catch (error) {
            logger.error('Failed to save notification to DB:', error);
        }

        // 2. Dispatch to each requested channel
        const dispatches: Promise<void>[] = [];

        for (const channel of channels) {
            switch (channel) {
                case 'email':
                    if (params.emailOptions) {
                        dispatches.push(this.dispatchEmail(params.emailOptions));
                    }
                    break;
                case 'sms':
                    if (params.smsOptions) {
                        dispatches.push(this.dispatchSms(params.smsOptions));
                    }
                    break;
                case 'whatsapp':
                    if (params.whatsappOptions) {
                        dispatches.push(this.dispatchWhatsApp(params.whatsappOptions));
                    }
                    break;
                case 'fcm':
                    dispatches.push(this.dispatchFcm(userId, title, message, link, metadata));
                    break;
                case 'web_push':
                    dispatches.push(this.dispatchWebPush(userId, title, message, link));
                    break;
                case 'in_app':
                    dispatches.push(this.dispatchInApp(userId, title, message, type, link));
                    break;
            }
        }

        await Promise.allSettled(dispatches);
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        });
    }

    /**
     * Notify candidate about a job match
     */
    async notifyJobMatch(
        candidateUserId: string,
        jobTitle: string,
        companyName: string,
        jobId: string,
        matchScore: number
    ): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: candidateUserId },
            select: {
                email: true,
                mobileNumber: true,
                isWhatsappVerified: true,
                isEmailVerified: true,
            },
        });

        if (!user) return;

        const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
        const emailOptions = user.isEmailVerified
            ? {
                  to: user.email,
                  subject: `New Job Match: ${jobTitle} at ${companyName}`,
                  html: `
                    <h2>You have a new job match!</h2>
                    <p>The position <strong>${jobTitle}</strong> at <strong>${companyName}</strong> matches your profile.</p>
                    <p>Match Score: <strong>${Math.round(matchScore * 100)}%</strong></p>
                    <p><a href="${process.env.FRONTEND_URL}/jobs/${jobId}">View Job Details</a></p>
                  `,
                  text: `New job match: ${jobTitle} at ${companyName}. Match score: ${Math.round(matchScore * 100)}%. View details on the platform.`,
              }
            : undefined;

        if (emailOptions) channels.push('email');

        const whatsappOptions =
            user.isWhatsappVerified && user.mobileNumber
                ? {
                      to: user.mobileNumber,
                      templateName: 'job_alert',
                      components: [
                          {
                              type: 'body',
                              parameters: [
                                  { type: 'text', text: jobTitle },
                                  { type: 'text', text: companyName },
                              ],
                          },
                      ],
                  }
                : undefined;

        if (whatsappOptions) channels.push('whatsapp');

        await this.send({
            userId: candidateUserId,
            title: 'New Job Match',
            message: `${jobTitle} at ${companyName} matches your profile (${Math.round(matchScore * 100)}% match)`,
            type: NotificationType.SUCCESS,
            category: 'job_match',
            link: `/jobs/${jobId}`,
            metadata: { jobId, matchScore },
            channels,
            emailOptions,
            whatsappOptions,
        });
    }

    /**
     * Notify employer about a new job application
     */
    async notifyNewApplication(
        employerUserId: string,
        candidateName: string,
        jobTitle: string,
        jobId: string,
        applicationId: string
    ): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: employerUserId },
            select: { email: true, isEmailVerified: true },
        });

        if (!user) return;

        const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
        let emailOptions;

        if (user.isEmailVerified) {
            channels.push('email');
            emailOptions = {
                to: user.email,
                subject: `New Application: ${jobTitle}`,
                html: `
                    <h2>New Application Received</h2>
                    <p><strong>${candidateName}</strong> has applied for the position <strong>${jobTitle}</strong>.</p>
                    <p><a href="${process.env.FRONTEND_URL}/employer/jobs/${jobId}/applications/${applicationId}">Review Application</a></p>
                `,
                text: `${candidateName} has applied for ${jobTitle}. Review on the platform.`,
            };
        }

        await this.send({
            userId: employerUserId,
            title: 'New Application',
            message: `${candidateName} applied for ${jobTitle}`,
            type: NotificationType.INFO,
            category: 'application_update',
            link: `/employer/jobs/${jobId}/applications`,
            metadata: { jobId, applicationId },
            channels,
            emailOptions,
        });
    }

    /**
     * Notify candidate about application status change
     */
    async notifyApplicationStatusChange(
        candidateUserId: string,
        jobTitle: string,
        companyName: string,
        newStatus: string,
        jobId: string
    ): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: candidateUserId },
            select: {
                email: true,
                mobileNumber: true,
                isEmailVerified: true,
                isWhatsappVerified: true,
            },
        });

        if (!user) return;

        const statusMessages: Record<string, string> = {
            VIEWED: 'Your application has been viewed',
            SHORTLISTED: 'You have been shortlisted!',
            INTERVIEW_SCHEDULED: 'An interview has been scheduled',
            REJECTED: 'Your application was not selected',
            OFFERED: 'You have received a job offer!',
            HIRED: 'Congratulations! You have been hired!',
        };

        const statusMessage = statusMessages[newStatus] || `Application status updated to ${newStatus}`;

        const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
        let emailOptions;
        let whatsappOptions;

        if (user.isEmailVerified) {
            channels.push('email');
            emailOptions = {
                to: user.email,
                subject: `Application Update: ${jobTitle} - ${newStatus}`,
                html: `
                    <h2>Application Status Update</h2>
                    <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
                    <p>New Status: <strong>${newStatus}</strong></p>
                    <p>${statusMessage}</p>
                `,
                text: `${statusMessage} for ${jobTitle} at ${companyName}. Status: ${newStatus}.`,
            };
        }

        if (user.isWhatsappVerified && user.mobileNumber) {
            channels.push('whatsapp');
            whatsappOptions = {
                to: user.mobileNumber,
                templateName: 'application_status_update',
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: jobTitle },
                            { type: 'text', text: newStatus },
                        ],
                    },
                ],
            };
        }

        await this.send({
            userId: candidateUserId,
            title: 'Application Update',
            message: `${statusMessage} - ${jobTitle} at ${companyName}`,
            type: newStatus === 'REJECTED' ? NotificationType.WARNING : NotificationType.SUCCESS,
            category: 'application_update',
            link: `/candidate/applications`,
            metadata: { jobId, status: newStatus },
            channels,
            emailOptions,
            whatsappOptions,
        });
    }

    /**
     * Get user's notifications (paginated)
     */
    async getNotifications(
        userId: string,
        filters: { isRead?: boolean; category?: string; page?: number; limit?: number }
    ) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (filters.isRead !== undefined) where.isRead = filters.isRead;
        if (filters.category) where.category = filters.category;

        const [notifications, total] = await prisma.$transaction([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
        ]);

        return {
            notifications,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(userId: string, notificationId: string): Promise<void> {
        await prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<void> {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    // ===========================
    // Private dispatch methods
    // ===========================

    private async dispatchEmail(options: { to: string; subject: string; html: string; text?: string }): Promise<void> {
        try {
            await emailQueue.add('send-email', options);
        } catch (error) {
            logger.error('Failed to enqueue email notification:', error);
        }
    }

    private async dispatchSms(options: { to: string; body: string }): Promise<void> {
        try {
            await smsQueue.add('send-sms', options);
        } catch (error) {
            logger.error('Failed to enqueue SMS notification:', error);
        }
    }

    private async dispatchWhatsApp(options: {
        to: string;
        templateName: string;
        languageCode?: string;
        components?: any[];
    }): Promise<void> {
        try {
            await whatsappQueue.add('send-whatsapp', options);
        } catch (error) {
            logger.error('Failed to enqueue WhatsApp notification:', error);
        }
    }

    private async dispatchFcm(
        userId: string,
        title: string,
        body: string,
        link?: string,
        data?: Record<string, any>
    ): Promise<void> {
        try {
            const deviceTokens = await prisma.deviceToken.findMany({
                where: { userId },
                select: { token: true },
            });

            if (deviceTokens.length === 0) return;

            await fcmQueue.add('send-fcm', {
                tokens: deviceTokens.map((d) => d.token),
                title,
                body,
                data: {
                    ...(data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {}),
                    ...(link ? { link } : {}),
                },
            });
        } catch (error) {
            logger.error('Failed to enqueue FCM notification:', error);
        }
    }

    private async dispatchWebPush(userId: string, title: string, body: string, link?: string): Promise<void> {
        try {
            const subscriptions = await prisma.pushSubscription.findMany({
                where: { userId },
            });

            for (const sub of subscriptions) {
                await webPushQueue.add('send-web-push', {
                    subscription: {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    payload: JSON.stringify({ title, body, url: link }),
                });
            }
        } catch (error) {
            logger.error('Failed to enqueue Web Push notification:', error);
        }
    }

    private async dispatchInApp(
        userId: string,
        title: string,
        message: string,
        type: NotificationType,
        link?: string
    ): Promise<void> {
        try {
            await inAppQueue.add('send-in-app', {
                userId,
                title,
                message,
                type: type.toLowerCase() as 'info' | 'success' | 'warning' | 'error',
                link,
            });
        } catch (error) {
            logger.error('Failed to enqueue in-app notification:', error);
        }
    }
    /**
     * Send a new device login alert email.
     */
    async sendNewDeviceAlert(userId: string, email: string, name: string, deviceName: string, location: string): Promise<void> {
        const time = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        await this.dispatchEmail({
            to: email,
            subject: 'New Device Login Detected - Talent Bridge',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">New Device Login</h2>
                    <p>Hi ${name},</p>
                    <p>We noticed a login to your account from a new device:</p>
                    <p><strong>Device:</strong> ${deviceName}<br><strong>Location:</strong> ${location}<br><strong>Time:</strong> ${time}</p>
                    <p>If this was you, no action is needed.</p>
                    <p style="color: #c0392b;"><strong>If you don't recognize this login, please change your password immediately and enable MFA.</strong></p>
                </div>
            `,
        });

        // Also create in-app notification
        await this.dispatchInApp(userId, 'New Device Login', `Login from ${deviceName} at ${location}`, NotificationType.WARNING);
    }
}

export const notificationService = new NotificationService();
