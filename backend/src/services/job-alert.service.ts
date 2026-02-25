import prisma from '../config/prisma';
import type { AlertFrequency } from '@prisma/client';
import { AppError } from '../middleware/error';
import { jobService } from './job.service';
import { notificationService, type NotificationChannel } from './notification.service';
import logger from '../config/logger';
import type { Prisma } from '@prisma/client';

interface CreateAlertData {
  name: string;
  filters: Record<string, unknown>;
  frequency: AlertFrequency;
}

interface UpdateAlertData {
  name?: string;
  filters?: Record<string, unknown>;
  frequency?: AlertFrequency;
  isActive?: boolean;
}

const MAX_ALERTS_PER_USER = 10;

export const jobAlertService = {
  async createAlert(userId: string, data: CreateAlertData) {
    const count = await prisma.jobAlert.count({ where: { userId } });
    if (count >= MAX_ALERTS_PER_USER) {
      throw new AppError(
        `Maximum ${MAX_ALERTS_PER_USER} job alerts allowed`,
        400,
        'MAX_ALERTS_REACHED'
      );
    }

    return prisma.jobAlert.create({
      data: {
        userId,
        name: data.name,
        filters: data.filters as Prisma.InputJsonValue,
        frequency: data.frequency,
      },
    });
  },

  async getAlerts(userId: string) {
    return prisma.jobAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateAlert(userId: string, alertId: string, data: UpdateAlertData) {
    const alert = await prisma.jobAlert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new AppError('Job alert not found', 404, 'ALERT_NOT_FOUND');
    }

    return prisma.jobAlert.update({
      where: { id: alertId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.filters !== undefined && { filters: data.filters as Prisma.InputJsonValue }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  },

  async deleteAlert(userId: string, alertId: string) {
    const alert = await prisma.jobAlert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new AppError('Job alert not found', 404, 'ALERT_NOT_FOUND');
    }

    await prisma.jobAlert.delete({ where: { id: alertId } });
  },

  async getAlertMatches(userId: string, alertId: string, page = 1, limit = 20) {
    const alert = await prisma.jobAlert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new AppError('Job alert not found', 404, 'ALERT_NOT_FOUND');
    }

    const filters = alert.filters as Record<string, unknown>;
    const result = await jobService.searchJobs({
      ...filters,
      page,
      limit,
    } as any);

    // Reset new match count when user views matches
    await prisma.jobAlert
      .update({
        where: { id: alertId },
        data: { newMatchCount: 0 },
      })
      .catch(() => {
        /* best effort */
      });

    return result;
  },

  async processAlerts() {
    const now = new Date();

    // Find active alerts that are due for processing
    const alerts = await prisma.jobAlert.findMany({
      where: {
        isActive: true,
        frequency: { not: 'OFF' },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            email: true,
            isEmailVerified: true,
            mobileNumber: true,
            isWhatsappVerified: true,
            whatsappNumber: true,
          },
        },
      },
    });

    for (const alert of alerts) {
      try {
        if (!isAlertDue(alert.frequency, alert.lastNotifiedAt, now)) continue;

        const filters = alert.filters as Record<string, string>;
        // Only search for jobs posted since last notification
        const searchFilters: Record<string, string> = {
          ...filters,
          limit: '5',
        };
        if (alert.lastNotifiedAt) {
          searchFilters.postedAfter = alert.lastNotifiedAt.toISOString();
        }

        const result = await jobService.searchJobs(searchFilters as any);
        const matchCount = result.pagination?.total || 0;

        if (matchCount > 0) {
          const alertTitle = `${matchCount} new job${matchCount > 1 ? 's' : ''} matching "${alert.name}"`;
          const alertMessage = `Your job alert "${alert.name}" found ${matchCount} new matching job${matchCount > 1 ? 's' : ''}.`;
          const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
          let emailOptions;
          let smsOptions;
          let whatsappOptions;

          const frontendUrl = process.env.FRONTEND_URL || 'https://talentbridge.com';

          if (alert.user.isEmailVerified && alert.user.email) {
            channels.push('email');
            const { jobAlert: jobAlertTemplate } = await import('../templates/email/job');
            const jobs = (result.jobs || []).slice(0, 5).map((j: any) => ({
              title: j.title,
              company: j.company?.companyName || 'Unknown',
              location: j.location || undefined,
              link: `${frontendUrl}/candidate/jobs/${j.id}`,
            }));
            const tmpl = jobAlertTemplate(alert.user.firstName || 'Candidate', jobs);
            emailOptions = {
              to: alert.user.email,
              subject: tmpl.subject,
              html: tmpl.html,
              text: tmpl.text,
            };
          }

          if (alert.user.mobileNumber) {
            channels.push('sms');
            smsOptions = {
              to: alert.user.mobileNumber,
              body: `${alertTitle}. Check them at ${frontendUrl}/candidate/job-alerts`,
            };
          }

          const whatsappTarget = alert.user.whatsappNumber || alert.user.mobileNumber;
          if (alert.user.isWhatsappVerified && whatsappTarget) {
            channels.push('whatsapp');
            const topJob = (result.jobs || [])[0];
            whatsappOptions = {
              to: whatsappTarget,
              templateName: 'job_alert',
              components: [
                {
                  type: 'body' as const,
                  parameters: [
                    { type: 'text' as const, text: topJob?.title || 'New Job' },
                    { type: 'text' as const, text: topJob?.company?.companyName || 'a company' },
                    { type: 'text' as const, text: `${frontendUrl}/candidate/job-alerts` },
                  ],
                },
              ],
            };
          }

          await notificationService
            .send({
              userId: alert.userId,
              title: alertTitle,
              message: alertMessage,
              type: 'INFO',
              category: 'job_alert',
              link: '/candidate/job-alerts',
              channels,
              emailOptions,
              smsOptions,
              whatsappOptions,
            })
            .catch(() => {
              /* best effort */
            });
        }

        // Update alert
        await prisma.jobAlert.update({
          where: { id: alert.id },
          data: {
            lastNotifiedAt: now,
            newMatchCount: matchCount,
          },
        });
      } catch {
        logger.debug(`Failed to process job alert ${alert.id}`);
      }
    }
  },
};

function isAlertDue(frequency: AlertFrequency, lastNotifiedAt: Date | null, now: Date): boolean {
  if (!lastNotifiedAt) return true;

  const hoursSince = (now.getTime() - lastNotifiedAt.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case 'INSTANT':
      return hoursSince >= 1;
    case 'DAILY':
      return hoursSince >= 24;
    case 'WEEKLY':
      return hoursSince >= 168;
    default:
      return false;
  }
}
