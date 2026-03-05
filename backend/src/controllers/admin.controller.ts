import type { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { moderationService } from '../services/moderation.service';
import type { Role } from '@prisma/client';
import { AppError } from '../middleware/error';
import { schedulerQueue } from '../jobs/scheduler.queue';
import prisma from '../config/prisma';

/**
 * Get Dashboard Stats
 */
export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recent Activity
 */
export const getRecentActivity = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await adminService.getRecentActivity();
    res.status(200).json({
      status: 'success',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Users
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const role = req.query.role as Role | undefined;

    // Parse filters
    const filters: any = {};

    // Profile completeness filter
    if (req.query.profileCompletenessMin || req.query.profileCompletenessMax) {
      filters.profileCompleteness = {};
      if (req.query.profileCompletenessMin) filters.profileCompleteness.min = Number(req.query.profileCompletenessMin);
      if (req.query.profileCompletenessMax) filters.profileCompleteness.max = Number(req.query.profileCompletenessMax);
    }

    // Last active filter
    if (req.query.lastActive) {
      filters.lastActive = req.query.lastActive as 'week' | 'month' | 'quarter' | 'inactive';
    }

    // Verification filters
    if (req.query.verified) {
      const verifiedArray = Array.isArray(req.query.verified) ? req.query.verified : [req.query.verified];
      filters.verified = verifiedArray as ('email' | 'mobile' | 'whatsapp')[];
    }

    const result = await adminService.getUsers(role, page, limit, Object.keys(filters).length > 0 ? filters : undefined);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete User
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    await adminService.deleteUser(req.params.id as string, req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Moderate Job (Update Status)
 */
export const moderateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    // const job = await adminService.updateJobStatus(req.params.id, status);
    // Using Type Assertion for status if needed, but simple passing is fine locally
    const job = await adminService.updateJobStatus(req.params.id as string, status);

    res.status(200).json({
      status: 'success',
      message: 'Job status updated',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend User
 */
export const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    await adminService.suspendUser(req.params.id as string, req.user.id);
    res.status(200).json({ status: 'success', message: 'User suspended' });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate User
 */
export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    await adminService.activateUser(req.params.id as string, req.user.id);
    res.status(200).json({ status: 'success', message: 'User activated' });
  } catch (error) {
    next(error);
  }
};

/**
 * Update User Role
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { role } = req.body;
    await adminService.updateUserRole(req.params.id as string, role, req.user.id);
    res.status(200).json({ status: 'success', message: 'User role updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get User Details
 */
export const getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.getUserDetails(req.params.id as string);
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Detailed Analytics
 */
export const getDetailedAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'week' | 'month' | 'quarter') || 'month';
    const analytics = await adminService.getDetailedAnalytics(period);
    res.status(200).json({ status: 'success', data: analytics });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Audit Logs
 */
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      action: req.query.action as string | undefined,
      entity: req.query.entity as string | undefined,
      performedBy: req.query.performedBy as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const result = await adminService.getAuditLogs(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Comprehensive Stats
 */
export const getComprehensiveStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getComprehensiveStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Daily Active Users
 */
export const getDailyActiveUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query.days ? Math.min(parseInt(req.query.days as string, 10), 90) : 30;
    const data = await adminService.getDailyActiveUsers(days);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Jobs (Admin)
 */
export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
      companyId: req.query.companyId as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const result = await adminService.getAllJobs(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Job (Admin)
 */
export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    await adminService.deleteJob(req.params.id as string, req.user.id);
    res.status(200).json({ status: 'success', message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Flag Job
 */
export const flagJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { reason } = req.body;
    await adminService.flagJob(req.params.id as string, reason, req.user.id);
    res.status(200).json({ status: 'success', message: 'Job flagged' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Moderation Keywords
 */
export const getModerationKeywords = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const keywords = moderationService.getBlockedKeywords();
    res.status(200).json({ status: 'success', data: keywords });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Moderation Keyword
 */
export const addModerationKeyword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword } = req.body;
    if (!keyword || typeof keyword !== 'string') throw new AppError('Keyword is required', 400);
    moderationService.addKeyword(keyword);
    res.status(200).json({ status: 'success', message: 'Keyword added' });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Moderation Keyword
 */
export const removeModerationKeyword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword } = req.params;
    if (!keyword) throw new AppError('Keyword is required', 400);
    moderationService.removeKeyword(decodeURIComponent(keyword as string));
    res.status(200).json({ status: 'success', message: 'Keyword removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Applications (Admin)
 */
export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
      jobId: req.query.jobId as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const result = await adminService.getApplications(filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Application Stats (Admin)
 */
export const getApplicationStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getApplicationStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
};

// ── Export Job Monitoring ──

/**
 * List export jobs (active, waiting, completed, failed)
 */
export const getExportJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || 'active';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let jobs;
    switch (status) {
      case 'active':
        jobs = await schedulerQueue.getActive(start, end);
        break;
      case 'waiting':
        jobs = await schedulerQueue.getWaiting(start, end);
        break;
      case 'completed':
        jobs = await schedulerQueue.getCompleted(start, end);
        break;
      case 'failed':
        jobs = await schedulerQueue.getFailed(start, end);
        break;
      default:
        throw new AppError('Invalid status. Use: active, waiting, completed, failed', 400);
    }

    // Filter to export-data jobs only and enrich with user info
    const exportJobs = jobs.filter((j) => j.name === 'export-data');

    const userIds = [...new Set(exportJobs.map((j) => j.data?.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const items = exportJobs.map((j) => {
      const user = userMap.get(j.data?.userId);
      return {
        jobId: j.id,
        exportType: j.data?.exportType,
        format: j.data?.format,
        candidateCount: j.data?.candidateIds?.length || 0,
        userId: j.data?.userId,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
        userEmail: user?.email,
        userRole: user?.role,
        status,
        createdAt: j.timestamp ? new Date(j.timestamp).toISOString() : null,
        processedAt: j.processedOn ? new Date(j.processedOn).toISOString() : null,
        finishedAt: j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
        failedReason: j.failedReason || null,
        attempts: j.attemptsMade,
      };
    });

    const counts = await schedulerQueue.getJobCounts('active', 'waiting', 'completed', 'failed');

    res.status(200).json({
      status: 'success',
      data: { items, counts, page, limit },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel/remove a specific export job
 */
export const cancelExportJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId as string;
    if (!jobId) throw new AppError('Job ID is required', 400);

    const job = await schedulerQueue.getJob(jobId);
    if (!job || job.name !== 'export-data') {
      throw new AppError('Export job not found', 404);
    }

    const state = await job.getState();

    if (state === 'active') {
      // Move to failed state so the worker stops processing
      await job.moveToFailed(new Error('Cancelled by admin'), job.token || '0');
    } else if (state === 'waiting' || state === 'delayed') {
      await job.remove();
    } else {
      throw new AppError(`Cannot cancel job in "${state}" state`, 400);
    }

    res.status(200).json({
      status: 'success',
      message: `Export job ${jobId} ${state === 'active' ? 'stopped' : 'removed'}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's applications
 */
export const getUserApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await adminService.getUserApplications(userId, page, limit);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's jobs
 */
export const getUserJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await adminService.getUserJobs(userId, page, limit);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's verifications
 */
export const getUserVerifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await adminService.getUserVerifications(userId, page, limit);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Update verification status
 */
export const updateVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const verificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, reason } = req.body;
    await adminService.updateVerificationStatus(verificationId, status, req.user.id, reason);
    res.status(200).json({ status: 'success', message: 'Verification updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * Update candidate profile (admin edit)
 */
export const updateCandidateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await adminService.updateCandidateProfile(userId, req.body, req.user.id);
    res.status(200).json({ status: 'success', message: 'Candidate profile updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * Update company profile (admin edit)
 */
export const updateCompanyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await adminService.updateCompanyProfile(userId, req.body, req.user.id);
    res.status(200).json({ status: 'success', message: 'Company profile updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk export users
 */
export const bulkExportUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { userIds, format } = req.body;
    const result = await adminService.bulkExportUsers(userIds, req.user.id, format);
    res.status(200).json({ status: 'success', data: result, message: 'Export queued. You will receive an email.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk notify users
 */
export const bulkNotifyUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { userIds, notification } = req.body;
    const result = await adminService.bulkNotifyUsers(userIds, req.user.id, notification);
    res.status(200).json({ status: 'success', data: result, message: `Notifications sent to ${result.count} users` });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk suspend users
 */
export const bulkSuspendUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { userIds, reason } = req.body;
    const result = await adminService.bulkSuspendUsers(userIds, req.user.id, reason);
    res.status(200).json({ status: 'success', data: result, message: `${result.count} users suspended` });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk activate users
 */
export const bulkActivateUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authorized', 401);
    const { userIds } = req.body;
    const result = await adminService.bulkActivateUsers(userIds, req.user.id);
    res.status(200).json({ status: 'success', data: result, message: `${result.count} users activated` });
  } catch (error) {
    next(error);
  }
};
