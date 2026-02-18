import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { moderationService } from '../services/moderation.service';
import { Role } from '@prisma/client';
import { AppError } from '../middleware/error';

/**
 * Get Dashboard Stats
 */
export const getDashboardStats = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.status(200).json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Recent Activity
 */
export const getRecentActivity = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const activity = await adminService.getRecentActivity();
        res.status(200).json({
            status: 'success',
            data: activity
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Users
 */
export const getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const role = req.query.role as Role | undefined;

        const result = await adminService.getUsers(role, page, limit);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete User
 */
export const deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await adminService.deleteUser(req.params.id as string, req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Moderate Job (Update Status)
 */
export const moderateJob = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { status } = req.body;
        // const job = await adminService.updateJobStatus(req.params.id, status);
        // Using Type Assertion for status if needed, but simple passing is fine locally
        const job = await adminService.updateJobStatus(req.params.id as string, status);

        res.status(200).json({
            status: 'success',
            message: 'Job status updated',
            data: { job }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Suspend User
 */
export const suspendUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
export const activateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
export const updateUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
export const getUserDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
export const getDetailedAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
export const getAuditLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
    } catch (error) { next(error); }
};

/**
 * Get Daily Active Users
 */
export const getDailyActiveUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
export const getAllJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
export const deleteJob = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
export const flagJob = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
    } catch (error) { next(error); }
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
    } catch (error) { next(error); }
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
    } catch (error) { next(error); }
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
    } catch (error) { next(error); }
};

/**
 * Get Application Stats (Admin)
 */
export const getApplicationStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await adminService.getApplicationStats();
        res.status(200).json({ status: 'success', data: stats });
    } catch (error) { next(error); }
};
