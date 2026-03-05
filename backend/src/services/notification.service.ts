import { prisma } from '../config/prisma';
import { NotificationType } from '@prisma/client';
import logger from '../config/logger';
import { emailQueue } from '../jobs/email.queue';
import { smsQueue } from '../jobs/sms.queue';
import { whatsappQueue } from '../jobs/whatsapp.queue';
import {
  adminAlertWhatsapp,
  securityAlertWhatsapp,
  applicationStatusWhatsapp,
  documentRequestWhatsapp,
  newApplicationWhatsapp,
  applicationSubmittedWhatsapp,
  accountAlertWhatsapp,
  interviewWhatsapp,
  jobOfferWhatsapp,
  jobMatchWhatsapp,
} from '../templates/whatsapp';
import { fcmQueue } from '../jobs/fcm.queue';
import { webPushQueue } from '../jobs/web-push.queue';
// In-app notifications are emitted directly via Socket.IO in dispatchInApp()
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { env } from '../config/env';
import {
  applicationStatusUpdate as appStatusEmailTemplate,
  newApplicationForEmployer as newAppEmailTemplate,
  jobApplicationReceived as appReceivedEmailTemplate,
  jobPostedConfirmation as jobPostedEmailTemplate,
  jobClosedNotification as jobClosedEmailTemplate,
  jobMatchFound as jobMatchEmailTemplate,
  matchingCandidatesFound as matchingCandidatesFoundEmailTemplate,
} from '../templates/email/job';
import {
  accountSuspended as suspendedEmailTemplate,
  accountReactivated as reactivatedEmailTemplate,
  accountDeletionRequested as deletionRequestedEmailTemplate,
} from '../templates/email/auth';
import { passwordChanged as passwordChangedEmailTemplate } from '../templates/email/security';
import { documentVerificationStatus as verificationStatusEmailTemplate, verificationSubmitted as verificationSubmittedEmailTemplate } from '../templates/email/onboarding';
import { applicationWithdrawn as appWithdrawnEmailTemplate } from '../templates/email/job';

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
  /** If true, ALL channels bypass user preferences (security/account critical). If false, channels respect user preferences and ENABLE_TRANSACTIONAL_SMS */
  isEssential?: boolean;
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

      // 2. Check user notification preferences and filter channels
      // Essential notifications (security alerts) bypass user preferences for ALL channels
      const allowedChannels = await this.filterByPreferences(
        userId,
        channels,
        params.isEssential,
        category
      );

      // 3. Dispatch to each allowed channel
      const dispatches: Promise<void>[] = [];

      for (const channel of allowedChannels) {
        switch (channel) {
          case 'email':
            if (params.emailOptions) {
              dispatches.push(this.dispatchEmail(params.emailOptions));
            }
            break;
          case 'sms':
            if (params.smsOptions) {
              dispatches.push(this.dispatchSms(params.smsOptions, params.isEssential));
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

      // Publish Kafka event for analytics pipeline
      import('../kafka/producer')
        .then(({ publishEvent, KafkaTopics }) =>
          publishEvent(KafkaTopics.NOTIFICATION_SENT, userId, {
            userId,
            type,
            channels: allowedChannels,
          })
        )
        .catch(() => {});

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
    // Dedup: skip if candidate was already notified about this job
    const existing = await prisma.notification.findFirst({
      where: {
        userId: candidateUserId,
        category: 'job_match',
        metadata: { path: ['jobId'], equals: jobId },
      },
      select: { id: true },
    });
    if (existing) return;

    const user = await prisma.user.findUnique({
      where: { id: candidateUserId },
      select: {
        firstName: true,
        email: true,
        mobileNumber: true,
        whatsappNumber: true,
        isWhatsappVerified: true,
        isEmailVerified: true,
      },
    });

    if (!user) return;

    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
    const tmpl = jobMatchEmailTemplate(
      user.firstName || 'Candidate',
      jobTitle,
      companyName,
      jobId,
      matchScore
    );
    const emailOptions = user.isEmailVerified
      ? { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text }
      : undefined;

    if (emailOptions) channels.push('email');

    const whatsappTarget = this.getWhatsappTarget(user, candidateUserId, 'notifyJobMatch');
    let whatsappOptions;
    if (whatsappTarget) {
      const waTmpl = jobMatchWhatsapp(jobTitle, companyName, `${Math.round(matchScore * 100)}%`);
      whatsappOptions = {
        to: whatsappTarget,
        templateName: waTmpl.templateName,
        components: waTmpl.components,
      };
    }

    if (whatsappOptions) channels.push('whatsapp');

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: `New job match: ${jobTitle} at ${companyName} (${Math.round(matchScore * 100)}% match). View on Talent Bridge.`,
        }
      : undefined;
    if (smsOptions) channels.push('sms');

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
      smsOptions,
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
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });

    if (!user) return;

    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const appLink = `${process.env.FRONTEND_URL}/employer/jobs/${jobId}/applications/${applicationId}`;
      const tmpl = newAppEmailTemplate(
        user.firstName || 'Hiring Manager',
        candidateName,
        jobTitle,
        appLink
      );
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, employerUserId, 'notifyNewApplication');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const tmpl = newApplicationWhatsapp(candidateName, jobTitle);
      whatsappOptions = {
        to: whatsappTarget,
        templateName: tmpl.templateName,
        components: tmpl.components,
      };
    }

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: `New application: ${candidateName} applied for ${jobTitle}. Review on Talent Bridge.`,
        }
      : undefined;
    if (smsOptions) channels.push('sms');

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
      whatsappOptions,
      smsOptions,
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
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });

    if (!user) return;

    const statusMessages: Record<string, string> = {
      VIEWED: 'Your application has been viewed',
      SHORTLISTED: 'You have been shortlisted!',
      SELECTED: 'You have been selected for further evaluation!',
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
      const tmpl = appStatusEmailTemplate(
        user.firstName || 'Candidate',
        jobTitle,
        companyName,
        newStatus.toLowerCase()
      );
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const statusWhatsappTarget = this.getWhatsappTarget(user, candidateUserId, 'notifyApplicationStatusChange');
    if (statusWhatsappTarget) {
      channels.push('whatsapp');
      const jobLink = `${process.env.FRONTEND_URL}/candidate/jobs/${jobId}`;
      // Use specific templates for interview/offer, generic for other statuses
      if (newStatus === 'INTERVIEW_SCHEDULED') {
        const tmpl = interviewWhatsapp(jobTitle, 'Check app for details', jobLink);
        whatsappOptions = {
          to: statusWhatsappTarget,
          templateName: tmpl.templateName,
          components: tmpl.components,
        };
      } else if (newStatus === 'OFFERED') {
        const tmpl = jobOfferWhatsapp(jobTitle, companyName, jobLink);
        whatsappOptions = {
          to: statusWhatsappTarget,
          templateName: tmpl.templateName,
          components: tmpl.components,
        };
      } else {
        const tmpl = applicationStatusWhatsapp(newStatus, companyName, jobTitle);
        whatsappOptions = {
          to: statusWhatsappTarget,
          templateName: tmpl.templateName,
          components: tmpl.components,
        };
      }
    }

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: `${statusMessage} for ${jobTitle} at ${companyName}. Check Talent Bridge for details.`,
        }
      : undefined;
    if (smsOptions) channels.push('sms');

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
      smsOptions,
    });
  }

  /**
   * Notify candidate that their application was submitted successfully
   */
  async notifyApplicationSubmitted(
    candidateUserId: string,
    jobTitle: string,
    companyName: string,
    jobId: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: candidateUserId },
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const tmpl = appReceivedEmailTemplate(user.firstName || 'Candidate', jobTitle, companyName);
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, candidateUserId, 'notifyApplicationSubmitted');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const tmpl = applicationSubmittedWhatsapp(jobTitle, companyName);
      whatsappOptions = {
        to: whatsappTarget,
        templateName: tmpl.templateName,
        components: tmpl.components,
      };
    }

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: `Application submitted for ${jobTitle} at ${companyName}. Track it on Talent Bridge.`,
        }
      : undefined;
    if (smsOptions) channels.push('sms');

    await this.send({
      userId: candidateUserId,
      title: 'Application Submitted',
      message: `Your application for ${jobTitle} at ${companyName} has been submitted successfully.`,
      type: NotificationType.SUCCESS,
      category: 'application_update',
      link: '/candidate/applications',
      metadata: { jobId },
      channels,
      emailOptions,
      whatsappOptions,
      smsOptions,
    });
  }

  /**
   * Notify user that their password was changed
   */
  async notifyPasswordChanged(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const time = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const tmpl = passwordChangedEmailTemplate(time);
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, userId, 'notifyPasswordChanged');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const tmpl = securityAlertWhatsapp(`Password changed on ${time}`);
      whatsappOptions = {
        to: whatsappTarget,
        templateName: tmpl.templateName,
        components: tmpl.components,
      };
    }

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: `Your Talent Bridge password was changed on ${time}. If this wasn't you, reset it immediately.`,
        }
      : undefined;
    if (smsOptions) channels.push('sms');

    await this.send({
      userId,
      title: 'Password Changed',
      message: `Your password was successfully changed on ${time}.`,
      type: NotificationType.WARNING,
      category: 'security',
      link: '/settings',
      channels,
      emailOptions,
      whatsappOptions,
      smsOptions,
      isEssential: true, // Security alert - always send
    });
  }

  /**
   * Notify user that their account was suspended
   */
  async notifyUserSuspended(userId: string, reason?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const channels: NotificationChannel[] = ['in_app'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const tmpl = suspendedEmailTemplate(user.firstName || 'User', reason);
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, userId, 'notifyUserSuspended');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const tmpl = accountAlertWhatsapp(
        `Your account has been suspended${reason ? `. Reason: ${reason}` : ''}`
      );
      whatsappOptions = {
        to: whatsappTarget,
        templateName: tmpl.templateName,
        components: tmpl.components,
      };
    }

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: `Your Talent Bridge account has been suspended.${reason ? ` Reason: ${reason}` : ''} Contact support for help.`,
        }
      : undefined;
    if (smsOptions) channels.push('sms');

    await this.send({
      userId,
      title: 'Account Suspended',
      message: `Your account has been suspended.${reason ? ` Reason: ${reason}` : ''}`,
      type: NotificationType.ERROR,
      category: 'account',
      channels,
      emailOptions,
      whatsappOptions,
      smsOptions,
      isEssential: true, // Account status - always send
    });
  }

  /**
   * Notify user that their account was reactivated
   */
  async notifyUserActivated(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const channels: NotificationChannel[] = ['in_app'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const tmpl = reactivatedEmailTemplate(user.firstName || 'User');
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, userId, 'notifyUserActivated');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const tmpl = accountAlertWhatsapp('Your account has been reactivated. You can now sign in');
      whatsappOptions = {
        to: whatsappTarget,
        templateName: tmpl.templateName,
        components: tmpl.components,
      };
    }

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: 'Your Talent Bridge account has been reactivated. You can now sign in and use all features.',
        }
      : undefined;
    if (smsOptions) channels.push('sms');

    await this.send({
      userId,
      title: 'Account Reactivated',
      message: 'Your account has been reactivated. You can now sign in.',
      type: NotificationType.SUCCESS,
      category: 'account',
      channels,
      emailOptions,
      whatsappOptions,
      smsOptions,
      isEssential: true, // Account status - always send
    });
  }

  /**
   * Notify user that their verification request was submitted
   */
  async notifyVerificationSubmitted(userId: string, verificationType: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });

    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
    let emailOptions;
    let whatsappOptions;

    if (user?.isEmailVerified) {
      channels.push('email');
      const verifyEmail = verificationSubmittedEmailTemplate(user.firstName, verificationType);
      emailOptions = {
        to: user.email,
        subject: verifyEmail.subject,
        html: verifyEmail.html,
        text: verifyEmail.text,
      };
    }

    const whatsappTarget = user ? this.getWhatsappTarget(user, userId, 'notifyVerificationSubmitted') : null;
    if (whatsappTarget) {
      channels.push('whatsapp');
      const waTmpl = documentRequestWhatsapp(
        `${verificationType} verification submitted`,
        `${process.env.FRONTEND_URL}/candidate/verification`
      );
      whatsappOptions = {
        to: whatsappTarget,
        templateName: waTmpl.templateName,
        components: waTmpl.components,
      };
    }

    await this.send({
      userId,
      title: 'Verification Request Submitted',
      message: `Your ${verificationType.toLowerCase()} verification request has been submitted and is under review.`,
      type: NotificationType.INFO,
      category: 'verification',
      link: '/candidate/verification',
      channels,
      emailOptions,
      whatsappOptions,
    });
  }

  /**
   * Notify user about verification review result (with proper email)
   */
  async notifyVerificationReviewed(
    userId: string,
    verificationType: string,
    status: 'approved' | 'rejected',
    comments?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const isApproved = status === 'approved';
    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const tmpl = verificationStatusEmailTemplate(verificationType, status, comments);
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, userId, 'notifyVerificationReviewed');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const verLink = `${process.env.FRONTEND_URL}/candidate/verification`;
      const tmpl = documentRequestWhatsapp(`${verificationType} verification ${status}`, verLink);
      whatsappOptions = {
        to: whatsappTarget,
        templateName: tmpl.templateName,
        components: tmpl.components,
      };
    }

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: `Your ${verificationType} verification has been ${status}.${comments ? ` Note: ${comments}` : ''} Check Talent Bridge.`,
        }
      : undefined;
    if (smsOptions) channels.push('sms');

    await this.send({
      userId,
      title: `Verification ${isApproved ? 'Approved' : 'Rejected'}`,
      message: `Your ${verificationType} verification has been ${status}.${comments ? ` Note: ${comments}` : ''}`,
      type: isApproved ? NotificationType.SUCCESS : NotificationType.ERROR,
      category: 'verification',
      link: '/candidate/verification',
      channels,
      emailOptions,
      whatsappOptions,
      smsOptions,
    });
  }

  /**
   * Notify all admins about new verification request (multi-channel)
   */
  async notifyAdminsNewVerification(
    userId: string,
    verificationType: string,
    requestId: string
  ): Promise<void> {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        companyProfile: { select: { companyName: true } },
      },
    });

    if (!user) return;

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const companyInfo = user.companyProfile?.companyName
      ? ` from ${user.companyProfile.companyName}`
      : '';
    const userRole = user.role === 'EMPLOYER' ? 'Employer' : 'Candidate';

    // Get all admin and super admin users
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });

    // Import admin email template
    const { verificationRequestReceivedEmailTemplate } =
      await import('../templates/email/admin-verification');

    // Notify each admin
    for (const admin of admins) {
      const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
      let emailOptions;
      let whatsappOptions;
      let smsOptions;

      // Email notification
      if (admin.isEmailVerified) {
        channels.push('email');
        const tmpl = verificationRequestReceivedEmailTemplate(
          verificationType,
          userName,
          userRole,
          companyInfo
        );
        emailOptions = {
          to: admin.email,
          subject: tmpl.subject,
          html: tmpl.html,
          text: tmpl.text,
        };
      }

      // WhatsApp notification
      const whatsappTarget = this.getWhatsappTarget(admin, admin.id, 'notifyAdminsNewVerification');
      if (whatsappTarget) {
        channels.push('whatsapp');
        const tmpl = adminAlertWhatsapp(
          `${verificationType} verification request from ${userName}`
        );
        whatsappOptions = {
          to: whatsappTarget,
          templateName: tmpl.templateName,
          components: tmpl.components,
        };
      }

      // SMS notification (will be filtered by admin preferences)
      if (admin.mobileNumber) {
        smsOptions = {
          to: admin.mobileNumber,
          body: `New ${verificationType} verification request from ${userName}${companyInfo}. Review at Talent Bridge admin panel.`,
        };
        channels.push('sms');
      }

      await this.send({
        userId: admin.id,
        title: 'New Verification Request',
        message: `${userRole} ${userName}${companyInfo} submitted ${verificationType} verification request.`,
        type: NotificationType.INFO,
        category: 'admin',
        link: '/admin/verifications',
        metadata: { requestId, verificationType, submitterId: userId },
        channels,
        emailOptions,
        whatsappOptions,
        smsOptions,
      });
    }
  }

  /**
   * Notify user that their account deletion was requested (inline email + in-app)
   */
  async notifyAccountDeletionRequested(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const channels: NotificationChannel[] = ['in_app'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const tmpl = deletionRequestedEmailTemplate(user.firstName || 'there');
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, userId, 'notifyAccountDeletionRequested');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const waTmpl = accountAlertWhatsapp(
        'Your account deletion request has been received. It will be deleted in 30 days. Log in to cancel'
      );
      whatsappOptions = {
        to: whatsappTarget,
        templateName: waTmpl.templateName,
        components: waTmpl.components,
      };
    }

    await this.send({
      userId,
      title: 'Account Deletion Requested',
      message:
        'Your account deletion request has been received. Your account will be deleted in 30 days. Log in to cancel.',
      type: NotificationType.WARNING,
      category: 'account',
      link: '/settings',
      channels,
      emailOptions,
      whatsappOptions,
      isEssential: true,
    });
  }

  /**
   * Notify employer that their job was posted successfully (email + in-app)
   */
  async notifyJobPosted(employerUserId: string, jobTitle: string, jobId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: employerUserId },
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const channels: NotificationChannel[] = ['in_app'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const tmpl = jobPostedEmailTemplate(user.firstName || 'Hiring Manager', jobTitle, jobId);
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, employerUserId, 'notifyJobPosted');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const waTmpl = accountAlertWhatsapp(`Your job posting "${jobTitle}" is now live`);
      whatsappOptions = {
        to: whatsappTarget,
        templateName: waTmpl.templateName,
        components: waTmpl.components,
      };
    }

    await this.send({
      userId: employerUserId,
      title: 'Job Posted',
      message: `Your job posting "${jobTitle}" is now live.`,
      type: NotificationType.SUCCESS,
      category: 'job',
      link: `/employer/jobs/${jobId}`,
      metadata: { jobId },
      channels,
      emailOptions,
      whatsappOptions,
    });
  }

  /**
   * Notify applicants that a job has been closed (email + in-app)
   */
  async notifyJobClosed(jobId: string, jobTitle: string, companyName: string): Promise<void> {
    // Find all applicants for this job
    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      select: { candidate: { select: { userId: true } } },
    });

    if (applications.length === 0) return;

    const uniqueUserIds = [...new Set(applications.map((a) => a.candidate.userId))];

    for (const applicantUserId of uniqueUserIds) {
      const user = await prisma.user.findUnique({
        where: { id: applicantUserId },
        select: {
          email: true,
          firstName: true,
          mobileNumber: true,
          whatsappNumber: true,
          isEmailVerified: true,
          isWhatsappVerified: true,
        },
      });
      if (!user) continue;

      const channels: NotificationChannel[] = ['in_app'];
      let emailOptions;
      let whatsappOptions;

      if (user.isEmailVerified) {
        channels.push('email');
        const tmpl = jobClosedEmailTemplate(user.firstName || 'Candidate', jobTitle, companyName);
        emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
      }

      const whatsappTarget = this.getWhatsappTarget(user, applicantUserId, 'notifyJobClosed');
      if (whatsappTarget) {
        channels.push('whatsapp');
        const waTmpl = applicationStatusWhatsapp('closed', companyName, jobTitle);
        whatsappOptions = {
          to: whatsappTarget,
          templateName: waTmpl.templateName,
          components: waTmpl.components,
        };
      }

      await this.send({
        userId: applicantUserId,
        title: 'Position Closed',
        message: `The ${jobTitle} position at ${companyName} has been closed.`,
        type: NotificationType.INFO,
        category: 'job',
        link: '/candidate/jobs',
        metadata: { jobId },
        channels,
        emailOptions,
        whatsappOptions,
      }).catch(() => {});
    }
  }

  /**
   * Notify employer that matching candidates were found for their job
   */
  async notifyMatchingCandidatesFound(
    employerUserId: string,
    jobId: string,
    jobTitle: string,
    matchCount: number
  ): Promise<void> {
    if (matchCount === 0) return;
    const user = await prisma.user.findUnique({
      where: { id: employerUserId },
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const tmpl = matchingCandidatesFoundEmailTemplate(
        user.firstName || 'Hiring Manager',
        jobTitle,
        matchCount,
        jobId
      );
      emailOptions = { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };
    }

    const whatsappTarget = this.getWhatsappTarget(user, employerUserId, 'notifyMatchingCandidatesFound');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const waTmpl = adminAlertWhatsapp(
        `${matchCount} matching candidate${matchCount === 1 ? '' : 's'} found for "${jobTitle}"`
      );
      whatsappOptions = {
        to: whatsappTarget,
        templateName: waTmpl.templateName,
        components: waTmpl.components,
      };
    }

    await this.send({
      userId: employerUserId,
      title: 'Matching Candidates Found',
      message: `${matchCount} matching candidate${matchCount === 1 ? '' : 's'} found for "${jobTitle}".`,
      type: NotificationType.SUCCESS,
      category: 'job_match',
      link: `/employer/jobs/${jobId}/applications`,
      metadata: { jobId, matchCount },
      channels,
      emailOptions,
      whatsappOptions,
    });
  }

  /**
   * Notify employer that a candidate withdrew their application
   */
  async notifyApplicationWithdrawn(
    employerUserId: string,
    candidateName: string,
    jobTitle: string,
    jobId: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: employerUserId },
      select: {
        email: true,
        firstName: true,
        mobileNumber: true,
        whatsappNumber: true,
        isEmailVerified: true,
        isWhatsappVerified: true,
      },
    });
    if (!user) return;

    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push'];
    let emailOptions;
    let whatsappOptions;

    if (user.isEmailVerified) {
      channels.push('email');
      const withdrawnEmail = appWithdrawnEmailTemplate(user.firstName || 'Hiring Manager', candidateName, jobTitle);
      emailOptions = {
        to: user.email,
        subject: withdrawnEmail.subject,
        html: withdrawnEmail.html,
        text: withdrawnEmail.text,
      };
    }

    const whatsappTarget = this.getWhatsappTarget(user, employerUserId, 'notifyApplicationWithdrawn');
    if (whatsappTarget) {
      channels.push('whatsapp');
      const waTmpl = newApplicationWhatsapp(candidateName, jobTitle);
      whatsappOptions = {
        to: whatsappTarget,
        templateName: waTmpl.templateName,
        components: waTmpl.components,
      };
    }

    const smsOptions = user.mobileNumber
      ? {
          to: user.mobileNumber,
          body: `${candidateName} withdrew their application for ${jobTitle}. Check Talent Bridge for updates.`,
        }
      : undefined;
    if (smsOptions) channels.push('sms');

    await this.send({
      userId: employerUserId,
      title: 'Application Withdrawn',
      message: `${candidateName} withdrew their application for "${jobTitle}".`,
      type: NotificationType.INFO,
      category: 'application_update',
      link: `/employer/jobs/${jobId}/applications`,
      metadata: { jobId, candidateName },
      channels,
      emailOptions,
      whatsappOptions,
      smsOptions,
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

    const totalPages = Math.ceil(total / limit);
    return {
      items: notifications,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
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
  // WhatsApp target resolution
  // ===========================

  /** Resolve the WhatsApp target number for a user. Returns the number if verified, or null. */
  private getWhatsappTarget(
    user: { whatsappNumber: string | null; mobileNumber: string | null; isWhatsappVerified: boolean },
    userId: string,
    method: string
  ): string | null {
    const target = user.whatsappNumber || user.mobileNumber;
    if (user.isWhatsappVerified && !target) {
      logger.warn(
        `[${method}] WhatsApp verified but no target number for user ${userId} ` +
          `(whatsappNumber=${user.whatsappNumber}, mobileNumber=${user.mobileNumber})`
      );
    }
    return user.isWhatsappVerified && target ? target : null;
  }

  // ===========================
  // Preference filtering
  // ===========================

  /** Map channel names to preference keys for candidate and employer profiles */
  private static readonly CHANNEL_PREF_MAP: Record<
    NotificationChannel,
    { candidate: string; employer: string }
  > = {
    email: { candidate: 'emailNotifications', employer: 'emailApplications' },
    sms: { candidate: 'smsNotifications', employer: 'smsAlerts' },
    whatsapp: { candidate: 'whatsappNotifications', employer: 'whatsappNotifications' },
    in_app: { candidate: 'inAppNotifications', employer: 'inAppNotifications' },
    fcm: { candidate: 'fcmNotifications', employer: 'fcmNotifications' },
    web_push: { candidate: 'webPushNotifications', employer: 'webPushNotifications' },
  };

  /** Map notification categories to employer email preference keys */
  private static readonly EMPLOYER_EMAIL_CATEGORY_MAP: Record<string, string> = {
    application_update: 'emailApplications',
    job_match: 'emailApplications',
    job: 'emailApplications',
    support_ticket: 'emailMessages',
    verification: 'emailMessages',
    onboarding: 'emailMarketing',
    marketing: 'emailMarketing',
  };

  /**
   * Filter notification channels based on user's saved preferences.
   * If no preferences are saved (null), all channels are allowed (opt-in by default).
   * Essential notifications (security alerts) bypass user preferences for ALL channels.
   */
  private async filterByPreferences(
    userId: string,
    channels: NotificationChannel[],
    isEssential = false,
    category?: string
  ): Promise<NotificationChannel[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!user) return channels;

      let prefs: Record<string, boolean> | null = null;

      if (user.role === 'CANDIDATE') {
        const profile = await prisma.candidateProfile.findUnique({
          where: { userId },
          select: { notificationPreferences: true },
        });
        prefs = profile?.notificationPreferences as Record<string, boolean> | null;
      } else if (user.role === 'EMPLOYER') {
        const profile = await prisma.companyProfile.findUnique({
          where: { userId },
          select: { notificationPreferences: true },
        });
        prefs = profile?.notificationPreferences as Record<string, boolean> | null;
      }

      // No preferences saved → all channels allowed (default on)
      if (!prefs) return channels;

      const isEmployer = user.role === 'EMPLOYER';

      return channels.filter((channel) => {
        // Essential notifications (security alerts) bypass ALL channel preferences
        if (isEssential) return true;

        let prefKey: string | undefined;

        if (channel === 'email' && isEmployer && category) {
          // Employer email: use category-specific preference key
          prefKey =
            NotificationService.EMPLOYER_EMAIL_CATEGORY_MAP[category] || 'emailApplications';
        } else {
          const roleKey = isEmployer ? 'employer' : 'candidate';
          prefKey = NotificationService.CHANNEL_PREF_MAP[channel]?.[roleKey];
        }

        // If no mapping or preference not explicitly set, allow the channel
        if (!prefKey || prefs![prefKey] === undefined) return true;
        return prefs![prefKey] === true;
      });
    } catch (error) {
      logger.error('Failed to check notification preferences, sending to all channels:', error);
      return channels; // Fail open — send notification rather than silently drop
    }
  }

  // ===========================
  // Private dispatch methods
  // ===========================

  private async dispatchEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      await emailQueue.add('send-email', options);
    } catch (error) {
      logger.error('Failed to enqueue email notification:', error);
    }
  }

  private async dispatchSms(
    options: { to: string; body: string },
    isEssential = false
  ): Promise<void> {
    // Essential SMS (security/account alerts) always sent
    // Transactional SMS (job matches, application updates) only sent if enabled
    const shouldSend = isEssential || env.ENABLE_TRANSACTIONAL_SMS === 'true';

    if (!shouldSend) {
      logger.debug('Transactional SMS disabled, skipping SMS send');
      return;
    }

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

  private async dispatchWebPush(
    userId: string,
    title: string,
    body: string,
    link?: string
  ): Promise<void> {
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
    // Emit via Socket.IO directly (runs in main app process where io is initialized)
    try {
      const { getIO } = await import('../socket');
      const io = getIO();
      io.to(`user:${userId}`).emit('notification', {
        title,
        message,
        type: type.toLowerCase(),
        link,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Socket.IO not available — client will pick up via polling
      logger.debug(`Socket.IO emit skipped for user ${userId} — not initialized`);
    }
  }
  /**
   * Send a new device login alert (multi-channel)
   */
  async sendNewDeviceAlert(
    userId: string,
    email: string,
    _name: string,
    deviceName: string,
    location: string
  ): Promise<void> {
    const time = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mobileNumber: true, whatsappNumber: true, isWhatsappVerified: true },
    });

    const { loginAlert } = await import('../templates/email/auth');
    const tmpl = loginAlert(time, location, deviceName);

    const channels: NotificationChannel[] = ['in_app', 'fcm', 'web_push', 'email'];
    const emailOptions = { to: email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text };

    let smsOptions;
    if (user?.mobileNumber) {
      channels.push('sms');
      smsOptions = {
        to: user.mobileNumber,
        body: `Security alert: New login from ${deviceName} at ${location}. If this wasn't you, change your password immediately.`,
      };
    }

    let whatsappOptions;
    const whatsappTarget = user ? this.getWhatsappTarget(user, userId, 'sendNewDeviceAlert') : null;
    if (whatsappTarget) {
      channels.push('whatsapp');
      const tmpl = securityAlertWhatsapp(`New login from ${deviceName} at ${location}`);
      whatsappOptions = {
        to: whatsappTarget,
        templateName: tmpl.templateName,
        components: tmpl.components,
      };
    }

    await this.send({
      userId,
      title: 'New Device Login',
      message: `Login from ${deviceName} at ${location}`,
      type: NotificationType.WARNING,
      category: 'security',
      link: '/settings',
      channels,
      emailOptions,
      smsOptions,
      whatsappOptions,
      isEssential: true, // Security alert - always send
    });
  }
}

export const notificationService = new NotificationService();
