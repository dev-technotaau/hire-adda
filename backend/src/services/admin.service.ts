import { prisma } from '../config/prisma';
import { Role, JobStatus, VerificationStatus } from '@prisma/client';
import { AppError } from '../middleware/error';

const VALID_AUDIT_ACTIONS = new Set([
  'PASSWORD_CHANGE',
  'REQUEST_ACCOUNT_DELETION',
  'DELETE_USER',
  'SUSPEND_USER',
  'ACTIVATE_USER',
  'UPDATE_USER_ROLE',
  'CREATE_USER',
  'UPDATE_USER_PROFILE',
  'SEND_PASSWORD_RESET_OTP',
  'ADMIN_RESET_PASSWORD',
  'DEACTIVATE_USER',
  'UPLOAD_USER_AVATAR',
  'REMOVE_USER_AVATAR',
  'REVOKE_USER_SESSIONS',
  'PROFILE_UPDATE',
  'RESUME_UPLOAD',
  'JOB_CREATE',
  'JOB_UPDATE',
  'JOB_CLOSE',
  'DELETE_JOB',
  'MODERATE_JOB',
  'FLAG_JOB',
  'APPLICATION_SHORTLIST',
  'APPLICATION_SELECT',
  'VERIFICATION_APPROVE',
  'VERIFICATION_REJECT',
  'VERIFICATION_REQUEST_CHANGES',
  'VERIFICATION_ESCALATE',
  'VERIFICATION_LEVEL_APPROVE',
  'EMPLOYMENT_VERIFICATION_CONTACT',
  'TICKET_ASSIGN',
  'TICKET_STATUS_CHANGE',
]);

const VALID_AUDIT_ENTITIES = new Set([
  'User',
  'CandidateProfile',
  'CompanyProfile',
  'JobPost',
  'JobApplication',
  'Verification',
  'SupportTicket',
]);

export class AdminService {
  /**
   * Get High-Level Dashboard Stats
   */
  async getDashboardStats() {
    const [
      totalCandidates,
      totalEmployers,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingVerifications,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { role: Role.CANDIDATE } }),
      prisma.user.count({ where: { role: Role.EMPLOYER } }),
      prisma.jobPost.count(),
      prisma.jobPost.count({ where: { status: JobStatus.OPEN } }),
      prisma.jobApplication.count(),
      prisma.verificationRequest.count({ where: { status: VerificationStatus.PENDING } }),
    ]);

    return {
      users: {
        candidates: totalCandidates,
        employers: totalEmployers,
        total: totalCandidates + totalEmployers, // excludes admins roughly
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        closed: totalJobs - activeJobs, // simple approx
      },
      applications: {
        total: totalApplications,
      },
      verifications: {
        pending: pendingVerifications,
      },
    };
  }

  /**
   * Get Recent Activity
   */
  async getRecentActivity() {
    const [recentUsers, recentJobs, recentApplications] = await prisma.$transaction([
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, createdAt: true, firstName: true },
      }),
      prisma.jobPost.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          company: { select: { companyName: true } },
          createdAt: true,
        },
      }),
      prisma.jobApplication.findMany({
        take: 5,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          status: true,
          job: { select: { title: true } },
          candidate: { select: { user: { select: { email: true } } } },
        },
      }),
    ]);

    return {
      users: recentUsers,
      jobs: recentJobs,
      applications: recentApplications,
    };
  }

  /**
   * Get All Users (Admin)
   */
  async getUsers(role?: Role, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          isEmailVerified: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return { items: users, total, page, limit, totalPages, hasMore: page < totalPages };
  }

  /**
   * Delete User (Admin)
   */
  async deleteUser(userId: string, requestingAdminId: string) {
    if (userId === requestingAdminId) {
      throw new AppError('Cannot delete your own account', 400);
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.role === Role.SUPER_ADMIN) {
      throw new AppError('Cannot delete a super admin', 403);
    }
    await prisma.user.delete({ where: { id: userId } });
  }

  /**
   * Moderate Job (Admin)
   */
  async updateJobStatus(jobId: string, status: JobStatus) {
    return await prisma.jobPost.update({
      where: { id: jobId },
      data: { status },
    });
  }

  /**
   * Suspend User
   */
  async suspendUser(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.role === Role.SUPER_ADMIN) throw new AppError('Cannot suspend a super admin', 403);
    if (user.id === adminId) throw new AppError('Cannot suspend yourself', 400);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isSuspended: true, suspendedAt: new Date(), suspendedBy: adminId },
      }),
      prisma.auditLog.create({
        data: { action: 'SUSPEND_USER', entity: 'User', entityId: userId, performedBy: adminId },
      }),
    ]);

    // Notify the suspended user
    void import('./notification.service')
      .then(({ notificationService }) => {
        return notificationService.notifyUserSuspended(userId);
      })
      .catch(() => {});
  }

  /**
   * Activate User
   */
  async activateUser(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isSuspended: false, isActive: true, suspendedAt: null, suspendedBy: null },
      }),
      prisma.auditLog.create({
        data: { action: 'ACTIVATE_USER', entity: 'User', entityId: userId, performedBy: adminId },
      }),
    ]);

    // Notify the reactivated user
    void import('./notification.service')
      .then(({ notificationService }) => {
        return notificationService.notifyUserActivated(userId);
      })
      .catch(() => {});
  }

  /**
   * Update User Role
   */
  async updateUserRole(userId: string, newRole: Role, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.role === Role.SUPER_ADMIN) throw new AppError('Cannot change super admin role', 403);

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== Role.SUPER_ADMIN && newRole === Role.ADMIN) {
      throw new AppError('Only super admin can promote to admin', 403);
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { role: newRole } }),
      prisma.auditLog.create({
        data: {
          action: 'UPDATE_USER_ROLE',
          entity: 'User',
          entityId: userId,
          performedBy: adminId,
          details: { oldRole: user.role, newRole },
        },
      }),
    ]);
  }

  /**
   * Get User Details
   */
  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isEmailVerified: true,
        isMobileVerified: true,
        isWhatsappVerified: true,
        isActive: true,
        isSuspended: true,
        suspendedAt: true,
        mobileNumber: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
        loginAttempts: true,
        lockUntil: true,
        candidateProfile: true,
        companyProfile: true,
        _count: { select: { savedJobs: true, verificationRequests: true, sessions: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  /**
   * Get Detailed Analytics
   */
  async getDetailedAnalytics(period: 'week' | 'month' | 'quarter') {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const [
      newRegistrations,
      activeUsers,
      newJobs,
      totalApplications,
      applicationsByStatus,
      candidateProfiles,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: startDate } } }),
      prisma.jobPost.count({ where: { createdAt: { gte: startDate } } }),
      prisma.jobApplication.count({ where: { appliedAt: { gte: startDate } } }),
      prisma.jobApplication.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: true }),
      prisma.candidateProfile.findMany({
        select: { skills: true, currentLocation: true },
        take: 1000,
      }),
    ]);

    // Aggregate top skills
    const skillCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    candidateProfiles.forEach((p) => {
      p.skills.forEach((s) => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
      if (p.currentLocation) {
        locationCounts[p.currentLocation] = (locationCounts[p.currentLocation] || 0) + 1;
      }
    });

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count }));
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([location, count]) => ({ location, count }));

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      newRegistrations,
      activeUsers,
      newJobs,
      totalApplications,
      applicationsByStatus: Object.fromEntries(
        applicationsByStatus.map((s) => [s.status, s._count])
      ),
      topSkills,
      topLocations,
    };
  }

  /**
   * Get Audit Logs
   */
  async getAuditLogs(filters: {
    action?: string;
    entity?: string;
    performedBy?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const cappedLimit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * cappedLimit;
    const where: any = {};

    if (filters.action) {
      if (!VALID_AUDIT_ACTIONS.has(filters.action)) {
        throw new AppError('Invalid audit action filter', 400, 'INVALID_AUDIT_ACTION');
      }
      where.action = filters.action;
    }
    if (filters.entity) {
      if (!VALID_AUDIT_ENTITIES.has(filters.entity)) {
        throw new AppError('Invalid audit entity filter', 400, 'INVALID_AUDIT_ENTITY');
      }
      where.entity = filters.entity;
    }
    if (filters.performedBy) where.performedBy = filters.performedBy;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: cappedLimit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / cappedLimit) || 1;
    return { items: logs, total, page, limit: cappedLimit, totalPages, hasMore: page < totalPages };
  }

  /**
   * Get Comprehensive Platform Statistics
   */
  async getComprehensiveStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalCandidates,
      totalEmployers,
      totalAdmins,
      newUsersWeek,
      newUsersMonth,
      totalJobs,
      activeJobs,
      expiredJobs,
      newJobsWeek,
      newJobsMonth,
      totalApplications,
      appsWeek,
      verificationsPending,
      verificationsApproved,
      verificationsRejected,
      activeUsersWeek,
      candidateProfiles,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CANDIDATE' } }),
      prisma.user.count({ where: { role: 'EMPLOYER' } }),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.jobPost.count(),
      prisma.jobPost.count({ where: { status: 'OPEN' } }),
      prisma.jobPost.count({ where: { status: 'EXPIRED' } }),
      prisma.jobPost.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.jobPost.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.jobApplication.count(),
      prisma.jobApplication.count({ where: { appliedAt: { gte: weekAgo } } }),
      prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
      prisma.verificationRequest.count({ where: { status: 'APPROVED' } }),
      prisma.verificationRequest.count({ where: { status: 'REJECTED' } }),
      prisma.user.count({ where: { lastActiveAt: { gte: weekAgo } } }),
      prisma.candidateProfile.findMany({
        select: { skills: true, currentLocation: true },
        take: 1000,
      }),
    ]);

    // Aggregate top skills and top locations
    const skillCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    candidateProfiles.forEach((p) => {
      p.skills.forEach((s) => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
      if (p.currentLocation) {
        locationCounts[p.currentLocation] = (locationCounts[p.currentLocation] || 0) + 1;
      }
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count }));
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([location, count]) => ({ location, count }));

    // Registration trends (daily for last 30 days)
    const registrationTrends: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      registrationTrends.push({ date: dayStart.toISOString().split('T')[0], count: 0 });
    }
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: monthAgo } },
      select: { createdAt: true },
    });
    recentUsers.forEach((u) => {
      const dateKey = u.createdAt.toISOString().split('T')[0];
      const entry = registrationTrends.find((t) => t.date === dateKey);
      if (entry) entry.count++;
    });

    return {
      users: {
        total: totalUsers,
        candidates: totalCandidates,
        employers: totalEmployers,
        admins: totalAdmins,
        newThisWeek: newUsersWeek,
        newThisMonth: newUsersMonth,
        activeThisWeek: activeUsersWeek,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        expired: expiredJobs,
        newThisWeek: newJobsWeek,
        newThisMonth: newJobsMonth,
      },
      applications: {
        total: totalApplications,
        thisWeek: appsWeek,
        conversionRate: totalJobs > 0 ? +(totalApplications / totalJobs).toFixed(2) : 0,
      },
      verifications: {
        pending: verificationsPending,
        approved: verificationsApproved,
        rejected: verificationsRejected,
      },
      topSkills,
      topLocations,
      registrationTrends,
    };
  }

  /**
   * Get Daily Active Users Breakdown
   */
  async getDailyActiveUsers(days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const activeUsers = await prisma.user.findMany({
      where: { lastActiveAt: { gte: startDate, lt: endDate } },
      select: { lastActiveAt: true, role: true },
    });

    const results: { date: string; total: number; candidates: number; employers: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dateStr = dayStart.toISOString().split('T')[0];

      let total = 0,
        candidates = 0,
        employers = 0;
      for (const u of activeUsers) {
        if (u.lastActiveAt && u.lastActiveAt >= dayStart && u.lastActiveAt < dayEnd) {
          total++;
          if (u.role === 'CANDIDATE') candidates++;
          else if (u.role === 'EMPLOYER') employers++;
        }
      }
      results.push({ date: dateStr, total, candidates, employers });
    }

    return results;
  }

  /**
   * Get All Jobs (Admin) - Server-side filtering
   */
  async getAllJobs(filters: {
    keyword?: string;
    status?: string;
    companyId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { company: { companyName: { contains: filters.keyword, mode: 'insensitive' } } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [jobs, total] = await prisma.$transaction([
      prisma.jobPost.findMany({
        where,
        include: {
          company: { select: { id: true, companyName: true, logo: true, isVerified: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobPost.count({ where }),
    ]);

    return {
      items: jobs.map((j) => ({
        ...j,
        _applicationCount: j._count.applications,
        _count: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Delete Job (Admin)
   */
  async deleteJob(jobId: string, adminId: string) {
    const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
    if (!job) throw new AppError('Job not found', 404);

    await prisma.$transaction([
      prisma.jobPost.delete({ where: { id: jobId } }),
      prisma.auditLog.create({
        data: {
          action: 'DELETE_JOB',
          entity: 'JobPost',
          entityId: jobId,
          performedBy: adminId,
          details: { title: job.title },
        },
      }),
    ]);

    // Clean up ES index (fire-and-forget)
    const { searchService } = await import('./search.service');
    searchService.deleteJob(jobId).catch(() => {});
  }

  /**
   * Flag Job
   */
  async flagJob(jobId: string, reason: string, adminId: string) {
    const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
    if (!job) throw new AppError('Job not found', 404);

    await prisma.$transaction([
      prisma.jobPost.update({ where: { id: jobId }, data: { status: JobStatus.DRAFT } }),
      prisma.auditLog.create({
        data: {
          action: 'FLAG_JOB',
          entity: 'JobPost',
          entityId: jobId,
          performedBy: adminId,
          details: { reason },
        },
      }),
    ]);
  }

  /**
   * Get All Applications (Admin) - Server-side filtering
   */
  async getApplications(filters: {
    keyword?: string;
    status?: string;
    jobId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.dateFrom || filters.dateTo) {
      where.appliedAt = {};
      if (filters.dateFrom) where.appliedAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.appliedAt.lte = new Date(filters.dateTo);
    }
    if (filters.keyword) {
      where.OR = [
        { job: { title: { contains: filters.keyword, mode: 'insensitive' } } },
        { candidate: { user: { email: { contains: filters.keyword, mode: 'insensitive' } } } },
        { candidate: { user: { firstName: { contains: filters.keyword, mode: 'insensitive' } } } },
      ];
    }

    const [applications, total] = await prisma.$transaction([
      prisma.jobApplication.findMany({
        where,
        include: {
          job: { select: { id: true, title: true, company: { select: { companyName: true } } } },
          candidate: {
            select: {
              user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    return {
      items: applications.map((a) => ({
        id: a.id,
        status: a.status,
        appliedAt: a.appliedAt,
        jobTitle: a.job.title,
        companyName: a.job.company?.companyName || 'Unknown',
        candidateName:
          [a.candidate.user.firstName, a.candidate.user.lastName].filter(Boolean).join(' ') ||
          'Unknown',
        candidateEmail: a.candidate.user.email,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get Application Stats (Admin)
   */
  async getApplicationStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, byStatus, dailyTrend] = await prisma.$transaction([
      prisma.jobApplication.count(),
      prisma.jobApplication.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: true }),
      prisma.jobApplication.findMany({
        where: { appliedAt: { gte: thirtyDaysAgo } },
        select: { appliedAt: true },
      }),
    ]);

    // Build daily trend
    const dailyCounts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      dailyCounts[d.toISOString().split('T')[0]] = 0;
    }
    dailyTrend.forEach((a) => {
      const key = a.appliedAt.toISOString().split('T')[0];
      if (dailyCounts[key] !== undefined) dailyCounts[key]++;
    });

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      dailyTrend: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
    };
  }
}

export const adminService = new AdminService();
