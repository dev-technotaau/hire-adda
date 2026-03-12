import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import { VerificationStatus, VerificationType, Role } from '@prisma/client';
import { uploadFileToR2 } from './storage.service';
import {  } from '../kafka/producer';
import { publishEvent } from '../kafka/producer';
import { KafkaTopics } from '../kafka/topics';

export class VerificationService {
  /**
   * Request Verification (Candidate or Employer)
   */
  async requestVerification(
    userId: string,
    type: VerificationType,
    file?: Express.Multer.File,
    data?: any
  ) {
    // 1. Check if pending request exists
    const existing = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        type,
        status: VerificationStatus.PENDING,
      },
    });

    if (existing) {
      throw new AppError('A pending verification request of this type already exists', 400);
    }

    let documentUrl: string | undefined;

    // 2. Upload Document to R2
    if (file) {
      const { url } = await uploadFileToR2(
        file.buffer,
        file.originalname,
        'verification-docs',
        file.mimetype
      );
      documentUrl = url;
    }

    // 3. Create Request
    const request = await prisma.verificationRequest.create({
      data: {
        userId,
        type,
        status: VerificationStatus.PENDING,
        documentUrl,
        data: data ? JSON.stringify(data) : undefined,
      },
    });

    // Notify user about submission acknowledgment
    void import('./notification.service')
      .then(({ notificationService }) => {
        return notificationService.notifyVerificationSubmitted(userId, type);
      })
      .catch(() => {});

    // Notify all admins about new verification request (multi-channel)
    void import('./notification.service')
      .then(({ notificationService }) => {
        return notificationService.notifyAdminsNewVerification(userId, type, request.id);
      })
      .catch(() => {});

    // Publish Kafka event
    publishEvent(KafkaTopics.VERIFICATION_SUBMITTED, userId, {
      userId,
      requestId: request.id,
      type,
    }).catch(() => {});

    return request;
  }

  /**
   * Get all pending verifications (Admin)
   */
  async getPendingVerifications(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.verificationRequest.findMany({
        where: { status: VerificationStatus.PENDING },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              companyProfile: { select: { companyName: true, gstNumber: true } },
              candidateProfile: { select: { id: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.verificationRequest.count({ where: { status: VerificationStatus.PENDING } }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return { items, total, page, limit, totalPages, hasMore: page < totalPages };
  }

  /**
   * Review Verification (Admin)
   */
  async reviewVerification(
    requestId: string,
    adminId: string,
    status: VerificationStatus,
    comments?: string
  ) {
    if (status === VerificationStatus.PENDING) {
      throw new AppError('Cannot update status to PENDING', 400);
    }

    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new AppError('Verification request not found', 404);
    }

    // Update Request
    const updatedRequest = await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminComments: comments,
      },
    });

    // If Approved, update related profile flags
    if (status === VerificationStatus.APPROVED) {
      if (request.type === VerificationType.GST && request.user.role === Role.EMPLOYER) {
        await prisma.companyProfile.update({
          where: { userId: request.userId },
          data: { isVerified: true },
        });
        // Publish company verified event
        publishEvent(KafkaTopics.COMPANY_VERIFIED, request.userId, {
          userId: request.userId,
          requestId,
          type: request.type,
        }).catch(() => {});
      }
      // Add other logic for Candidate Identity etc.
    }

    // Notify user about verification status change (multi-channel with proper email)
    try {
      const { notificationService } = await import('./notification.service');
      const statusText = status === 'APPROVED' ? 'approved' : 'rejected';
      await notificationService.notifyVerificationReviewed(
        request.userId,
        request.type,
        statusText as 'approved' | 'rejected',
        comments || undefined
      );
    } catch {
      /* non-critical */
    }

    // Publish Kafka event
    const kafkaEvent = status === VerificationStatus.APPROVED
      ? KafkaTopics.VERIFICATION_APPROVED
      : KafkaTopics.VERIFICATION_REJECTED;
    publishEvent(kafkaEvent, request.userId, {
      userId: request.userId,
      requestId,
      status,
      type: request.type,
    }).catch(() => {});

    return updatedRequest;
  }

  /**
   * Get user's own verification requests
   */
  async getUserVerifications(userId: string) {
    return prisma.verificationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all verifications with filters (Admin)
   */
  async getAllVerifications(filters: {
    type?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    const [requests, total] = await prisma.$transaction([
      prisma.verificationRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              companyProfile: { select: { companyName: true, gstNumber: true } },
            },
          },
          reviewer: { select: { email: true, firstName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return { items: requests, total, page, limit, totalPages, hasMore: page < totalPages };
  }

  /**
   * Get verification statistics (Admin)
   */
  async getVerificationStats() {
    const [byStatus, byType] = await prisma.$transaction([
      prisma.verificationRequest.groupBy({
        by: ['status'],
        orderBy: { status: 'asc' },
        _count: true,
      }),
      prisma.verificationRequest.groupBy({ by: ['type'], orderBy: { type: 'asc' }, _count: true }),
    ]);

    return {
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byType: Object.fromEntries(byType.map((s) => [s.type, s._count])),
    };
  }

  /**
   * Escalate verification request (Admin)
   */
  async escalateVerification(requestId: string, adminId: string, reason: string) {
    const request = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError('Verification request not found', 404);

    return prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        escalatedAt: new Date(),
        escalatedBy: adminId,
        escalationReason: reason,
        priority: 'HIGH',
      },
    });
  }

  /**
   * Send employment verification contact email
   */
  async sendEmploymentVerificationContact(
    requestId: string,
    adminId: string,
    contactData: {
      contactName: string;
      contactEmail: string;
      companyName: string;
      candidateName: string;
      employmentPeriod: string;
      role: string;
    }
  ) {
    const request = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError('Verification request not found', 404);
    if (request.type !== VerificationType.EMPLOYMENT) {
      throw new AppError('This action is only available for employment verifications', 400);
    }

    const { randomBytes } = await import('crypto');
    const token = randomBytes(32).toString('hex');

    const frontendUrl = process.env.FRONTEND_URL || 'https://talentbridge.com';
    const confirmUrl = `${frontendUrl}/verify-employment/${token}?action=confirm`;
    const denyUrl = `${frontendUrl}/verify-employment/${token}?action=deny`;

    // Store contact data + token in JSON data field
    const existingData = (request.data as Record<string, unknown>) || {};
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        data: {
          ...existingData,
          employmentContact: {
            ...contactData,
            token,
            sentAt: new Date().toISOString(),
            sentBy: adminId,
          },
        },
      },
    });

    // Send email
    const { employmentVerificationRequest: emailTemplate } =
      await import('../templates/email/employment-verification');
    const template = emailTemplate(
      contactData.contactName,
      contactData.candidateName,
      contactData.companyName,
      contactData.role,
      contactData.employmentPeriod,
      confirmUrl,
      denyUrl
    );

    const { emailService } = await import('./email.service');
    await emailService.sendEmail({
      to: contactData.contactEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return { message: 'Verification contact email sent' };
  }

  /**
   * Process employer response to employment verification
   */
  async processEmployerResponse(token: string, action: 'confirm' | 'deny', comments?: string) {
    const requests = await prisma.verificationRequest.findMany({
      where: { type: VerificationType.EMPLOYMENT },
    });

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const request = requests.find((r) => {
      const data = r.data as Record<string, any> | null;
      return data?.employmentContact?.token === token;
    });

    if (!request) throw new AppError('Invalid or expired verification token', 404);

    const data = request.data as Record<string, any>;
    if (data.employmentContact?.responded) {
      throw new AppError('This verification has already been responded to', 400);
    }

    const newStatus =
      action === 'confirm' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;

    await prisma.verificationRequest.update({
      where: { id: request.id },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        adminComments:
          comments ||
          (action === 'confirm'
            ? 'Employment confirmed by previous employer'
            : 'Employment denied by previous employer'),
        data: {
          ...data,
          employmentContact: {
            ...data.employmentContact,
            responded: true,
            responseAction: action,
            responseComments: comments,
            respondedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Notify the candidate (multi-channel with proper email)
    try {
      const { notificationService } = await import('./notification.service');
      await notificationService.notifyVerificationReviewed(
        request.userId,
        'EMPLOYMENT',
        action === 'confirm' ? 'approved' : 'rejected',
        comments || undefined
      );
    } catch {
      /* non-critical */
    }

    return { action, status: newStatus };
  }

  /**
   * Set SLA deadline for a verification request
   */
  async setSlaDeadline(requestId: string, _adminId: string, deadline: string) {
    const request = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError('Verification request not found', 404);

    return prisma.verificationRequest.update({
      where: { id: requestId },
      data: { slaDeadline: new Date(deadline) },
    });
  }

  /**
   * Set approval chain for a verification request
   */
  async setApprovalChain(requestId: string, chain: Array<{ level: number; approverId: string }>) {
    const request = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError('Verification request not found', 404);

    return prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        approvalChain: chain,
        currentApprovalLevel: 1,
      },
    });
  }

  /**
   * Approve at current level in approval chain
   */
  async approveAtLevel(requestId: string, adminId: string, comments?: string) {
    const request = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError('Verification request not found', 404);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const chain = (request.approvalChain as any[]) || [];
    const currentLevel = request.currentApprovalLevel || 1;
    const currentStep = chain.find((s: any) => s.level === currentLevel);

    if (!currentStep) throw new AppError('No approval step found for current level', 400);
    if (currentStep.approverId !== adminId) {
      throw new AppError('You are not the designated approver for this level', 403);
    }

    // Mark current level as approved
    const updatedChain = chain.map((s: any) =>
      s.level === currentLevel ? { ...s, approvedAt: new Date().toISOString(), comments } : s
    );

    const maxLevel = Math.max(...chain.map((s: any) => s.level));
    const isLastLevel = currentLevel >= maxLevel;

    const updateData: any = {
      approvalChain: updatedChain,
    };

    if (isLastLevel) {
      // Final approval — mark as approved
      updateData.status = VerificationStatus.APPROVED;
      updateData.reviewedBy = adminId;
      updateData.reviewedAt = new Date();
      updateData.adminComments = comments || 'Approved through approval chain';
    } else {
      updateData.currentApprovalLevel = currentLevel + 1;
    }

    const updated = await prisma.verificationRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    // If final approval, update profile flags
    if (isLastLevel) {
      if (request.type === 'GST') {
        await prisma.companyProfile.updateMany({
          where: { userId: request.userId },
          data: { isVerified: true },
        });
      }
    }

    return updated;
  }

  /**
   * Check SLA breaches and auto-escalate (called by worker)
   */
  async checkSlaBreaches() {
    const breached = await prisma.verificationRequest.findMany({
      where: {
        status: VerificationStatus.PENDING,
        slaDeadline: { lt: new Date() },
        autoEscalated: false,
      },
    });

    for (const request of breached) {
      await prisma.verificationRequest.update({
        where: { id: request.id },
        data: {
          autoEscalated: true,
          priority: 'URGENT',
        },
      });
    }

    return { escalated: breached.length };
  }
}

export const verificationService = new VerificationService();
